package igalileo

import java.nio.charset.StandardCharsets.UTF_8
import java.security.MessageDigest
import java.time.Instant
import java.util.UUID

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.{ClassTagExtensions, DefaultScalaModule}

import org.zeromq.ZMQ
import org.zeromq.ZMQ.Socket

// A Jupyter message (wire protocol 5.3).
// idents are the ZeroMQ routing identities: raw bytes, they must be sent back untouched
case class Message(
    idents: List[ Array[ Byte ] ],
    header: Map[ String, Any ],
    parentHeader: Map[ String, Any ],
    metadata: Map[ String, Any ],
    content: Map[ String, Any ] ) {

  def msgType: String = header.getOrElse( "msg_type", "" ).toString

  def string( key: String, default: String = "" ): String = content.get( key ) match {
    case Some( s: String ) => s
    case _ => default
  }

  def bool( key: String, default: Boolean ): Boolean = content.get( key ) match {
    case Some( b: java.lang.Boolean ) => b.booleanValue
    case _ => default
  }

  def int( key: String, default: Int ): Int = content.get( key ) match {
    case Some( n: java.lang.Number ) => n.intValue
    case _ => default
  }
}

object Json {
  val mapper = new ObjectMapper() with ClassTagExtensions
  mapper.registerModule( DefaultScalaModule )

  def read( s: String ): Map[ String, Any ] =
    if ( s == null || s.trim.isEmpty ) Map() else mapper.readValue[ Map[ String, Any ] ]( s )

  def write( m: Map[ String, Any ] ): String = mapper.writeValueAsString( m )
}

// HMAC signing of messages, as configured by the connection file
class Signer( key: String, scheme: String ) {
  private val algorithm = scheme match {
    case "hmac-sha256" | "" => "HmacSHA256"
    case "hmac-sha512" => "HmacSHA512"
    case "hmac-sha1" => "HmacSHA1"
    case "hmac-md5" => "HmacMD5"
    case other => throw new IllegalArgumentException( "Unsupported signature scheme " + other )
  }

  private val mac: Option[ Mac ] =
    if ( key.isEmpty ) None // Jupyter: an empty key disables signing
    else {
      val m = Mac.getInstance( algorithm )
      m.init( new SecretKeySpec( key.getBytes( UTF_8 ), algorithm ) )
      Some( m )
    }

  def sign( parts: Seq[ String ] ): String = mac match {
    case None => ""
    case Some( m ) => m.synchronized {
      parts.foreach( p => m.update( p.getBytes( UTF_8 ) ) )
      m.doFinal().map( b => f"${b & 0xff}%02x" ).mkString
    }
  }

  def verify( signature: String, parts: Seq[ String ] ): Boolean =
    mac.isEmpty || MessageDigest.isEqual( signature.getBytes( UTF_8 ), sign( parts ).getBytes( UTF_8 ) )
}

// Reading and writing messages on a ZeroMQ socket
class Channel( val socket: Socket, signer: Signer, session: String ) {
  private val Delimiter = "<IDS|MSG>"
  private val DelimiterBytes = Delimiter.getBytes( UTF_8 )

  // Blocks until a message arrives. None when the message is malformed or wrongly signed
  def recv(): Option[ Message ] = {
    val frames = socket.synchronized {
      val buf = scala.collection.mutable.ListBuffer[ Array[ Byte ] ]( socket.recv( 0 ) )
      while ( socket.hasReceiveMore ) buf += socket.recv( 0 )
      buf.toList
    }
    val ( idents, rest ) = frames.span( f => !java.util.Arrays.equals( f, DelimiterBytes ) )
    rest.drop( 1 ).map( new String( _, UTF_8 ) ) match {
      case signature :: header :: parent :: metadata :: content :: _ =>
        if ( !signer.verify( signature, Seq( header, parent, metadata, content ) ) ) {
          Log( "dropping message with an invalid signature" )
          None
        } else
          Some( Message( idents, Json.read( header ), Json.read( parent ), Json.read( metadata ), Json.read( content ) ) )
      case _ =>
        Log( "dropping malformed message with " + frames.size + " frames" )
        None
    }
  }

  def send( message: Message ): Unit = {
    val header = Map(
      "msg_id" -> UUID.randomUUID.toString,
      "session" -> session,
      "username" -> "igalileo",
      "date" -> Instant.now.toString,
      "version" -> "5.3"
    ) ++ message.header
    val parts = Seq( Json.write( header ), Json.write( message.parentHeader ), Json.write( message.metadata ), Json.write( message.content ) )
    val signature = signer.sign( parts )
    socket.synchronized {
      message.idents.foreach( id => socket.send( id, ZMQ.SNDMORE ) )
      socket.send( Delimiter, ZMQ.SNDMORE )
      socket.send( signature, ZMQ.SNDMORE )
      parts.init.foreach( p => socket.send( p, ZMQ.SNDMORE ) )
      socket.send( parts.last, 0 )
    }
  }
}

object Log {
  // stdout/stderr end up in the Jupyter server log, not in the notebook
  def apply( s: String ): Unit = System.err.println( "[igalileo] " + s )
}

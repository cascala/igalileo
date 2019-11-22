package igalileo

import java.time.Instant

import org.zeromq.ZMQ.Socket
import org.zeromq.ZMQ

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import com.fasterxml.jackson.module.scala.experimental.ScalaObjectMapper

trait Bus extends Thread {
    private val DELIMITER = "<IDS|MSG>"
    private var running = true
    
    // Message contain six pieces
    def recv(): Option[ Message ] = {
        val (idents, signature, header, parent_header, metadata, content) = socket.synchronized {
            (LazyList.continually { socket.recvStr() }.takeWhile(_ != DELIMITER).toList,
             socket.recvStr(),
             socket.recvStr(),
             socket.recvStr(),
             socket.recvStr(),
             socket.recvStr())
        }

        val expectedSignature = Signature( header, parent_header, metadata, content)

        if (signature != expectedSignature) 
            None
        //logger.error(s"Invalid HMAC signature, got $signature, expected $expectedSignature")
            
        val mapper = new ObjectMapper() with ScalaObjectMapper
        mapper.registerModule( DefaultScalaModule ) 
        Some( Message( 
            idents,
            mapper.readValue[ Map[ String, Object ] ]( header ), 
            mapper.readValue[ Map[ String, Object ] ]( parent_header),
            mapper.readValue[ Map[ String, Object ] ]( content )
        ) )
    }

    def send( message: Message ) : Unit = {
        //require( message.idents.nonEmpty ) // 0mq does not work without idents 
        
        val mapper = new ObjectMapper() with ScalaObjectMapper
        mapper.registerModule( DefaultScalaModule ) 

        val header = message.header ++ Map( 
            "msg_id" -> java.util.UUID.randomUUID.toString(), 
            "version" -> "5.3",
            "session" -> Session()
            // "username" -> "" // Optional, apparently
            // "date" -> Instant.now().toString() // Optional, apparently
        )

        val hs = mapper.writeValueAsString( header ) // Header String
        val ps = mapper.writeValueAsString( message.parent_header ) // Parent header String
        val ms = "{}" // Metadata String
        val cs = mapper.writeValueAsString( message.content ) // Content String
        
        val ss = Signature( hs, ps, ms, cs ) // Signature string 

        socket.synchronized {
            //logger.debug(s"sending: $msg")
            message.idents.foreach(socket.send( _, ZMQ.SNDMORE ) ) // Identies
            socket.send( DELIMITER, ZMQ.SNDMORE )
            socket.send( ss, ZMQ.SNDMORE ) 
            socket.send( hs, ZMQ.SNDMORE )
            socket.send( ps, ZMQ.SNDMORE ) 
            socket.send( ms, ZMQ.SNDMORE )
            socket.send( cs )
        }
    }

    override def run() : Unit = {
        try {
            while ( running ) {
                recv().foreach( dispatch )
            }
        } catch {
            case exc: Exception => throw exc
        }
    }

    val socket:Socket

    def dispatch( messsage: Message ) : Unit

    def stopThread() : Unit = {
        running = false
        interrupt()
    }
}

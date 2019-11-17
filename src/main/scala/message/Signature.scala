package igalileo

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

object Signature {
    private var key: String = ""
    private var algo: String = ""

    // case class Signature( key: String, algorithm: String ) {
    private lazy val mac = {
        algo match {
            case "hmac-sha256" => { 
                val m = Mac.getInstance( "hmacsha256" )
                m.init( keySpec )
                m
            }
        }
    }

    private lazy val keySpec = {
        algo match {
            case "hmac-sha256" => new SecretKeySpec( key.getBytes, "hmacsha256" )
        }
    }
    def setKey( k: String ) { key = k }
    def setAlgo( a: String ) { algo = a }
    
    def apply( args: String* ) = sign( args )
    //def apply( args: java.lang.String* ) = sign( args.toSeq.map( x => x.toString() ) )
    //def sign( args:Seq[java.lang.String]) : String = sign( args.map( x => x.toString() ) )    
    def sign( args: Seq[String] ) : String = {
        def hex( bytes: Seq[Byte] ) : String = {
            bytes.map( "%02x" format _ ).mkString
        }

        mac synchronized {
            args.map( _.getBytes ).foreach( mac.update )
            hex( mac.doFinal() )
        }
    }
}
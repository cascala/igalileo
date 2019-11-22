package igalileo

import org.zeromq.ZMQ.Socket

case class IOPubBus( socket: Socket ) extends Bus {
    def dispatch( message: Message ) : Unit = {
        println( "Received " + message + " in IOPubBus dispatch" )

        message.header( "msg_type" ) match {
            case "adsfadsf" => ()
            //case _ => Unit
        }
    }
}
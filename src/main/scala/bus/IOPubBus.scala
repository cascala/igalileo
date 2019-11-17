package galileokernel

import org.zeromq.ZMQ.Socket

case class IOPubBus( socket: Socket ) extends Bus {
    def dispatch( message: Message ) {
        println( "Received " + message + " in IOPubBus dispatch" )

        message.header( "msg_type" ) match {
            case "adsfadsf" => Unit 
            //case _ => Unit
        }
    }
}
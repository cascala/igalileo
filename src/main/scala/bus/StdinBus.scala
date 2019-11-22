package igalileo

import org.zeromq.ZMQ.Socket

case class StdinBus( socket: Socket, kernel: Kernel ) extends Bus {
    def dispatch( message: Message ) : Unit = {
        println( "Received " + message + " in ControlListener dispatch" )

        message.header( "msg_type" ) match {
            case "adsfadsf" => () 
        }
    }
}


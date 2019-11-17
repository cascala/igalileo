package galileokernel

import org.zeromq.ZMQ.Socket

case class ControlBus( socket: Socket, kernel: Kernel ) extends Bus {
    def dispatch( message: Message ) : Unit = {
        println( "Received " + message + " in ControlListener dispatch" )

        message.header( "msg_type" ) match {
            case "adsfadsf" => Unit 
            case "shutdown_request" => {
                send( ShutdownReply( message ) )
                kernel.stop()
            }
        }
    }
}


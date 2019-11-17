package igalileo

import org.zeromq.ZMQ.Socket

case class ControlBus( socket: Socket, kernel: Kernel ) extends Bus {
    def dispatch( message: Message ) : Unit = {
        message.header( "msg_type" ) match {
            case "shutdown_request" => {
                send( ShutdownReply( message ) )
                kernel.stop()
            }
        }
    }
}


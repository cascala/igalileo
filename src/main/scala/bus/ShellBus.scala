package galileokernel

import org.zeromq.ZMQ.Socket

case class ShellBus( socket: Socket, kernel: Kernel ) extends Bus {
    //var publisher: Publisher = new Publisher()
    def dispatch( message: Message ) : Unit = {  
        kernel.publish( Status( "busy") )
        
        message.header( "msg_type" ) match {
            case "kernel_info_request" => send( KernelInfoReply( message ) ) // 
            case "execute_request" => {
                send( ExecuteInput( message, true ) ) // Increment, should just be send
                send( ExecuteReply( message ) )  // should just be send
                kernel.publish( ExecuteResult( message ) ) // execute_result on iopub
            }
        }//case _ => Unit // for now
        
        kernel.publish( Status( "idle" ) )  
    }
}

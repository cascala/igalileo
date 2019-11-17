package igalileo

import galileo.parser.Parser
import galileo.exprhandler.ExprHandler

import org.zeromq.ZMQ.Socket

case class ShellBus( socket: Socket, kernel: Kernel ) extends Bus {
    val parser = new Parser()
    val handler = new ExprHandler() 

    def dispatch( message: Message ) : Unit = {  
        kernel.publish( Status( "busy") )
        
        message.header( "msg_type" ) match {
            case "kernel_info_request" => send( KernelInfoReply( message ) ) // 
            case "execute_request" => {
                send( ExecuteInput( message, true ) ) // Increment, should just be send
                send( ExecuteReply( message ) )  // should just be send
                
                var status: String = "ok"
                var output: List[String] = List()
                
                import parser.{ Success, NoSuccess }
                val code = message.content( "code").asInstanceOf[String]
                parser.parse( code ) match {   
                    case Success( expressions, _ ) => output = expressions.map( expression => handler.eval( kernel.environment, expression ) )
                    case err: NoSuccess   => { status = "error"; output :+ err }
                }
                
                kernel.publish( ExecuteResult( message, status, output.mkString( "\n" ) ) ) // execute_result on iopub
            }
        }//case _ => Unit // for now
        
        kernel.publish( Status( "idle" ) )  
    }
}

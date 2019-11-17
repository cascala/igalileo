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

                var status: String = "ok"
                
                import parser.{ Success, NoSuccess }
                val code = message.content( "code").asInstanceOf[String]
                val output = parser.parse( code ) match {   
                    case Success( expressions, _ ) => expressions.map( expression => handler.eval( kernel.environment, expression ) ).mkString( "\n" )
                    case err: NoSuccess   => { status = "error"; err.toString() }
                }

                send( ExecuteReply( message, status, output ) )  // send on shell

                val silent = message.content( "silent" ).asInstanceOf[ Boolean ]
                if( !silent )    
                    kernel.publish( ExecuteResult( message, output ) )// send on iopub
            }
        }
        
        kernel.publish( Status( "idle" ) )  
    }
}

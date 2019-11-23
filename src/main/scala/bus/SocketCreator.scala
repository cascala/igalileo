package igalileo

//import org.zeromq.ZMQ
import org.zeromq.ZMQ.Socket
import org.zeromq.ZContext
import org.zeromq.SocketType

/* We will instantiate five Sockets:
    heartbeat of kind REP
    control of kind ROUTER
    shell of kind ROUTER
    stdin of kind ROUTER
    iopub or kind PUB
*/

object SocketCreator{
    private val context = new ZContext( 5 ) /* 5 threads */
    def apply( transport: String, ip: String, port: Int, mqtype: SocketType ) : Socket = {
        val socket = context.createSocket( mqtype )
        socket.bind( transport + "://" + ip + ":" + port.toString() )
        println( "Kernel connected on " + transport + "://" + ip + ":" + port.toString() )
        socket
    }

    def destroyContext() = {
        context.destroy()
    } 
    // TODO: Terminate context appropriately
    // context.term()
}
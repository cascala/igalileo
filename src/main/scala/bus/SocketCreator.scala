package galileokernel

import org.zeromq.ZMQ
import org.zeromq.ZMQ.Context
import org.zeromq.ZMQ.Socket


/* We will instantiate five Sockets:
    heartbeat of kind REP
    control of kind ROUTER
    shell of kind ROUTER
    stdin of kind ROUTER
    iopub or kind PUB
*/

object SocketCreator{
    private val context = ZMQ.context( 1 )
    def apply( transport: String, ip: String, port: Int, mqtype: Int ) : Socket = {
        val socket = context.socket( mqtype )
        socket.bind( transport + "://" + ip + ":" + port.toString() )
        println( "Kernel connected on " + transport + "://" + ip + ":" + port.toString() )
        socket
    } 
    // TODO: Terminate context appropriately
    // context.term()
}

//case class Socket( val: ) {}
package igalileo

import org.zeromq.ZMQ
import org.zeromq.ZMQ.Socket

case class HeartbeatBus( socket: Socket ) extends Thread {
    override def run() : Unit = {
        ZMQ.proxy( socket, socket, null)
    }

    def stopThread() : Unit = {
        interrupt()
    }
}
package igalileo

import galileo.environment.Environment
import galileo.constants._

import scala.io.Source

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import com.fasterxml.jackson.module.scala.experimental.ScalaObjectMapper

import org.zeromq.ZMQ
import org.zeromq.ZMQ.Socket

object Kernel {
    private lazy val usage ="""
        Usage: galileo-kernel [-m message] -f filename
        message is informational
        filename should contain a json formatted set of instructions with ports etc. for the kernel to usage
        the contents inside filenama is typically generated by the jupyter framework
    """
    case class Arguments( filename: String, message: String ) {}

    def main( args: Array[ String ] ) = {
        // A very simple argument parser
        def argParser( map: Arguments, list: List[String]) : Arguments = {
            list match {
                case Nil => map
                case "-m" :: value :: tail => argParser( Arguments( map.filename, value ), tail )
                case "-f" :: value :: tail => argParser( Arguments( value, map.message ), tail )
                case value => {
                    println( usage )
                    throw new RuntimeException( "Unknown argument " + value )
                }
            }
        }

        // A very simple json parser, contents are in a file
        def jsonParser( filename: String ) : Map[ String, Object ] = {
            val json = Source.fromFile( filename )
            val mapper = new ObjectMapper() with ScalaObjectMapper
            mapper.registerModule( DefaultScalaModule )
            //val obj = 
            mapper.readValue[ Map[ String, Object ] ]( json.reader() )
        }

        // Parse the arguments
        var arguments = Arguments( "", "" )
        arguments = argParser( arguments, args.toList )
        require( arguments.filename != "" )

        // Parse the json blob inside filename
        val connection = jsonParser( arguments.filename )
        require( connection( "kernel_name" ) == "galileo" )

        // Create the event loop, listening to the three sockets on mq
        // 1/ heartbeat, 2/ control, 3/ shell
        // Output will go to the iopub socket
        // User input is not currently applicable (stdin socket)
        val kernel = init( connection )
        kernel.start()
    }

    // Instantiate a kernel (app class) from the connection information
    def init( connection: Map[ String, Object ] ) : Kernel = {
        val transport = connection( "transport" ).asInstanceOf[ String ]
        val ip = connection( "ip" ).asInstanceOf[ String ] 
        
        val hb = SocketCreator( transport, ip, connection( "hb_port" ).asInstanceOf[ Int ], ZMQ.REP )
        val control = SocketCreator( transport, ip, connection( "control_port" ).asInstanceOf[ Int ], ZMQ.ROUTER )
        val shell = SocketCreator( transport, ip, connection( "shell_port" ).asInstanceOf[ Int ], ZMQ.ROUTER )
        val iopub = SocketCreator( transport, ip, connection( "iopub_port" ).asInstanceOf[ Int ], ZMQ.PUB )
        val stdin = SocketCreator( transport, ip, connection( "stdin_port" ).asInstanceOf[ Int ], ZMQ.ROUTER )
        
        // Prepare for message signature later
        Signature.setKey( connection( "key" ).asInstanceOf[ String ] )
        Signature.setAlgo( connection( "signature_scheme" ).asInstanceOf[ String ] )
        
        Kernel( hb, control, shell, iopub, stdin )
    }
}

case class Kernel(
    hbSocket: Socket,
    controlSocket: Socket,
    shellSocket: Socket,
    iopubSocket: Socket,
    stdinSocket: Socket ) {
    private lazy val hbBus = HeartbeatBus( hbSocket )
    private lazy val controlBus = ControlBus( controlSocket, this )
    private lazy val iopubBus = IOPubBus( iopubSocket )
    private lazy val shellBus = ShellBus( shellSocket, this )
    private lazy val stdinBus = StdinBus( stdinSocket, this )
    
    def start() { 
        try {
            iopubBus.send( Status( "starting" ) )
            
            hbBus.start()
            shellBus.start()
            controlBus.start()
            stdinBus.start()

            iopubBus.send( Status( "idle" ) )
        }
        catch {
            case e:Throwable => {
                println( e )
                closeSockets()
            }
        } //return
    }

    def publish( message: Message ) {
        iopubBus.send( message )
    }

    def stop() {
        hbBus.stopThread()
        shellBus.stopThread()
        controlBus.stopThread()
        stdinBus.stopThread()

        System.exit( 0 )
    }

    def closeSockets() {
        println( "Closing sockets" )
        hbSocket.close()
        controlSocket.close()
        shellSocket.close()
        iopubSocket.close()
        stdinSocket.close()
    }

    
    var environment:Environment = {
        val genv = new Environment( None ) // Global env
        genv.set( "pi", new ConstantPi )
        genv.set( "e", new ConstantE )
        genv.set( "j", new ConstantJ )
        genv.set( "i", new ConstantJ )
        new Environment( Some( genv ) ) 
    }
}
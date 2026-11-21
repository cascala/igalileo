package igalileo

import java.nio.charset.StandardCharsets.UTF_8
import java.util.UUID

import scala.io.Source

import org.zeromq.{SocketType, ZContext, ZMQ}

// A Jupyter kernel for Galileo.
// Jupyter starts it with a connection file that lists the ports and the signing key.
object Kernel {
  val version = "0.2.1"

  private val usage = """Usage: igalileo [--ip ADDRESS] [-f] CONNECTION_FILE
    |  CONNECTION_FILE  the JSON file written by Jupyter ({connection_file} in kernel.json)
    |  --ip ADDRESS     listen on ADDRESS instead of the ip in the connection file
    |                   (use 0.0.0.0 inside a Docker container; IGALILEO_IP does the same)""".stripMargin

  // JSON MIME types (e.g. application/vnd.plotly.v1+json) must be sent as JSON objects, not strings
  def mimeData( bundle: Map[ String, String ] ): Map[ String, Any ] = bundle.map {
    case ( k, v ) if k.endsWith( "json" ) => k -> Json.read( v )
    case kv => kv
  }

  def main( args: Array[ String ] ): Unit = {
    def parse( list: List[ String ], file: Option[ String ], ip: Option[ String ] ): ( Option[ String ], Option[ String ] ) = list match {
      case Nil => ( file, ip )
      case ( "-h" | "--help" ) :: _ => { println( usage ); sys.exit( 0 ) }
      case "-f" :: value :: tail => parse( tail, Some( value ), ip )
      case "--ip" :: value :: tail => parse( tail, file, Some( value ) )
      case ( "-m" ) :: _ :: tail => parse( tail, file, ip ) // informational message, accepted for backwards compatibility
      case value :: tail if !value.startsWith( "-" ) => parse( tail, Some( value ), ip )
      case value :: _ => { System.err.println( usage ); throw new IllegalArgumentException( "Unknown argument " + value ) }
    }
    val ( file, ipOverride ) = parse( args.toList, None, sys.env.get( "IGALILEO_IP" ).filter( _.nonEmpty ) )
    val connection = file match {
      case Some( f ) => { val src = Source.fromFile( f, "UTF-8" ); try Json.read( src.mkString ) finally src.close() }
      case None => { System.err.println( usage ); sys.exit( 2 ) }
    }
    new Kernel( connection, ipOverride ).start()
  }
}

class Kernel( connection: Map[ String, Any ], ipOverride: Option[ String ] = None ) {
  private val context = new ZContext()
  private val session = UUID.randomUUID.toString
  private val signer = new Signer( connection.getOrElse( "key", "" ).toString, connection.getOrElse( "signature_scheme", "hmac-sha256" ).toString )
  private val engine = new Engine()
  private var executionCount = 0

  private def address( portKey: String ): String = {
    val transport = connection.getOrElse( "transport", "tcp" ).toString
    val ip = ipOverride.getOrElse( connection.getOrElse( "ip", "127.0.0.1" ).toString )
    val port = connection( portKey ).asInstanceOf[ Number ].intValue
    if ( transport == "ipc" ) s"ipc://$ip-$port" else s"$transport://$ip:$port"
  }

  private def channel( portKey: String, kind: SocketType ): Channel = {
    val socket = context.createSocket( kind )
    socket.setLinger( 1000 )
    socket.bind( address( portKey ) )
    Log( "listening on " + address( portKey ) + " (" + portKey + ")" )
    new Channel( socket, signer, session )
  }

  private lazy val shell = channel( "shell_port", SocketType.ROUTER )
  private lazy val control = channel( "control_port", SocketType.ROUTER )
  private lazy val stdin = channel( "stdin_port", SocketType.ROUTER )
  private lazy val iopub = channel( "iopub_port", SocketType.PUB )
  private lazy val heartbeat = { val s = context.createSocket( SocketType.REP ); s.bind( address( "hb_port" ) ); s }

  def start(): Unit = {
    // bind everything before announcing ourselves
    List( shell, control, stdin, iopub ); heartbeat
    publish( None, "status", Map( "execution_state" -> "starting" ) )

    thread( "heartbeat" ) {
      while ( !Thread.currentThread.isInterrupted ) {
        val ping = heartbeat.recv( 0 )
        if ( ping != null ) heartbeat.send( ping, 0 )
      }
    }
    thread( "stdin" ) { while ( true ) stdin.recv() } // input requests are not used: drain
    thread( "control" ) { while ( true ) control.recv().foreach( m => handle( control, m ) ) }
    thread( "shell" ) { while ( true ) shell.recv().foreach( m => handle( shell, m ) ) }
  }

  private def thread( name: String )( body: => Unit ): Unit = {
    val t = new Thread( () => {
      try body catch {
        case _: InterruptedException => ()
        case e: Throwable => if ( !stopping ) { Log( name + " thread failed: " + e ); e.printStackTrace() }
      }
    }, "igalileo-" + name )
    t.setDaemon( name != "shell" )
    t.start()
  }

  @volatile private var stopping = false

  def stop(): Unit = {
    stopping = true
    Log( "shutting down" )
    try context.close() catch { case _: Throwable => () }
    sys.exit( 0 )
  }

  // ---- messages ----

  private def reply( ch: Channel, request: Message, msgType: String, content: Map[ String, Any ] ): Unit =
    ch.send( Message( request.idents, Map( "msg_type" -> msgType ), request.header, Map(), content ) )

  // iopub messages use the message type as ZeroMQ topic
  private def publish( parent: Option[ Message ], msgType: String, content: Map[ String, Any ] ): Unit =
    iopub.send( Message( List( msgType.getBytes( UTF_8 ) ), Map( "msg_type" -> msgType ), parent.map( _.header ).getOrElse( Map() ), Map(), content ) )

  private def handle( ch: Channel, request: Message ): Unit = {
    publish( Some( request ), "status", Map( "execution_state" -> "busy" ) )
    try {
      request.msgType match {
        case "kernel_info_request" => reply( ch, request, "kernel_info_reply", kernelInfo )
        case "execute_request" => execute( ch, request )
        case "complete_request" => {
          val ( matches, start, end ) = engine.complete( request.string( "code" ), request.int( "cursor_pos", 0 ) )
          reply( ch, request, "complete_reply", Map( "status" -> "ok", "matches" -> matches, "cursor_start" -> start, "cursor_end" -> end, "metadata" -> Map() ) )
        }
        case "inspect_request" => {
          // Shift+Tab in a notebook: the help text of the command under the cursor
          val data = engine.inspect( request.string( "code" ), request.int( "cursor_pos", 0 ) )
          reply( ch, request, "inspect_reply", Map( "status" -> "ok", "found" -> data.nonEmpty, "data" -> data, "metadata" -> Map() ) )
        }
        case "is_complete_request" => reply( ch, request, "is_complete_reply", Map( "status" -> "complete" ) )
        case "history_request" => reply( ch, request, "history_reply", Map( "status" -> "ok", "history" -> List() ) )
        case "comm_info_request" => reply( ch, request, "comm_info_reply", Map( "status" -> "ok", "comms" -> Map() ) )
        case "interrupt_request" => reply( ch, request, "interrupt_reply", Map( "status" -> "ok" ) )
        case "shutdown_request" => {
          val restart = request.bool( "restart", false )
          reply( ch, request, "shutdown_reply", Map( "status" -> "ok", "restart" -> restart ) )
          publish( Some( request ), "status", Map( "execution_state" -> "idle" ) )
          stop()
        }
        case "comm_open" => () // no widgets
        case "comm_msg" | "comm_close" => ()
        case other => Log( "ignoring unsupported message type " + other )
      }
    } catch {
      case e: Exception => Log( "error handling " + request.msgType + ": " + e )
    } finally {
      publish( Some( request ), "status", Map( "execution_state" -> "idle" ) )
    }
  }

  private def kernelInfo: Map[ String, Any ] = Map(
    "status" -> "ok",
    "protocol_version" -> "5.3",
    "implementation" -> "igalileo",
    "implementation_version" -> Kernel.version,
    "language_info" -> Map(
      "name" -> "galileo",
      "version" -> Kernel.version,
      "mimetype" -> "text/x-galileo",
      "file_extension" -> ".gg",
      "pygments_lexer" -> "text",
      "codemirror_mode" -> "octave"
    ),
    "banner" -> ( "iGalileo " + Kernel.version + ": Galileo, a symbolic mathematics tool written in Scala" ),
    "help_links" -> List(
      Map( "text" -> "Galileo language reference", "url" -> "https://github.com/cascala/galileo/blob/master/docs/language.md" ),
      Map( "text" -> "iGalileo", "url" -> "https://github.com/cascala/igalileo" )
    )
  )

  private def execute( ch: Channel, request: Message ): Unit = {
    val code = request.string( "code" )
    val silent = request.bool( "silent", false )
    if ( !silent && request.bool( "store_history", true ) ) executionCount += 1
    val count = executionCount
    publish( Some( request ), "execute_input", Map( "code" -> code, "execution_count" -> count ) )

    val outputs = engine.execute( code )
    if ( !silent ) {
      // consecutive text results are joined into one execute_result; plots are display_data
      val texts = scala.collection.mutable.ListBuffer[ String ]()
      def flushText(): Unit = if ( texts.nonEmpty ) {
        publish( Some( request ), "execute_result", Map( "execution_count" -> count, "data" -> Map( "text/plain" -> texts.mkString( "\n" ) ), "metadata" -> Map() ) )
        texts.clear()
      }
      outputs.foreach {
        case TextOutput( t ) => texts += t
        case RichOutput( bundle ) => { flushText(); publish( Some( request ), "display_data", Map( "data" -> Kernel.mimeData( bundle ), "metadata" -> Map(), "transient" -> Map() ) ) }
        case ErrorOutput( _, _ ) => ()
      }
      flushText()
    }
    outputs.collectFirst { case e: ErrorOutput => e } match {
      case Some( ErrorOutput( name, value ) ) => {
        val traceback = List( name + ": " + value )
        publish( Some( request ), "error", Map( "ename" -> name, "evalue" -> value, "traceback" -> traceback ) )
        reply( ch, request, "execute_reply", Map( "status" -> "error", "execution_count" -> count, "ename" -> name, "evalue" -> value, "traceback" -> traceback ) )
      }
      case None =>
        reply( ch, request, "execute_reply", Map( "status" -> "ok", "execution_count" -> count, "user_expressions" -> Map(), "payload" -> List() ) )
    }
  }
}

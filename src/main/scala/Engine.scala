package igalileo

import galileo.constants._
import galileo.environment.Environment
import galileo.expr._
import galileo.exprhandler.ExprHandler
import galileo.parser.Parser
import galileo.plot.Displayable

// What running a cell produces, in order
sealed trait Output
case class TextOutput( text: String ) extends Output
case class RichOutput( mimeBundle: Map[ String, String ] ) extends Output
case class ErrorOutput( name: String, value: String ) extends Output

// Evaluates Galileo code for the kernel; independent of ZeroMQ so it can be tested directly
class Engine {
  private val parser = new Parser()
  private val handler = new ExprHandler()

  val environment: Environment = {
    val genv = new Environment( None ) // Global env
    genv.set( "pi", new ConstantPi )
    genv.set( "e", new ConstantE )
    genv.set( "j", new ConstantJ )
    genv.set( "i", new ConstantJ )
    new Environment( Some( genv ) )
  }

  // Galileo parses one statement per line (or ;-separated); notebooks have several lines per cell
  def execute( code: String ): List[ Output ] = {
    val lines = code.split( "\n" ).map( _.trim ).filter( _.nonEmpty ).toList
    val out = List.newBuilder[ Output ]
    val it = lines.iterator
    var failed = false
    while ( it.hasNext && !failed ) {
      val line = it.next()
      parser.parse( line ) match {
        case parser.Success( expressions, _ ) =>
          for ( expression <- expressions if !failed ) {
            evaluate( expression ) match {
              case e: ErrorOutput => { out += e; failed = true }
              case TextOutput( "" ) => ()
              case o => out += o
            }
          }
        case err: parser.NoSuccess =>
          out += ErrorOutput( "SyntaxError", line + "\n" + err.msg )
          failed = true
      }
    }
    out.result()
  }

  private def evaluate( expression: Expr ): Output = expression match {
    case _: Exit => TextOutput( "exit is not available in a notebook; use Kernel > Shut Down instead" )
    case _: SystemCommand => ErrorOutput( "Unsupported", "shell commands (ls, cd, pwd) are not available in a notebook" )
    case _ =>
      try {
        handler.evaluate( environment, expression ) match {
          case d: Displayable => RichOutput( d.mimeBundle )
          case ErrorExpr( message ) => ErrorOutput( "Error", message )
          case _: NilExpr => TextOutput( "" )
          case result => TextOutput( result.toString )
        }
      } catch {
        case e: StackOverflowError => ErrorOutput( "StackOverflowError", "expression too deeply nested" )
        case e: Exception => ErrorOutput( e.getClass.getSimpleName, String.valueOf( e.getMessage ) )
      }
  }

  // Tab completion: builtin names plus the variables defined so far
  val keywords: List[ String ] = List(
    "acos", "and", "asin", "atan", "christof", "clear", "complexity", "cos", "cottontensor", "deriv",
    "einsteinscalar", "einsteintensor", "eval", "exp", "expand", "eye", "factor", "info", "inv", "kron",
    "lanczostensor", "linspace", "log", "logspace", "lu", "min", "minkowski", "norm", "not", "ones", "or",
    "parametric", "plot", "prove", "rand", "ricciscalar", "riccitensor", "riemannfirst", "riemannsecond",
    "schoutentensor", "schwarzschild", "simplify", "sin", "sqrt", "tan", "tensor", "transpose", "weyltensor",
    "who", "whos", "xor", "zeros" )

  def complete( code: String, cursor: Int ): ( List[ String ], Int, Int ) = {
    val end = math.max( 0, math.min( cursor, code.length ) )
    var start = end
    while ( start > 0 && ( code( start - 1 ).isLetterOrDigit || code( start - 1 ) == '_' ) ) start -= 1
    val prefix = code.substring( start, end )
    val names = ( keywords ++ environment.allVariables.keys ).distinct.sorted
    ( if ( prefix.isEmpty ) Nil else names.filter( _.startsWith( prefix ) ), start, end )
  }
}

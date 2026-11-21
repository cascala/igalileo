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
      // as in Matlab, a trailing semicolon hides the result (errors are still shown)
      val quiet = line.endsWith( ";" )
      // the parser itself can throw (e.g. for a matrix with rows of different sizes)
      val parsed: Either[ String, List[ Expr ] ] = try parser.parse( line ) match {
        case parser.Success( expressions, _ ) => Right( expressions )
        case err: parser.NoSuccess => Left( err.msg )
      } catch {
        case e: Exception => Left( Option( e.getMessage ).getOrElse( e.toString ).stripPrefix( "requirement failed: " ) )
      }
      parsed match {
        case Right( expressions ) =>
          for ( expression <- expressions if !failed ) {
            evaluate( expression ) match {
              case e: ErrorOutput => { out += e; failed = true }
              case TextOutput( "" ) => ()
              case _ if quiet => ()
              case o => out += o
            }
          }
        case Left( msg ) =>
          out += ErrorOutput( "SyntaxError", line + "\n" + msg )
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
          case result if Engine.typeset( result ) =>
            RichOutput( Map( "text/plain" -> result.toString, "text/latex" -> ( "$$" + galileo.geometry.Latex( result ) + "$$" ) ) )
          case result => TextOutput( result.toString )
        }
      } catch {
        case e: StackOverflowError => ErrorOutput( "StackOverflowError", "expression too deeply nested" )
        case e: Exception => ErrorOutput( e.getClass.getSimpleName, String.valueOf( e.getMessage ) )
      }
  }

  // Tab completion: builtin names plus the variables defined so far
  val keywords: List[ String ] = List(
    "help", "acos", "and", "asin", "atan", "christof", "clear", "complexity", "cos", "cottontensor", "deriv",
    "einsteinscalar", "einsteintensor", "eval", "exp", "expand", "eye", "factor", "info", "inv", "kron",
    "lanczostensor", "linspace", "log", "logspace", "lu", "min", "minkowski", "norm", "not", "ones", "or",
    "parametric", "plot", "prove", "rand", "ricciscalar", "riccitensor", "riemannfirst", "riemannsecond",
    "schoutentensor", "schwarzschild", "simplify", "sin", "sqrt", "tan", "tensor", "transpose", "weyltensor",
    "who", "whos", "xor", "zeros",
    // differential geometry and differential equations
    "christoffel", "christoffelfirst", "christoffelsecond", "gausscurvature", "geodesic", "geodesics",
    "inducedmetric", "inverse", "kretschmann", "metric", "odeplot", "odesolve" )

  // Help for the name under (or just before) the cursor, as a MIME bundle; empty when there is none
  def inspect( code: String, cursor: Int ): Map[ String, String ] = {
    def isName( c: Char ) = c.isLetterOrDigit || c == '_'
    val pos = math.max( 0, math.min( cursor, code.length ) )
    var start = pos
    while ( start > 0 && isName( code( start - 1 ) ) ) start -= 1
    var end = pos
    while ( end < code.length && isName( code( end ) ) ) end += 1
    // cursor right after "name(": use the name before the parenthesis
    val word = if ( start == end && pos > 0 && code( pos - 1 ) == '(' ) {
      var s0 = pos - 1
      while ( s0 > 0 && isName( code( s0 - 1 ) ) ) s0 -= 1
      code.substring( s0, pos - 1 )
    } else code.substring( start, end )
    galileo.help.Help.entry( word ) match {
      case Some( e ) => Map( "text/plain" -> galileo.help.Help.plain( e ), "text/markdown" -> galileo.help.Help.markdown( e ) )
      case None => Map()
    }
  }

  def complete( code: String, cursor: Int ): ( List[ String ], Int, Int ) = {
    val end = math.max( 0, math.min( cursor, code.length ) )
    var start = end
    while ( start > 0 && ( code( start - 1 ).isLetterOrDigit || code( start - 1 ) == '_' ) ) start -= 1
    val prefix = code.substring( start, end )
    val names = ( keywords ++ environment.allVariables.keys ).distinct.sorted
    ( if ( prefix.isEmpty ) Nil else names.filter( _.startsWith( prefix ) ), start, end )
  }
}

object Engine {
  // symbolic scalar results are also sent as LaTeX, so notebooks typeset them;
  // plain numbers, matrices and messages stay text
  def typeset( e: Expr ): Boolean = e match {
    case _: Sum | _: Product | _: Fraction | _: Power | _: Variable | _: FunF1 => true
    case _ => false
  }
}

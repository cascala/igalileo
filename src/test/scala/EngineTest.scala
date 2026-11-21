import igalileo._

import org.scalatest.funsuite.AnyFunSuite

class EngineTest extends AnyFunSuite {
  test( "evaluates several lines in one cell and keeps variables" ) {
    val engine = new Engine()
    val out = engine.execute( "a = 2\nb = a + 3\nb * 2" )
    assert( out == List( TextOutput( "2.0" ), TextOutput( "5.0" ), TextOutput( "10.0" ) ) )
  }

  test( "plots are rich output with an SVG" ) {
    val engine = new Engine()
    engine.execute( "plot(sin(x), x, 0, 2*pi)" ) match {
      case List( RichOutput( bundle ) ) => {
        assert( bundle( "image/svg+xml" ).startsWith( "<svg" ) )
        assert( bundle.contains( "text/plain" ) )
      }
      case other => fail( "unexpected " + other )
    }
  }

  test( "syntax errors stop the cell" ) {
    val engine = new Engine()
    engine.execute( "1 +\n2" ) match {
      case List( ErrorOutput( "SyntaxError", _ ) ) => ()
      case other => fail( "unexpected " + other )
    }
  }

  test( "comments and blank lines produce no output" ) {
    assert( new Engine().execute( "// a comment\n\n" ) == Nil )
  }

  test( "completion uses builtins and variables" ) {
    val engine = new Engine()
    engine.execute( "simon = 3" )
    val ( matches, start, end ) = engine.complete( "x + si", 6 )
    assert( matches == List( "simon", "simplify", "sin" ) )
    assert( ( start, end ) == ( 4, 6 ) )
  }
}

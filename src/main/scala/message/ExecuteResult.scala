package galileokernel

object ExecuteResult {
    def apply( message: Message ) : Message = {
        val input = message.content( "code" )
        println( input )
        
        val header = Map( 
            "msg_type" -> "execute_result"// Not execute reply!
            //"session" -> Session( false )
            //"msg_id" -> message.header( "msg_id" )
        )
        val content = Map(
            //"status" -> "ok", // or "error" or "abort"
            "execution_count" -> ExecutionCount(), 
            "data" -> Map( 
                //"application/json" -> "{ \"json\":\"data\" }",
                //"application/text" -> "application/text",
                "text/plain" -> "Hello from galileio" //Array( "text/plain TODO" )

                //"text" -> "text"
            )
        )

        Message( message.idents, header, message.header /* send parent_header = received header */, content )
    }
}
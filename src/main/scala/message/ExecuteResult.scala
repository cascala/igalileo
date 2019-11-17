package igalileo

object ExecuteResult {
    def apply( message: Message, status: String, output: String ) : Message = {
        val header = Map( 
            "msg_type" -> "execute_result"// Not execute reply!
        )
        val content = Map(
            "status" -> status, // or "error" or "abort"
            "execution_count" -> ExecutionCount(), 
            "data" -> Map( 
                //"application/json" -> "{ \"json\":\"data\" }",
                //"application/text" -> "application/text",
                "text/plain" -> output //Array( "text/plain TODO" )
                //"text" -> "text"
            )
        )

        Message( message.idents, header, message.header /* send parent_header = received header */, content )
    }
}
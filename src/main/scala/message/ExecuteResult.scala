package igalileo

object ExecuteResult {
    def apply( message: Message, output: String ) : Message = {
        val header = Map( 
            "msg_type" -> "execute_result"// Not execute reply!
        )
        val content = Map(
            "status" -> "ok",
            "execution_count" -> ExecutionCount(), 
            "data" -> Map( 
                //"application/json" -> "{ \"json\":\"data\" }",
                //"application/text" -> "application/text",
                "text/plain" -> output //Array( "text/plain TODO" )
            )
        )

        Message( message.idents, header, message.header /* send parent_header = received header */, content )
    }
}
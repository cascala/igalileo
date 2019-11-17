package igalileo

object ExecuteReply {
    def apply( message: Message, status: String, output: String ) : Message = {
        val header = Map( 
            "msg_type" -> "execute_reply"
        )

        var content = Map(
            "status" -> status, // "ok" or "error" or "abort"
            "execution_count" -> ExecutionCount(),
            "user_expressions" -> Map()
        )

        if( "error" == status )
            content = content ++ Map( 
                "ename" -> "Error",
                "evalue" -> output,
                "traceback" -> List()
            )
        
        Message( message.idents, header, message.header /* send parent_header = received header */, content )
    }
}
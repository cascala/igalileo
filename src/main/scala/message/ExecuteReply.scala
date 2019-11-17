package galileokernel

object ExecuteReply {
    def apply( message: Message ) : Message = {
        val header = Map( 
            "msg_type" -> "execute_reply"
        )
        val content = Map(
            "status" -> "ok", // or "error" or "abort"
            "execution_count" -> ExecutionCount(),
            "user_expressions" -> Map( 

                "text/plain" -> "Hello from galileio sdgsdgfdgs" //Array( "text/plain TODO" )
            )
        )
        
        Message( message.idents, header, message.header /* send parent_header = received header */, content )
    }
}
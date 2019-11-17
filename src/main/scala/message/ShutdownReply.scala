package galileokernel

object ShutdownReply {
    private var count = 0
    def apply( message: Message ) : Message = {
        //val executionCount = message.content( "execution_count" ).asInstanceOf[ Int ]
        val header = Map( 
            "msg_type" -> "shutdown_reply"
            //"session" -> Session( false )
            //"msg_id" -> message.header( "msg_id" )
        )
        val content = Map(
            // "status" -> "ok", // or "error" or "abort"
            "restart" -> false
        )
        //val content = Map[ ""]
        count = count + 1 // Is this thread safe here?
        Message( message.idents, header, message.header /* send parent_header = received header */, content )
    }
}
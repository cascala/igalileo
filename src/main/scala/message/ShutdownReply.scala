package igalileo

object ShutdownReply {
    def apply( message: Message ) : Message = {
        val header = Map( 
            "msg_type" -> "shutdown_reply"
        )
        val content = Map(
            // "status" -> "ok", // or "error" or "abort"
            "restart" -> false
        )

        Message( message.idents, header, message.header /* send parent_header = received header */, content )
    }
}
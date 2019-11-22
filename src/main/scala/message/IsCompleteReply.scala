package igalileo

object IsCompleteReply {
    def apply( message: Message ) : Message = {
        val header = Map( 
            "msg_type" -> "is_complete_reply"
        )

        var content = Map(
            "status" -> "complete" // refine this later?
            //"indent" -> "\t"
        )
        
        
        Message( message.idents, header, message.header /* send parent_header = received header */, content )
    }
}
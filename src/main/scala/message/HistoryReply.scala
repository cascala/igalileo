package igalileo

object HistoryReply {
    def apply( message: Message ) : Message = {
        val header = Map( 
            "msg_type" -> "history_reply"
        )

        var content = Map(
            "history" -> List() // TODO
        )

        Message( message.idents, header, message.header /* send parent_header = received header */, content )
    }
}
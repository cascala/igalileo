package galileokernel

object ExecuteInput {
    def apply( message: Message, increment: Boolean ) : Message = {
        val header = Map( 
            "msg_type" -> "execute_input"
        )
        val content = Map(
            "code" -> message.content( "code").asInstanceOf[String],
            "execution_count" -> ExecutionCount( increment )
        )

        Message( message.idents, header, message.header /* send parent_header = received header */, content )
    }
}
package galileokernel

object Status{
    def apply( execution_state: String ) : Message = {
        val header = Map( 
            "msg_type" -> "status"
        )
        val content = Map(
            "execution_state" -> execution_state
        )
        Message( List(), header, Map(), content )
    }
}

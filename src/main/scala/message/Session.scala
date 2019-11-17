package galileokernel

object Session {
    var sessionString = java.util.UUID.randomUUID.toString()

    def apply(modify:Boolean = false ) = {
        if( modify )
            sessionString = java.util.UUID.randomUUID.toString()
        sessionString
    }
}
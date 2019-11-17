package igalileo

object KernelInfoReply {
    def apply( message : Message ) : Message = {
        val header = Map( 
            "msg_type" -> "kernel_info_reply"
        )
        val content = Map(
            "status" -> "ok",
            "protocol_version" -> "5.3",
            "implementation" -> "galileo.kernel",
            "implementation_version" -> "0.1.2",
            "language_info" -> Map(
                "name" -> "galileo",
                "version" -> "0.1.2",
                "mimetype" -> "text/plain", 
                "file_extension" -> ".gg"
            ),
            "banner" -> "Galileo kernel\nGalileo is a symbolic mathematics tool written in Scala",//,
            "help_links" -> Array( 
                Map( "text" -> "Galileo Reference", "url" -> "https://github.com/cascala/galileo/blob/master/docs/language.md" ),
                Map( "text" -> "Galileo Kernel Reference", "url" -> "https://github.com/cascala/igalileo" )
            )
        )
        Message( message.idents, header, message.header /* the received message's header is the parent header */, content )
    }
}
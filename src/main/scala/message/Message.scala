package galileokernel

case class Message(
    idents: List[ String ],
    header: Map[ String, Any ],
    parent_header: Map[ String, Any ],
    content: Map[ String, Any ]
)
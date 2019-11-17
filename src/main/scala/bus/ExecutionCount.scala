
package galileokernel

object ExecutionCount {
    private var count = 0
    def apply( increment: Boolean = false ): Int = {
        if( increment ) 
            count = count + 1
        count
    }
}
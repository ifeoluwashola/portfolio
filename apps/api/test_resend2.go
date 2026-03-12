package main
import (
"fmt"
"github.com/resend/resend-go/v2"
)
func main() {
	client := resend.NewClient("key")
	fmt.Printf("%T\n", client)
}

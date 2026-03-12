package main

import (
"fmt"
"os"

"github.com/resend/resend-go/v2"
)

func main() {
	client := resend.NewClient(os.Getenv("RESEND_API_KEY"))

	params := &resend.SendEmailRequest{
		From:    "onboarding@resend.dev",
		To:      []string{os.Getenv("NOTIFICATION_EMAIL")},
		Subject: "Test Error",
		Html:    "<strong>test</strong>",
	}

	_, err := client.Emails.Send(params)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Println("Success")
}

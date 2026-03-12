package notifications

import (
	"fmt"
	"net/http"

	"github.com/Ifeoluwa/portfolio/apps/api/internal/config"
	"github.com/Ifeoluwa/portfolio/apps/api/internal/domain"
	"github.com/resend/resend-go/v2"
)

type ResendNotifier struct {
	client            *resend.Client
	notificationEmail string
}

func NewResendNotifier(cfg *config.Config) *ResendNotifier {
	transport := &http.Transport{
		ForceAttemptHTTP2: false,
	}
	httpClient := &http.Client{
		Transport: transport,
	}

	client := resend.NewCustomClient(httpClient, cfg.ResendAPIKey)
	return &ResendNotifier{
		client:            client,
		notificationEmail: cfg.NotificationEmail,
	}
}

func (n *ResendNotifier) SendNotification(lead *domain.ContactLead) error {
	if n.notificationEmail == "" {
		return fmt.Errorf("notification email is not configured")
	}

	subject := fmt.Sprintf("New Consulting Lead: %s", lead.Company)
	htmlBody := fmt.Sprintf(`
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #fff; }
				.container { max-width: 600px; margin: 40px auto; padding: 0 0 24px 0; border: 1px solid #eaeaec; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
				.header { background-color: #f7f7f9; padding: 20px 24px; border-radius: 8px 8px 0 0; margin-bottom: 24px; margin: 8px 8px 24px 8px; }
				.header h2 { margin: 0; color: #1a1a1a; font-size: 20px; font-weight: 700; }
				.content { padding: 0 24px; }
				.field { margin-bottom: 20px; }
				.label { font-weight: 700; color: #788290; font-size: 12px; display: block; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.8px; }
				.value { color: #1a1a1a; font-size: 15px; font-weight: 400; }
				.value a { color: #0066ff; text-decoration: none; }
				.value a:hover { text-decoration: underline; }
				.message-box { margin-top: 8px; padding: 16px 20px; background-color: #f7f7f9; border-left: 4px solid #0066ff; border-radius: 0 4px 4px 0; font-size: 15px; white-space: pre-wrap; color: #333; line-height: 1.6; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h2>New Consulting Lead</h2>
				</div>
				<div class="content">
					<div class="field">
						<span class="label">Name</span>
						<div class="value">%s %s</div>
					</div>
					<div class="field">
						<span class="label">Email</span>
						<div class="value"><a href="mailto:%s">%s</a></div>
					</div>
					<div class="field">
						<span class="label">Company</span>
						<div class="value">%s</div>
					</div>
					<div class="field">
						<span class="label">Role/Position</span>
						<div class="value">%s</div>
					</div>
					<div class="field">
						<span class="label">Project Details</span>
						<div class="message-box">%s</div>
					</div>
				</div>
			</div>
		</body>
		</html>
	`, lead.FirstName, lead.LastName, lead.Email, lead.Email, lead.Company, lead.Role, lead.Message)

	params := &resend.SendEmailRequest{
		From:    "onboarding@resend.dev",
		To:      []string{n.notificationEmail},
		Subject: subject,
		Html:    htmlBody,
	}

	_, err := n.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("failed to send email notification: %v", err)
	}

	return nil
}

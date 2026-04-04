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
	frontendURL       string
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
		frontendURL:       cfg.FrontendURL,
	}
}

func (n *ResendNotifier) SendNotification(lead *domain.ContactLead) error {
	if n.notificationEmail == "" {
		return fmt.Errorf("notification email is not configured")
	}

	subject := fmt.Sprintf("New Consulting Lead: %s", lead.Company)
	htmlTemplate := `
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
	`
	
	roleStr := ""
	if lead.Role != nil {
		roleStr = *lead.Role
	}
	htmlBody := fmt.Sprintf(htmlTemplate, lead.FirstName, lead.LastName, lead.Email, lead.Email, lead.Company, roleStr, lead.Message)

	params := &resend.SendEmailRequest{
		From:    "Kybern Partners <partners@kyberncloud.com>",
		To:      []string{n.notificationEmail},
		Subject: subject,
		Html:    htmlBody,
	}

	_, err := n.client.Emails.Send(params)
	return err
}

func (n *ResendNotifier) SendStudentWelcomeEmail(firstName, email, tempPassword string) error {
	subject := "Welcome to the Kybern Academy Cohort!"
	sender := "Kybern Academy <academy@kyberncloud.com>"
	
	htmlTemplate := `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: "Courier New", Courier, monospace; line-height: 1.6; color: #f8fafc; margin: 0; padding: 0; background-color: #020617; }
				.container { max-width: 600px; margin: 40px auto; padding: 0 0 24px 0; border: 1px solid #1e293b; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.5); background-color: #0f172a; }
				.header { background-color: #020617; padding: 20px 24px; border-radius: 8px 8px 0 0; margin-bottom: 24px; margin: 8px 8px 24px 8px; border-bottom: 1px solid #1e293b; }
				.header h2 { margin: 0; color: #eab308; font-size: 20px; font-weight: 700; }
				.content { padding: 0 24px; color: #cbd5e1; }
				.password-box { background-color: #020617; border: 1px solid #eab308; padding: 12px; margin: 16px 0; border-radius: 4px; color: #eab308; font-weight: bold; text-align: center; font-size: 18px; letter-spacing: 2px; }
				.button { display: inline-block; background-color: #eab308; color: #020617 !important; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; border: none; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h2>> Welcome to Kybern Academy, %s!</h2>
				</div>
				<div class="content">
					<p>Congratulations on securing your seat in the Cloud Native Mentorship Cohort.</p>
					<p>Classes begin on April 16th. We're incredibly excited to have you onboard.</p>
					<p>Your LMS Student Portal has been automatically provisioned. Your login is your email address and the temporary password below.</p>
					<div class="password-box">%s</div>
					<a href="%s/academy/login" class="button">Access Student Portal</a>
				</div>
			</div>
		</body>
		</html>
	`
	
	htmlBody := fmt.Sprintf(htmlTemplate, firstName, tempPassword, n.frontendURL)
	params := &resend.SendEmailRequest{
		From:    sender,
		To:      []string{email},
		Subject: subject,
		Html:    htmlBody,
	}

	_, err := n.client.Emails.Send(params)
	return err
}

func (n *ResendNotifier) SendPasswordResetEmail(email, token string) error {
	subject := "Reset your Kybern Academy Password"
	sender := "Kybern Academy <academy@kyberncloud.com>"
	resetLink := fmt.Sprintf("%s/academy/reset-password?token=%s", n.frontendURL, token)
	
	htmlTemplate := `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: "Courier New", Courier, monospace; line-height: 1.6; color: #f8fafc; margin: 0; padding: 0; background-color: #020617; }
				.container { max-width: 600px; margin: 40px auto; padding: 24px; border: 1px solid #1e293b; border-radius: 8px; background-color: #0f172a; }
				.header { color: #eab308; font-size: 20px; font-weight: 700; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 20px; }
				.button { display: inline-block; background-color: #eab308; color: #020617 !important; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">> Password_Reset.sh Initiated</div>
				<p>Click the link below to authorize a new password. This link expires in 1 hour.</p>
				<a href="%s" class="button">Authorize New Password</a>
			</div>
		</body>
		</html>
	`
	
	htmlBody := fmt.Sprintf(htmlTemplate, resetLink)
	params := &resend.SendEmailRequest{
		From:    sender,
		To:      []string{email},
		Subject: subject,
		Html:    htmlBody,
	}

	_, err := n.client.Emails.Send(params)
	return err
}

func (n *ResendNotifier) SendStudentWarningEmail(firstName, email, reason string, warningCount int) error {
    subject := fmt.Sprintf("Action Required: Disciplinary Warning [%d]", warningCount)
    sender := "Kybern Academy Admin <academy@kyberncloud.com>"
    
    htmlTemplate := `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: "Courier New", Consolas, monospace; line-height: 1.6; color: #94a3b8; margin: 0; padding: 20px; background-color: #020617; }
                .wrapper { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #334155; border-radius: 6px; overflow: hidden; }
                .header { background-color: #1e293b; padding: 20px; border-bottom: 2px solid #eab308; }
                .header-text { color: #eab308; font-size: 16px; font-weight: bold; margin: 0; letter-spacing: 1px; }
                .content { padding: 30px; }
                .greeting { color: #f8fafc; font-size: 16px; font-weight: bold; margin-bottom: 15px; }
                .alert-box { background-color: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; padding: 15px; margin: 25px 0; }
                .alert-title { color: #eab308; font-weight: bold; font-size: 14px; margin-bottom: 5px; }
                .alert-detail { color: #f8fafc; font-size: 14px; }
                .reason-container { margin: 25px 0; }
                .reason-label { color: #f8fafc; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; display: block; }
                .reason-box { background-color: #020617; border: 1px solid #334155; padding: 15px; color: #e2e8f0; font-size: 14px; white-space: pre-wrap; border-radius: 4px; }
                .footer { background-color: #020617; padding: 20px; text-align: center; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; }
				.official-warning { color: #f8fafc !important; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="header">
                    <p class="header-text">> SYSTEM_ALERT: DISCIPLINARY_WARNING</p>
                </div>
                <div class="content">
                    <div class="greeting">Hello %s,</div>
                    <p class="official-warning">This is an official notification from the Kybern Academy infrastructure regarding your conduct in the current cohort.</p>
                    
                    <div class="alert-box">
                        <div class="alert-title">WARNING LEVEL: %d</div>
                        <div class="alert-detail">Immediate corrective action is required to maintain your active status in the academy.</div>
                    </div>

                    <div class="reason-container">
                        <span class="reason-label">Official Log Output:</span>
                        <div class="reason-box">%s</div>
                    </div>

                    <p class="official-warning">Please review the cohort guidelines immediately. Further violations will result in automatic system disqualification and revocation of access.</p>
                </div>
                <div class="footer">
                    Kybern Academy Administration<br/>
                    <span style="font-size: 10px; opacity: 0.5; margin-top: 10px; display: block;">AUTOMATED INFRASTRUCTURE MESSAGE</span>
                </div>
            </div>
        </body>
        </html>
    `
    
    htmlBody := fmt.Sprintf(htmlTemplate, firstName, warningCount, reason)
    params := &resend.SendEmailRequest{
        From:    sender,
        To:      []string{email},
        Subject: subject,
        Html:    htmlBody,
    }

    _, err := n.client.Emails.Send(params)
    return err
}

func (n *ResendNotifier) SendStudentDisqualificationEmail(firstName, email, reason string) error {
    subject := "TERMINATION NOTICE: Academy Access Revoked"
    sender := "Kybern Academy Admin <academy@kyberncloud.com>"
    
    htmlTemplate := `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: "Courier New", Consolas, monospace; line-height: 1.6; color: #94a3b8; margin: 0; padding: 20px; background-color: #020617; }
                .wrapper { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #7f1d1d; border-radius: 6px; overflow: hidden; }
                .header { background-color: #450a0a; padding: 20px; border-bottom: 2px solid #ef4444; }
                .header-text { color: #ef4444; font-size: 16px; font-weight: bold; margin: 0; letter-spacing: 1px; }
                .content { padding: 30px; }
                .greeting { color: #f8fafc; font-size: 16px; font-weight: bold; margin-bottom: 15px; }
                .alert-box { background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px; margin: 25px 0; }
                .alert-title { color: #ef4444; font-weight: bold; font-size: 14px; margin-bottom: 5px; }
                .alert-detail { color: #f8fafc; font-size: 14px; }
                .reason-container { margin: 25px 0; }
                .reason-label { color: #f8fafc; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; display: block; }
                .reason-box { background-color: #020617; border: 1px solid #7f1d1d; padding: 15px; color: #fca5a5; font-size: 14px; white-space: pre-wrap; border-radius: 4px; }
                .footer { background-color: #020617; padding: 20px; text-align: center; border-top: 1px solid #450a0a; font-size: 12px; color: #64748b; }
				.official-warning { color: #f8fafc !important; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="header">
                    <p class="header-text">> CRITICAL: ACCESS_REVOKED_FINAL</p>
                </div>
                <div class="content">
                    <div class="greeting">Hello %s,</div>
                    <p class="official-warning">Effective immediately, your student status at Kybern Academy has been changed to <strong>Disqualified</strong>.</p>
                    
                    <div class="alert-box">
                        <div class="alert-title">STATUS: TERMINATED</div>
                        <div class="alert-detail">Your access to the learning portal, infrastructure resources, and community channels has been permanently revoked.</div>
                    </div>

                    <div class="reason-container">
                        <span class="reason-label">Reason for Termination:</span>
                        <div class="reason-box">%s</div>
                    </div>

                    <p class="official-warning">This decision is final and cannot be appealed. We wish you the best in your future endeavors.</p>
                </div>
                <div class="footer">
                    Kybern Academy Administration<br/>
                    <span style="font-size: 10px; opacity: 0.5; margin-top: 10px; display: block;">AUTOMATED INFRASTRUCTURE MESSAGE</span>
                </div>
            </div>
        </body>
        </html>
    `
    
    htmlBody := fmt.Sprintf(htmlTemplate, firstName, reason)
    params := &resend.SendEmailRequest{
        From:    sender,
        To:      []string{email},
        Subject: subject,
        Html:    htmlBody,
    }

    _, err := n.client.Emails.Send(params)
    return err
}
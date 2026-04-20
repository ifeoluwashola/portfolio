package notifications

import (
	"fmt"
	"net/http"
	"time"

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

// Sends an email to the notification email address with the lead information.
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
				body { font-family: "Inter", -apple-system, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 20px; background-color: #f1f5f9; }
				.wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
				.header { background: linear-gradient(135deg, #0369a1 0%%, #059669 100%%); padding: 32px 24px; text-align: center; }
				.header h2 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }
				.content { padding: 40px 32px; }
				.field { margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
				.field:last-child { border-bottom: none; }
				.label { font-weight: 700; color: #64748b; font-size: 11px; display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1.5px; }
				.value { color: #0f172a; font-size: 16px; font-weight: 600; }
				.value a { color: #0369a1; text-decoration: none; border-bottom: 1px solid rgba(3, 105, 161, 0.3); }
				.message-box { margin-top: 16px; padding: 20px; background-color: #f8fafc; border-left: 4px solid #059669; border-radius: 4px; font-size: 15px; color: #334155; line-height: 1.7; white-space: pre-wrap; shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
				.footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
			</style>
		</head>
		<body>
			<div class="wrapper">
				<div class="header">
					<h2>Consulting Engagement</h2>
				</div>
				<div class="content">
					<div class="field">
						<span class="label">Prospective Partner</span>
						<div class="value">%s %s</div>
					</div>
					<div class="field">
						<span class="label">Contact Endpoint</span>
						<div class="value"><a href="mailto:%s">%s</a></div>
					</div>
					<div class="field">
						<span class="label">Organization</span>
						<div class="value">%s</div>
					</div>
					<div class="field">
						<span class="label">Strategic Role</span>
						<div class="value">%s</div>
					</div>
					<div class="field">
						<span class="label">Engagement Objectives</span>
						<div class="message-box">%s</div>
					</div>
				</div>
				<div class="footer">
					KYBERN CONSULTING · CLOUD ARCHITECTURE & DEVOPS STRATEGY
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

// Sends welcome email to the student with their login credentials.
func (n *ResendNotifier) SendStudentWelcomeEmail(firstName, email, tempPassword string) error {
	subject := "Welcome to the Kybern Academy Cohort!"
	sender := "Kybern Academy <academy@kyberncloud.com>"
	
	htmlTemplate := `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: "Inter", -apple-system, sans-serif; line-height: 1.6; color: #cbd5e1; margin: 0; padding: 20px; background-color: #020617; }
				.wrapper { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
				.header { background-color: #020617; padding: 32px 24px; text-align: center; border-bottom: 1px solid #1e293b; }
				.status-badge { display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; background-color: rgba(234, 179, 8, 0.1); color: #eab308; border: 1px solid #eab308; margin-bottom: 20px; }
				.header h2 { margin: 0; color: #f8fafc; font-size: 24px; font-weight: 900; tracking: tight; }
				.content { padding: 40px 32px; }
				.content p { margin-bottom: 20px; font-size: 15px; color: #94a3b8; }
				.content strong { color: #f8fafc; }
				.password-box { background-color: #020617; border: 1px dashed #eab308; padding: 24px; margin: 32px 0; border-radius: 8px; text-align: center; }
				.password-label { display: block; color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
				.password-value { color: #eab308; font-family: "SF Mono", "Courier New", monospace; font-size: 28px; font-weight: 900; letter-spacing: 4px; }
				.button { display: inline-block; background-color: #eab308; color: #020617 !important; font-weight: 900; padding: 16px 32px; border-radius: 8px; text-decoration: none; margin: 12px 0; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; }
				.footer { background-color: #020617; padding: 32px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1e293b; }
			</style>
		</head>
		<body>
			<div class="wrapper">
				<div class="header">
					<div class="status-badge">Admission Confirmed</div>
					<h2>Welcome to the Cohort, %s.</h2>
				</div>
				<div class="content">
					<p>Congratulations on securing your seat in the <strong>Kybern Academy Cloud Native Training Cohort</strong>. You are now part of an elite group of engineers mastering the modern stack.</p>
					<p>Your LMS Student Portal has been provisioned. Use the credentials below to initialize your access.</p>
					
					<div class="password-box">
						<span class="password-label">Temporary Access Token</span>
						<span class="password-value">%s</span>
					</div>

					<div style="text-align: center;">
						<a href="%s/academy/login" class="button">Access Student Portal</a>
					</div>
					
					<p style="margin-top: 32px; font-size: 13px; font-style: italic;">Note: You will be prompted to set a permanent password upon your first entry.</p>
				</div>
				<div class="footer">
					KYBERN ACADEMY · CLOUD NATIVE MENTORSHIP<br/>
					BUILDING THE INFRASTRUCTURE OF THE FUTURE
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

// Sends password reset email to the student.
func (n *ResendNotifier) SendPasswordResetEmail(email, token string) error {
	subject := "Reset your Kybern Academy Password"
	sender := "Kybern Academy <academy@kyberncloud.com>"
	resetLink := fmt.Sprintf("%s/academy/reset-password?token=%s", n.frontendURL, token)
	
	htmlTemplate := `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: "Inter", -apple-system, sans-serif; line-height: 1.6; color: #cbd5e1; margin: 0; padding: 20px; background-color: #020617; }
				.wrapper { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
				.header { background-color: #1e293b; padding: 24px; border-bottom: 2px solid #eab308; }
				.header-text { color: #eab308; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0; font-family: monospace; }
				.content { padding: 40px 24px; text-align: center; }
				.content h2 { color: #f8fafc; font-size: 20px; font-weight: 800; margin-bottom: 16px; }
				.content p { color: #94a3b8; font-size: 15px; margin-bottom: 32px; }
				.button { display: inline-block; background-color: #eab308; color: #020617 !important; font-weight: 900; padding: 16px 32px; border-radius: 8px; text-decoration: none; margin: 0 0; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; }
				.footer { background-color: #020617; padding: 24px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1e293b; }
			</style>
		</head>
		<body>
			<div class="wrapper">
				<div class="header">
					<p class="header-text">> AUTHORIZE_PASSWORD_RESET.SH</p>
				</div>
				<div class="content">
					<h2>Secure Access Requested</h2>
					<p>A request was logged to re-authorize the password for your Kybern Academy account. This cryptographic link will expire in exactly 60 minutes.</p>
					<a href="%s" class="button">Confirm New Identity</a>
				</div>
				<div class="footer">
					KYBERN SECURITY SYSTEM · AUTOMATED PROTOCOL
				</div>
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

// Sends warning email to the student.
func (n *ResendNotifier) SendStudentWarningEmail(firstName, email, reason string, warningCount int) error {
    subject := fmt.Sprintf("Action Required: Disciplinary Warning [%d]", warningCount)
    sender := "Kybern Academy Admin <academy@kyberncloud.com>"
    
    htmlTemplate := `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: "Inter", -apple-system, sans-serif; line-height: 1.6; color: #cbd5e1; margin: 0; padding: 20px; background-color: #020617; }
                .wrapper { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
                .header { background-color: rgba(234, 179, 8, 0.05); padding: 24px; border-bottom: 2px solid #eab308; }
                .header-text { color: #eab308; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0; font-family: monospace; }
                .content { padding: 40px 32px; }
                .greeting { color: #f8fafc; font-size: 18px; font-weight: 800; margin-bottom: 16px; }
                .alert-box { background-color: rgba(234, 179, 8, 0.1); border-left: 4px solid #eab308; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
                .alert-title { color: #eab308; font-weight: 800; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
                .alert-detail { color: #f8fafc; font-size: 14px; line-height: 1.5; }
                .reason-container { margin: 32px 0; }
                .reason-label { color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; display: block; }
                .reason-box { background-color: #020617; border: 1px solid #1e293b; padding: 20px; color: #cbd5e1; font-size: 14px; font-family: monospace; white-space: pre-wrap; border-radius: 8px; }
                .footer { background-color: #020617; padding: 32px; text-align: center; border-top: 1px solid #1e293b; font-size: 11px; color: #475569; }
				.official-note { color: #94a3b8; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="header">
                    <p class="header-text">> SYSTEM_WATCHDOG: BREACH_DETECTED</p>
                </div>
                <div class="content">
                    <div class="greeting">Hello %s,</div>
                    <p class="official-note">The Kybern Academy infrastructure has logged a conduct violation linked to your account within the current cohort environment.</p>
                    
                    <div class="alert-box">
                        <div class="alert-title">ESCALATION LEVEL: %d</div>
                        <div class="alert-detail">Immediate corrective behavior is mandatory. Your active enrollment status is now under automated review.</div>
                    </div>

                    <div class="reason-container">
                        <span class="reason-label">Internal Incident Log:</span>
                        <div class="reason-box">%s</div>
                    </div>

                    <p class="official-note">Please review the cohort operational guidelines. Persistent violations will trigger an automatic system disqualification and revocation of all infrastructure access.</p>
                </div>
                <div class="footer">
                    KYBERN ACADEMY ADMINISTRATION<br/>
                    <span style="font-size: 10px; opacity: 0.5; margin-top: 10px; display: block;">SECURE AUTOMATED INCIDENT REPORT</span>
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


// Sends admin invite email to the admin.
func (n *ResendNotifier) SendAdminInviteEmail(firstName, email, tempPassword string) error {
    subject := "You've Been Invited to the Admin Panel"
    sender := "Kybern Platform <admin@kyberncloud.com>"
    
    htmlTemplate := `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: "Inter", -apple-system, sans-serif; line-height: 1.6; color: #cbd5e1; margin: 0; padding: 20px; background-color: #020617; }
                .wrapper { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
                .header { background-color: #1e293b; padding: 24px; border-bottom: 2px solid #eab308; }
                .header h2 { margin: 0; color: #f8fafc; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; font-family: monospace; }
                .content { padding: 40px 32px; }
                .greeting { color: #f8fafc; font-size: 20px; font-weight: 800; margin-bottom: 20px; }
                .body-text { color: #94a3b8; font-size: 15px; margin-bottom: 24px; }
                .credentials-box { background-color: #020617; border: 1px solid #1e293b; padding: 24px; margin: 32px 0; border-radius: 8px; }
                .cred-label { color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; display: block; }
                .cred-value { color: #eab308; font-family: monospace; font-size: 18px; font-weight: 700; margin-bottom: 20px; display: block; }
                .cred-value:last-child { margin-bottom: 0; }
                .alert-box { background-color: rgba(234, 179, 8, 0.05); border-left: 4px solid #eab308; padding: 16px; margin: 32px 0; border-radius: 0 8px 8px 0; }
                .alert-text { color: #eab308; font-size: 13px; font-weight: 600; line-height: 1.5; }
                .footer { background-color: #020617; padding: 32px; text-align: center; border-top: 1px solid #1e293b; font-size: 11px; color: #475569; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="header">
                    <h2>> ADMIN_PRIVILEGES_PROVISIONED</h2>
                </div>
                <div class="content">
                    <div class="greeting">System Access: %s</div>
                    <p class="body-text">You have been granted administrative privileges on the Kybern Platform. Your temporary credentials have been generated below.</p>
                    
                    <div class="credentials-box">
                        <span class="cred-label">Login Identifier</span>
                        <span class="cred-value">%s</span>
                        <span class="cred-label">Initialization Secret</span>
                        <span class="cred-value" style="letter-spacing: 2px;">%s</span>
                    </div>

                    <div class="alert-box">
                        <div class="alert-text">Security Requirement: You must rotate this initialization secret upon your first interaction with the portal. Do not transmit these credentials over unsecured channels.</div>
                    </div>
                </div>
                <div class="footer">
                    KYBERN SYSTEM ADMINISTRATION<br/>
                    <span style="font-size: 10px; opacity: 0.5; margin-top: 10px; display: block;">SECURE AUTOMATED PROVISIONING</span>
                </div>
            </div>
        </body>
        </html>
    `
    
    htmlBody := fmt.Sprintf(htmlTemplate, firstName, email, tempPassword)
    params := &resend.SendEmailRequest{
        From:    sender,
        To:      []string{email},
        Subject: subject,
        Html:    htmlBody,
    }

    _, err := n.client.Emails.Send(params)
    return err
}


// Sends disqualification email to the student.
func (n *ResendNotifier) SendStudentDisqualificationEmail(firstName, email, reason string) error {
    subject := "TERMINATION NOTICE: Academy Access Revoked"
    sender := "Kybern Academy Admin <academy@kyberncloud.com>"
    
    htmlTemplate := `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: "Inter", -apple-system, sans-serif; line-height: 1.6; color: #cbd5e1; margin: 0; padding: 20px; background-color: #020617; }
                .wrapper { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #7f1d1d; border-radius: 12px; overflow: hidden; }
                .header { background-color: #450a0a; padding: 24px; border-bottom: 2px solid #ef4444; }
                .header-text { color: #ef4444; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0; font-family: monospace; }
                .content { padding: 40px 32px; }
                .greeting { color: #f8fafc; font-size: 18px; font-weight: 800; margin-bottom: 20px; }
                .alert-box { background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
                .alert-title { color: #fca5a5; font-weight: 800; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
                .alert-detail { color: #f8fafc; font-size: 14px; line-height: 1.5; }
                .reason-container { margin: 32px 0; }
                .reason-label { color: #ef4444; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; display: block; }
                .reason-box { background-color: #020617; border: 1px solid #7f1d1d; padding: 20px; color: #fca5a5; font-size: 14px; font-family: monospace; white-space: pre-wrap; border-radius: 8px; }
                .footer { background-color: #020617; padding: 32px; text-align: center; border-top: 1px solid #450a0a; font-size: 11px; color: #475569; }
				.termination-note { color: #94a3b8; font-size: 15px; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="header">
                    <p class="header-text">> CRITICAL: ACCESS_REVOKED_FINAL</p>
                </div>
                <div class="content">
                    <div class="greeting">Hello %s,</div>
                    <p class="termination-note">Effective immediately, your student status at Kybern Academy has been shifted to <strong>DISQUALIFIED</strong>.</p>
                    
                    <div class="alert-box">
                        <div class="alert-title">STATUS: TERMINATED</div>
                        <div class="alert-detail">Your access to the learning portal, infrastructure resources, and community channels has been permanently revoked by the system.</div>
                    </div>

                    <div class="reason-container">
                        <span class="reason-label">Official Cause of Action:</span>
                        <div class="reason-box">%s</div>
                    </div>

                    <p class="termination-note">This decision is final and non-negotiable. Best of luck with your future endeavors.</p>
                </div>
                <div class="footer">
                    KYBERN ACADEMY ADMINISTRATION<br/>
                    <span style="font-size: 10px; opacity: 0.5; margin-top: 10px; display: block;">AUTOMATED INFRASTRUCTURE ENFORCEMENT</span>
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


// Sends academic probation email to the student.
func (n *ResendNotifier) SendAcademicProbationEmail(firstName, email, reason string) error {
    subject := "OFFICIAL NOTICE: Academic Probation Status"
    sender := "Kybern Academy Admin <academy@kyberncloud.com>"

    htmlTemplate := `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: "Inter", -apple-system, sans-serif; line-height: 1.6; color: #cbd5e1; margin: 0; padding: 20px; background-color: #020617; }
                .wrapper { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #eab308; border-radius: 12px; overflow: hidden; }
                .header { background-color: rgba(234, 179, 8, 0.05); padding: 24px; border-bottom: 2px solid #eab308; }
                .header-text { color: #eab308; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0; font-family: monospace; }
                .content { padding: 40px 32px; }
                .greeting { color: #f8fafc; font-size: 18px; font-weight: 800; margin-bottom: 16px; }
                .probation-box { background-color: rgba(234, 179, 8, 0.05); border-left: 4px solid #eab308; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
                .probation-title { color: #eab308; font-weight: 800; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; }
                .probation-detail { color: #f8fafc; font-size: 14px; line-height: 1.5; }
                .reason-container { margin: 32px 0; }
                .reason-label { color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; display: block; }
                .reason-box { background-color: #020617; border: 1px solid #1e293b; padding: 20px; color: #cbd5e1; font-size: 14px; font-family: monospace; white-space: pre-wrap; border-radius: 8px; }
                .footer { background-color: #020617; padding: 32px; text-align: center; border-top: 1px solid #1e293b; font-size: 11px; color: #475569; }
				.official-note { color: #94a3b8; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="header">
                    <p class="header-text">> WARNING: ACADEMIC_PROBATION_NOTICE</p>
                </div>
                <div class="content">
                    <div class="greeting">Hello %s,</div>
                    <p class="official-note">This is a system-generated alert regarding your active student status. Your account has been shifted to <strong>Academic Probation</strong>.</p>
                    
                    <div class="probation-box">
                        <div class="probation-title">STATUS: PROBATIONARY HOLD</div>
                        <div class="probation-detail">Access remains active, but your curriculum engagement and mentorship participation will be monitored under strict observation for the next 14 days.</div>
                    </div>

                    <div class="reason-container">
                        <span class="reason-label">Official Review Rationale:</span>
                        <div class="reason-box">%s</div>
                    </div>

                    <p class="official-note">Consistent performance improvement is expected. Please interface with the instruction team immediately if you require clarifying directives.</p>
                </div>
                <div class="footer">
                    KYBERN ACADEMY INSTRUCTION TEAM<br/>
                    <span style="font-size: 10px; opacity: 0.5; margin-top: 10px; display: block;">OFFICIAL CORRESPONDENCE LOG</span>
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


// Sends billing reminder email to the student.
func (n *ResendNotifier) SendBillingReminderEmail(email string, dueDate time.Time, amountKobo int) error {
	subject := "SYSTEM_LEDGER: INVOICE_PENDING"
	sender := "Kybern Academy Ledger <academy@kyberncloud.com>"
	
	amountNaira := float64(amountKobo) / 100.0
	dateStr := dueDate.Format("Jan 02, 2006")
	
	htmlTemplate := `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: "Inter", -apple-system, sans-serif; line-height: 1.6; color: #cbd5e1; margin: 0; padding: 20px; background-color: #020617; }
				.wrapper { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
				.header { background-color: #1e293b; padding: 24px; border-bottom: 2px solid #eab308; }
				.header-text { color: #eab308; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0; font-family: monospace; }
				.content { padding: 40px 32px; }
				.data-box { background-color: #020617; border: 1px solid #1e293b; padding: 24px; margin: 32px 0; border-radius: 8px; }
				.label { color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; display: block; }
				.value { color: #eab308; font-size: 24px; font-weight: 900; font-family: monospace; display: block; margin-bottom: 16px; }
				.warning-text { color: #94a3b8; font-size: 15px; margin-bottom: 24px; line-height: 1.6; }
				.critical-text { color: #ef4444; font-weight: 800; }
				.button { display: inline-block; background-color: #eab308; color: #020617 !important; font-weight: 900; padding: 16px 32px; border-radius: 8px; text-decoration: none; margin: 12px 0; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; }
				.footer { background-color: #020617; padding: 32px; text-align: center; border-top: 1px solid #1e293b; font-size: 11px; color: #475569; }
			</style>
		</head>
		<body>
			<div class="wrapper">
				<div class="header">
					<p class="header-text">> SYSTEM_LEDGER: INVOICE_PENDING</p>
				</div>
				<div class="content">
					<p class="warning-text">An outstanding balance has been detected on your student ledger. Settlement is required to maintain uninterrupted access to the academy infrastructure.</p>
					
					<div class="data-box">
						<span class="label">Amount Due</span>
						<span class="value">₦%0.2f</span>
						<span class="label">Deadline</span>
						<span class="value">%s</span>
					</div>

					<p class="warning-text">Failure to process this installment by <span class="critical-text">23:59 WAT on the specified deadline</span> will trigger an automated account lockdown and revocation of curriculum privileges.</p>
					
					<div style="text-align: center;">
						<a href="%s/academy/dashboard/billing" class="button">Access Financial Terminal</a>
					</div>
				</div>
				<div class="footer">
					KYBERN FINANCIAL INFRASTRUCTURE<br/>
					<span style="font-size: 10px; opacity: 0.5; margin-top: 10px; display: block;">AUTOMATED RECONCILIATION MESSAGE</span>
				</div>
			</div>
		</body>
		</html>
	`
	
	htmlBody := fmt.Sprintf(htmlTemplate, amountNaira, dateStr, n.frontendURL)
	params := &resend.SendEmailRequest{
		From:    sender,
		To:      []string{email},
		Subject: subject,
		Html:    htmlBody,
	}

	_, err := n.client.Emails.Send(params)
	return err
}


// Sends account suspended email to the student.
func (n *ResendNotifier) SendAccountSuspendedEmail(email string, minAmountKobo int, remainingBalanceKobo int) error {
	subject := "CRITICAL: ACCOUNT_SUSPENDED"
	sender := "Kybern Academy Security <academy@kyberncloud.com>"
	
	minNaira := float64(minAmountKobo) / 100.0
	totalNaira := float64(remainingBalanceKobo) / 100.0
	
	htmlTemplate := `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: "Inter", -apple-system, sans-serif; line-height: 1.6; color: #cbd5e1; margin: 0; padding: 20px; background-color: #020617; }
				.wrapper { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #ef4444; border-radius: 12px; overflow: hidden; }
				.header { background-color: #450a0a; padding: 24px; border-bottom: 2px solid #ef4444; }
				.header-text { color: #ef4444; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0; font-family: monospace; }
				.content { padding: 40px 32px; }
				.alert-box { background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
				.alert-detail { color: #f8fafc; font-size: 15px; font-weight: 500; }
				.data-box { background-color: #020617; border: 1px solid #1e293b; padding: 24px; margin: 32px 0; border-radius: 8px; }
				.label { color: #64748b; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; display: block; }
				.value { color: #ef4444; font-size: 24px; font-weight: 900; font-family: monospace; display: block; margin-bottom: 20px; }
				.value:last-child { margin-bottom: 0; }
				.button { display: inline-block; background-color: #ef4444; color: #ffffff !important; font-weight: 900; padding: 16px 32px; border-radius: 8px; text-decoration: none; margin: 12px 0; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; }
				.footer { background-color: #020617; padding: 32px; text-align: center; border-top: 1px solid #450a0a; font-size: 11px; color: #475569; }
			</style>
		</head>
		<body>
			<div class="wrapper">
				<div class="header">
					<p class="header-text">> CRITICAL: ACCOUNT_LOCKDOWN_INITIATED</p>
				</div>
				<div class="content">
					<div class="alert-box">
						<p class="alert-detail">System access has been automatically revoked. Your student hub and lab environment are now in a locked state due to budget reconciliation issues.</p>
					</div>
					
					<div class="data-box">
						<span class="label">Minimum Unlock Threshold</span>
						<span class="value">₦%0.2f</span>
						<span class="label">Total Ledger Exposure</span>
						<span class="value">₦%0.2f</span>
					</div>

					<p style="color: #94a3b8; font-size: 14px; margin-bottom: 32px;">Meeting the minimum threshold will trigger an immediate automated restoration of all services.</p>
					
					<div style="text-align: center;">
						<a href="%s/academy/dashboard/billing" class="button">Unlock System Access</a>
					</div>
				</div>
				<div class="footer">
					KYBERN SECURITY & FINANCE<br/>
					<span style="font-size: 10px; opacity: 0.5; margin-top: 10px; display: block;">AUTOMATED ENFORCEMENT LOG #%d</span>
				</div>
			</div>
		</body>
		</html>
	`
	
	htmlBody := fmt.Sprintf(htmlTemplate, minNaira, totalNaira, n.frontendURL, time.Now().Unix()%1000000)
	params := &resend.SendEmailRequest{
		From:    sender,
		To:      []string{email},
		Subject: subject,
		Html:    htmlBody,
	}

	_, err := n.client.Emails.Send(params)
	return err
}


// Sends payment confirmation email to the student.
func (n *ResendNotifier) SendPaymentConfirmationEmail(email string, amountKobo int, remainingKobo int) error {
	subject := "Payment Confirmed — Kybern Academy"
	sender := "Kybern Academy Billing <billing@kyberncloud.com>"

	amountNaira := float64(amountKobo) / 100.0
	remainingNaira := float64(remainingKobo) / 100.0

	var statusHeader string
	var statusColor string
	var statusMsg string

	if remainingKobo <= 0 {
		statusHeader = "FEES FULLY PAID"
		statusColor = "#facc15" // Cyber Yellow
		statusMsg = "Congratulations! Your tuition is now fully paid. You have unrestricted lifetime access to all current and future curriculum updates for this cohort."
	} else {
		statusHeader = "PAYMENT CONFIRMED"
		statusColor = "#22c55e" // Green
		statusMsg = "We've successfully updated your ledger. Your account remains in good standing."
	}

	htmlTemplate := `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: "Inter", -apple-system, sans-serif; line-height: 1.6; color: #cbd5e1; margin: 0; padding: 20px; background-color: #020617; }
				.wrapper { max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
				.header { background-color: #020617; padding: 32px; text-align: center; border-bottom: 1px solid #1e293b; }
				.status-badge { display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; background-color: rgba(250, 204, 21, 0.1); color: %s; border: 1px solid %s; }
				.content { padding: 48px 32px; }
				.amount-hero { text-align: center; margin-bottom: 48px; }
				.amount-label { color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; display: block; }
				.amount-value { color: #f8fafc; font-size: 48px; font-weight: 900; margin: 0; }
				.ledger-box { background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 24px; margin: 40px 0; }
				.ledger-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
				.ledger-row:last-child { margin-bottom: 0; padding-top: 12px; border-top: 1px solid #1e293b; }
				.ledger-label { color: #64748b; }
				.ledger-value { color: #cbd5e1; font-weight: 700; }
				.footer { background-color: #020617; padding: 40px 32px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1e293b; }
				.button { display: inline-block; background-color: #facc15; color: #020617 !important; font-weight: 900; padding: 16px 32px; border-radius: 8px; text-decoration: none; margin: 24px 0; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; }
				.success-text { color: #94a3b8; font-size: 15px; text-align: center; line-height: 1.6; }
			</style>
		</head>
		<body>
			<div class="wrapper">
				<div class="header">
					<div class="status-badge">%s</div>
				</div>
				<div class="content">
					<div class="amount-hero">
						<span class="amount-label">Payment Reconciled</span>
						<p class="amount-value">₦%0.2f</p>
					</div>

					<p class="success-text">%s</p>

					<div class="ledger-box">
						<div class="ledger-row">
							<span class="ledger-label">Resource Allocation</span>
							<span class="ledger-value">Academy Tuition Installment</span>
						</div>
						<div class="ledger-row">
							<span class="ledger-label">Outstanding Commitment</span>
							<span class="ledger-value" style="color: %s;">₦%0.2f</span>
						</div>
					</div>

					<div style="text-align: center;">
						<a href="%s/academy/dashboard/billing" class="button">View Billing Hub</a>
					</div>
				</div>
				<div class="footer">
					KYBERN ACADEMY · CLOUD NATIVE MENTORSHIP<br/>
					THIS IS AN AUTOMATED SECURE TRANSACTION RECEIPT
				</div>
			</div>
		</body>
		</html>
	`

	htmlBody := fmt.Sprintf(htmlTemplate, statusColor, statusColor, statusHeader, amountNaira, statusMsg, statusColor, remainingNaira, n.frontendURL)
	params := &resend.SendEmailRequest{
		From:    sender,
		To:      []string{email},
		Subject: subject,
		Html:    htmlBody,
	}

	_, err := n.client.Emails.Send(params)
	return err
}

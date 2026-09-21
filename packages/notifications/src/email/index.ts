import nodemailer, { type Transporter } from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface IEmailService {
  sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * SmtpEmailAdapter
 * Production SMTP transport implementation configured for Gmail/Custom SMTP
 */
export class SmtpEmailAdapter implements IEmailService {
  private transporter: Transporter | null = null;
  private defaultFrom: string;

  constructor() {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.defaultFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || "VaahanSafe <vaahansafe@gmail.com>";

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for 587 (STARTTLS)
        auth: {
          user,
          pass,
        },
      });
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.transporter) {
        console.warn("[SmtpEmailAdapter] SMTP credentials not set. Simulating email dispatch to:", options.to);
        return { success: true, messageId: `mock_${Date.now()}` };
      }

      const info = await this.transporter.sendMail({
        from: options.from || this.defaultFrom,
        to: options.to,
        replyTo: options.replyTo || "support@vaahansafe.com",
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]+>/g, ""),
      });

      return { success: true, messageId: info.messageId };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[SmtpEmailAdapter] Email delivery failed:", errorMsg);
      return { success: false, error: errorMsg };
    }
  }
}

// Singleton email service instance
let emailServiceInstance: SmtpEmailAdapter | null = null;
export function getEmailService(): SmtpEmailAdapter {
  if (!emailServiceInstance) {
    emailServiceInstance = new SmtpEmailAdapter();
  }
  return emailServiceInstance;
}

export interface WelcomeEmailOptions {
  to: string;
  name?: string;
  phone?: string;
  phoneVerified?: boolean;
  authProvider?: "GOOGLE" | "PHONE" | "EMAIL_OTP";
  appUrl?: string;
  isFirstLogin?: boolean;
}

/**
 * 01. Welcome Email Template
 * Production-grade, ultra-responsive, accessible HTML email template for new customers.
 * Displays accurate real-time phone verification status, security metadata, and linear roadmap.
 */
export async function sendWelcomeEmail(
  toOrOptions: string | WelcomeEmailOptions,
  legacyName?: string,
  legacyAppUrl = "https://app.vaahansafe.com"
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const options: WelcomeEmailOptions =
    typeof toOrOptions === "string"
      ? { to: toOrOptions, name: legacyName, appUrl: legacyAppUrl, phoneVerified: false }
      : toOrOptions;

  const { to, phone, authProvider = options.phone ? "PHONE" : "GOOGLE" } = options;
  const isPhoneVerified = options.phoneVerified ?? (!!phone);
  const recipientName = options.name ? options.name.split(" ")[0] : "there";
  const targetAppUrl = options.appUrl || legacyAppUrl;
  const loginUrl = `${targetAppUrl}/login`;
  const verifyPhoneUrl = `${targetAppUrl}/onboarding/phone`;

  // Format phone masked for security
  const formattedPhone = phone
    ? phone.replace(/(\+91)(\d{2})\d{4}(\d{4})/, "$1 $2••• $3")
    : null;

  const providerLabel =
    authProvider === "GOOGLE"
      ? "Google OAuth 2.0 (Verified OpenID)"
      : "MSG91 Transactional SMS OTP";

  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>Welcome to VaahanSafe</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #FAF9F5; }

    /* Responsive Styles */
    @media only screen and (max-width: 600px) {
      .email-wrapper { width: 100% !important; padding: 16px 8px !important; }
      .email-card { width: 100% !important; border-radius: 12px !important; }
      .header-padding { padding: 28px 20px 20px 20px !important; }
      .body-padding { padding: 28px 20px !important; }
      .footer-padding { padding: 24px 20px !important; }
      .hero-title { font-size: 22px !important; line-height: 1.25 !important; }
      .hero-desc { font-size: 14px !important; line-height: 1.6 !important; }
      .action-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
      .step-item { display: block !important; width: 100% !important; }
    }

    /* Dark Mode Hints */
    @media (prefers-color-scheme: dark) {
      .bg-canvas { background-color: #141312 !important; }
      .bg-card { background-color: #1C1A18 !important; border-color: #2E2B27 !important; }
      .text-heading { color: #FAF9F5 !important; }
      .text-body { color: #A09D96 !important; }
      .panel-soft { background-color: #24221F !important; border-color: #2E2B27 !important; }
      .border-hairline { border-color: #2E2B27 !important; }
      .footer-text { color: #77736D !important; }
    }
  </style>
</head>
<body class="bg-canvas" style="margin: 0; padding: 0; background-color: #FAF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Preheader Preview Text (Hidden in body, shown in inbox list) -->
  <div style="display: none; font-size: 1px; color: #FAF9F5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Welcome to VaahanSafe, ${recipientName}. Your vehicle safety identity is ready to configure. Mobile status: ${isPhoneVerified ? "VERIFIED" : "VERIFICATION REQUIRED"}.
    &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <!-- Email Wrapper -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" class="bg-canvas" style="background-color: #FAF9F5;">
    <tr>
      <td align="center" class="email-wrapper" style="padding: 40px 16px;">
        <!-- Center Card Container (Max 580px) -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card bg-card" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E6DFD8; overflow: hidden; box-shadow: 0 4px 24px rgba(20, 20, 19, 0.04);">
          
          <!-- 01. Brand Header -->
          <tr>
            <td align="center" class="header-padding" style="padding: 36px 36px 22px 36px; border-bottom: 1px solid #F5EFEB;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <!-- Wordmark -->
                    <div style="font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: #141413;">
                      Vaahan<span style="color: #CC785C;">Safe</span>
                    </div>
                    <!-- Identity Rail Tag -->
                    <div style="margin-top: 6px; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.24em; color: #8E8B82;">
                      ● ────── VEHICLE SAFETY IDENTITY ────── ●
                    </div>
                    <!-- Status Pill -->
                    <div style="margin-top: 14px;">
                      <span style="display: inline-block; padding: 4px 12px; background-color: ${isPhoneVerified ? "#EBF7F4" : "#FFF8F5"}; color: ${isPhoneVerified ? "#2E7D6E" : "#CC785C"}; border: 1px solid ${isPhoneVerified ? "#C5EAE1" : "#F6D6CA"}; border-radius: 20px; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">
                        ● ${isPhoneVerified ? "ACCOUNT ACTIVE & SECURED" : "ACCOUNT ACTIVE — PHONE VERIFICATION PENDING"}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 02. Body Content -->
          <tr>
            <td class="body-padding" style="padding: 36px;">
              <!-- Welcome Title -->
              <h1 class="hero-title text-heading" style="margin: 0 0 12px 0; font-size: 26px; font-weight: 600; line-height: 1.25; color: #141413; letter-spacing: -0.02em;">
                Welcome to VaahanSafe, ${recipientName}.
              </h1>
              <p class="hero-desc text-body" style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #6C6A64;">
                Your vehicle identity account has been successfully initialized on the Cloudflare edge platform.
              </p>

              <!-- Account State & Mobile Verification Metadata Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" class="panel-soft" style="background-color: #FAF9F5; border-radius: 12px; border: 1px solid #E6DFD8; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: #CC785C; font-weight: 700; margin-bottom: 10px;">
                      IDENTITY &amp; VERIFICATION STATUS
                    </div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 1.8; color: #3D3D3A;">
                      <tr>
                        <td width="38%" style="color: #8E8B82; font-size: 12px; padding: 3px 0;">Account Email</td>
                        <td width="62%" style="font-weight: 600; font-family: monospace; color: #141413; padding: 3px 0;">${to}</td>
                      </tr>
                      <tr>
                        <td style="color: #8E8B82; font-size: 12px; padding: 3px 0;">Mobile Verification</td>
                        <td style="padding: 3px 0;">
                          ${
                            isPhoneVerified
                              ? `<span style="display: inline-block; padding: 2px 8px; background-color: #EBF7F4; color: #2E7D6E; border: 1px solid #C5EAE1; border-radius: 10px; font-family: monospace; font-size: 10px; font-weight: 700;">
                                  ● VERIFIED ${formattedPhone ? `(${formattedPhone})` : ""}
                                </span>`
                              : `<span style="display: inline-block; padding: 2px 8px; background-color: #FFF5F0; color: #CC785C; border: 1px solid #F6D6CA; border-radius: 10px; font-family: monospace; font-size: 10px; font-weight: 700;">
                                  ⚠️ ACTION REQUIRED: PENDING
                                </span>`
                          }
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #8E8B82; font-size: 12px; padding: 3px 0;">Authentication</td>
                        <td style="font-weight: 500; padding: 3px 0;">${providerLabel}</td>
                      </tr>
                      <tr>
                        <td style="color: #8E8B82; font-size: 12px; padding: 3px 0;">Session Defense</td>
                        <td style="font-weight: 500; padding: 3px 0;">RFC 6265 HttpOnly &amp; Turnstile</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Contextual Mobile Verification Callout -->
              ${
                !isPhoneVerified
                  ? `
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF8F5; border-radius: 10px; border: 1.5px solid #F6D6CA; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 18px;">
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #CC785C; margin-bottom: 6px;">
                      ⚠️ MANDATORY STEP: MOBILE NUMBER REQUIRED
                    </div>
                    <div style="font-size: 13px; line-height: 1.6; color: #3D3D3A;">
                      Because VaahanSafe is an emergency dispatch and vehicle safety platform, a verified Indian mobile number (+91) is required before your vehicle stickers can be activated.
                    </div>
                    <div style="margin-top: 12px;">
                      <a href="${verifyPhoneUrl}" target="_blank" style="display: inline-block; padding: 9px 18px; background-color: #CC785C; color: #FFFFFF; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; letter-spacing: 0.02em;">
                        Verify Mobile Number &rarr;
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
              `
                  : `
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4FBF9; border-radius: 10px; border: 1.5px solid #C5EAE1; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #2E7D6E; margin-bottom: 4px;">
                      ✔ EMERGENCY ALERT PIPELINE CONNECTED
                    </div>
                    <div style="font-size: 13px; line-height: 1.5; color: #3D3D3A;">
                      Your verified mobile number ${formattedPhone ? `<strong>${formattedPhone}</strong> ` : ""}is registered for instant WhatsApp and SMS incident notifications whenever your QR code is scanned.
                    </div>
                  </td>
                </tr>
              </table>
              `
              }

              <!-- 3-Step Linear Roadmap -->
              <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; color: #8E8B82; font-weight: 700; margin-bottom: 14px;">
                NEXT STEPS
              </div>

              <!-- Step 01 -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
                <tr>
                  <td width="36" valign="top" style="padding-top: 2px;">
                    <div style="width: 26px; height: 26px; border-radius: 50%; background-color: rgba(204, 120, 92, 0.12); color: #CC785C; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; text-align: center; line-height: 26px;">
                      01
                    </div>
                  </td>
                  <td valign="top" style="padding-left: 8px;">
                    <div style="font-size: 14px; font-weight: 600; color: #141413;">Link Your Vehicle Plate</div>
                    <div style="font-size: 13px; line-height: 1.5; color: #6C6A64; margin-top: 2px;">
                      Enter your registration plate number to create its dedicated identity object in your customer dashboard.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Step 02 -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 12px;">
                <tr>
                  <td width="36" valign="top" style="padding-top: 2px;">
                    <div style="width: 26px; height: 26px; border-radius: 50%; background-color: rgba(204, 120, 92, 0.12); color: #CC785C; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; text-align: center; line-height: 26px;">
                      02
                    </div>
                  </td>
                  <td valign="top" style="padding-left: 8px;">
                    <div style="font-size: 14px; font-weight: 600; color: #141413;">Configure Priority Contacts</div>
                    <div style="font-size: 13px; line-height: 1.5; color: #6C6A64; margin-top: 2px;">
                      Assign trusted emergency contacts who will be notified via SMS and WhatsApp whenever your vehicle requires attention.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Step 03 -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td width="36" valign="top" style="padding-top: 2px;">
                    <div style="width: 26px; height: 26px; border-radius: 50%; background-color: rgba(204, 120, 92, 0.12); color: #CC785C; font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; text-align: center; line-height: 26px;">
                      03
                    </div>
                  </td>
                  <td valign="top" style="padding-left: 8px;">
                    <div style="font-size: 14px; font-weight: 600; color: #141413;">Affix &amp; Activate QR Sticker</div>
                    <div style="font-size: 13px; line-height: 1.5; color: #6C6A64; margin-top: 2px;">
                      Scan your weatherproof UV-laminated windshield sticker to link it permanently to your verified safety profile.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Bulletproof Call To Action Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 26px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 8px; background-color: #CC785C;">
                          <a href="${loginUrl}" target="_blank" class="action-btn" style="display: block; width: 100%; box-sizing: border-box; background-color: #CC785C; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 15px 28px; border-radius: 8px; text-align: center; letter-spacing: 0.03em; border: 1px solid #B8654A;">
                            Access Your Vehicle Identity &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Privacy Shield Notice -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF9F5; border-radius: 10px; border: 1px solid #E6DFD8; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 12px; line-height: 1.5; color: #6C6A64;">
                    <strong style="color: #141413;">🔒 Privacy Guarantee:</strong> Your private mobile number and address are never revealed to bystanders. Emergency scans route securely through masked Cloudflare proxy alerts.
                  </td>
                </tr>
              </table>

              <!-- Security Warning -->
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #8E8B82;">
                If you did not initiate this account setup, please notify our security response team immediately at <a href="mailto:support@vaahansafe.com" style="color: #CC785C; text-decoration: none; font-weight: 500;">support@vaahansafe.com</a>.
              </p>
            </td>
          </tr>

          <!-- 03. Branded Regulatory Footer -->
          <tr>
            <td class="footer-padding" style="background-color: #FAF9F5; padding: 26px 36px; text-align: center; border-top: 1px solid #E6DFD8;">
              <p style="margin: 0 0 6px 0; font-family: 'Courier New', Courier, monospace; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: #8E8B82;">
                VaahanSafe Technologies &bull; Vehicle Safety Identity Platform
              </p>
              <p class="footer-text" style="margin: 0; font-size: 11px; line-height: 1.6; color: #8E8B82;">
                Cloudflare Global Edge Network &bull; India<br>
                <a href="https://vaahansafe.com/privacy" style="color: #6C6A64; text-decoration: none; margin: 0 6px;">Privacy Policy</a> &bull;
                <a href="https://vaahansafe.com/terms" style="color: #6C6A64; text-decoration: none; margin: 0 6px;">Terms of Service</a> &bull;
                <a href="https://vaahansafe.com/support" style="color: #6C6A64; text-decoration: none; margin: 0 6px;">Contact Support</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const service = getEmailService();
  return service.sendEmail({
    to,
    subject: "Welcome to VaahanSafe — Access Your Vehicle Identity",
    html,
  });
}

/**
 * 02. Emergency QR Scan Alert Email Template
 * Production-grade alert email dispatched during incident scans.
 */
export async function sendEmergencyAlertEmail(options: {
  to: string;
  vehiclePlate: string;
  scanTime: string;
  locationAddress?: string;
  message?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, vehiclePlate, scanTime, locationAddress, message } = options;

  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Emergency Scan Alert</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-card { width: 100% !important; border-radius: 12px !important; }
      .body-padding { padding: 24px 18px !important; }
      .plate-badge { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF9F5;">
    <tr>
      <td align="center" class="email-wrapper" style="padding: 40px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" style="max-width: 540px; background-color: #FFFFFF; border-radius: 16px; border: 2px solid #C64545; overflow: hidden; box-shadow: 0 6px 28px rgba(198, 69, 69, 0.08);">
          <!-- Emergency Banner -->
          <tr>
            <td style="background-color: #C64545; padding: 22px 30px; text-align: center; color: #FFFFFF;">
              <div style="font-family: 'Courier New', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase;">
                🚨 URGENT SAFETY SCAN ALERT
              </div>
              <div style="font-size: 20px; font-weight: 700; margin-top: 4px;">
                Vehicle QR Sticker Scanned
              </div>
            </td>
          </tr>

          <!-- Alert Details -->
          <tr>
            <td class="body-padding" style="padding: 32px 36px;">
              <!-- Vehicle Plate Badge -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; padding: 12px 28px; background-color: #FAF9F5; border: 2px dashed #C64545; border-radius: 12px;">
                  <span style="font-family: 'Courier New', monospace; font-size: 26px; font-weight: 800; letter-spacing: 0.12em; color: #141413;">
                    ${vehiclePlate}
                  </span>
                </div>
              </div>

              <p style="font-size: 15px; line-height: 1.6; color: #3D3D3A; margin: 0 0 20px 0;">
                A passerby or emergency responder has scanned the physical VaahanSafe QR code affixed to your vehicle.
              </p>

              <!-- Incident Coordinates -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF5F5; border-radius: 10px; border: 1px solid #FCD4D4; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; font-size: 13px; line-height: 1.7; color: #3D3D3A;">
                    <strong>Timestamp:</strong> ${scanTime}<br>
                    ${locationAddress ? `<strong>Approx. Location:</strong> ${locationAddress}<br>` : ""}
                    <strong>Notification Channel:</strong> Emergency Primary Dispatch
                  </td>
                </tr>
              </table>

              ${
                message
                  ? `
              <div style="background-color: #FAF9F5; border-left: 3px solid #CC785C; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <div style="font-family: monospace; font-size: 10px; text-transform: uppercase; color: #CC785C; font-weight: 700; margin-bottom: 4px;">Bystander Message</div>
                <div style="font-size: 14px; font-style: italic; color: #141413;">"${message}"</div>
              </div>`
                  : ""
              }

              <!-- View Log Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="https://app.vaahansafe.com/scan-history" target="_blank" style="display: block; width: 100%; box-sizing: border-box; background-color: #141413; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 24px; border-radius: 8px; text-align: center;">
                      View Security Incident in Customer App &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #8E8B82; text-align: center;">
                Automated alert dispatched by VaahanSafe Emergency Incident Engine.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const service = getEmailService();
  return service.sendEmail({
    to,
    subject: `🚨 [EMERGENCY] VaahanSafe Alert for Vehicle ${vehiclePlate}`,
    html,
  });
}

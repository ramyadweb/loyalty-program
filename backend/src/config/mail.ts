import "dotenv/config";
import nodemailer from "nodemailer";

// ============================================
// SMTP CONFIGURATION
// ============================================

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT) || 587;

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

const from =
  process.env.EMAIL_FROM || `"Loyalty Program" <${user || "no-reply@loyalty.com"}>`;

// Check whether SMTP credentials are available
export const isSmtpConfigured = Boolean(user && pass && !user.includes("yourgmail"));

// ============================================
// CREATE NODEMAILER TRANSPORTER
// ============================================

export const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })
  : null;

// ============================================
// SEND PASSWORD RESET EMAIL (LINK-BASED)
// ============================================

export const sendPasswordResetEmail = async (
  email: string,
  resetLink: string,
  userName?: string
): Promise<boolean> => {
  const greeting = userName ? `Hello ${userName},` : "Hello,";

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset Your Password - Loyalty Program</title>
      </head>
      <body style="margin: 0; padding: 30px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #111827 0%, #1e1b4b 50%, #312e81 100%); padding: 32px 30px; text-align: center;">
            <div style="display: inline-block; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 12px; padding: 10px 16px; margin-bottom: 12px;">
              <span style="color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: 1px;">LOYALTY<span style="color: #8b5cf6;">+</span></span>
            </div>
            <h1 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700;">Password Reset Request</h1>
            <p style="color: #c7d2fe; font-size: 13px; margin: 6px 0 0 0;">Secure link to regain account access</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px 30px;">
            <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0 0 16px 0;">${greeting}</p>
            
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
              We received a request to reset your password for your <strong>Loyalty Program</strong> account. Click the button below to choose a new password.
            </p>

            <!-- Call to action button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.35);">
                Reset Password
              </a>
            </div>

            <!-- Expiration Alert -->
            <div style="background-color: #f1f5f9; border-left: 4px solid #6366f1; border-radius: 8px; padding: 12px 16px; margin: 24px 0;">
              <p style="color: #334155; font-size: 12px; margin: 0; line-height: 1.5;">
                ⏱️ <strong>Time Sensitive:</strong> This reset link will expire in <strong>15 minutes</strong>. After that, you will need to request a new link.
              </p>
            </div>

            <!-- Direct link fallback -->
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 20px 0 8px 0;">
              If the button above does not work, copy and paste this link into your web browser:
            </p>
            <p style="word-break: break-all; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 11px; color: #6366f1; margin: 0 0 24px 0;">
              ${resetLink}
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

            <!-- Security Warning -->
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
              🛡️ <strong>Didn't request this change?</strong> You can safely ignore this email. Your password will not change unless you access the link above.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 30px; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
              © 2026 Loyalty Program Platform. All rights reserved.
            </p>
          </div>

        </div>
      </body>
    </html>
  `;

  // Always output the link in terminal for easy local testing & debugging
  console.log("==================================================");
  console.log("🔑 PASSWORD RESET LINK GENERATED");
  console.log("Recipient:", email);
  console.log("Link:", resetLink);
  console.log("==================================================");

  if (!transporter) {
    console.warn("[MAIL] SMTP is not configured in .env. Email link printed above.");
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: "Reset Your Password - Loyalty Program",
      html: emailHtml,
    });

    console.log("[MAIL] Password reset email dispatched successfully! ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("[MAIL] Failed to dispatch reset email through Gmail SMTP:", error);
    // Don't crash the request if SMTP fails, but log the error
    return false;
  }
};

// ============================================
// SEND OTP EMAIL (FOR 2FA & LEGACY OTP)
// ============================================

export const sendOtpEmail = async (
  email: string,
  otp: string
): Promise<boolean> => {
  console.log("-----------------------------------");
  console.log("OTP GENERATED FOR:", email);
  console.log("OTP Code:", otp);
  console.log("-----------------------------------");

  if (!transporter) {
    return true;
  }

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: "Your Verification Code - Loyalty Program",
      html: `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h2>Your Verification Code</h2>
          <p>Your one-time password code is:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4f46e5; margin: 15px 0;">
            ${otp}
          </div>
          <p>This code expires in 5 minutes.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("[MAIL] Failed to send OTP email:", error);
    return false;
  }
};

// ============================================
// VERIFY SMTP CONNECTION
// ============================================

export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    if (!transporter) {
      console.log("[MAIL] SMTP credentials not provided in .env.");
      return false;
    }
    await transporter.verify();
    console.log("[MAIL] Gmail SMTP connection verified successfully.");
    return true;
  } catch (error) {
    console.error("[MAIL] Gmail SMTP connection failed:", error);
    return false;
  }
};

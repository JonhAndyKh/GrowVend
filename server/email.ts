import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<boolean> {
  try {
    // If Resend API key is available, send real email
    if (resend && process.env.RESEND_API_KEY) {
      console.log("📧 Attempting to send via Resend...");
      const response = await resend.emails.send({
        from: "onboarding@resend.dev",
        to,
        subject: "Reset Your VendShop Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6;">Hello,</p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                We received a request to reset your VendShop password. Click the button below to set a new password. This link will expire in 1 hour.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link in your browser:
              </p>
              <p style="color: #667eea; font-size: 14px; word-break: break-all;">
                ${resetLink}
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email. Your account is secure.
              </p>
              <p style="color: #999; font-size: 12px; line-height: 1.6;">
                VendShop Support Team
              </p>
            </div>
          </div>
        `,
      });

      if (response.error) {
        console.error("❌ Resend email error:", response.error);
        // If Resend is in test mode, fall back to console logging
        if ((response.error as any).statusCode === 403) {
          console.log("⚠️  Resend in test mode - falling back to console logging");
          console.log("\n" + "=".repeat(80));
          console.log("📧 PASSWORD RESET EMAIL (RESEND TEST MODE)");
          console.log("=".repeat(80));
          console.log(`To: ${to}`);
          console.log(`Subject: Reset Your VendShop Password`);
          console.log(`\n🔗 Reset Link: ${resetLink}`);
          console.log("\n💡 Copy the reset link above and paste it in your browser to test password reset");
          console.log("ℹ️  Note: Resend is configured in test mode and can only send to daviranzy@gmail.com");
          console.log("=".repeat(80) + "\n");
          return true;
        }
        return false;
      }

      console.log(`✅ Password reset email sent via Resend to ${to}`);
      return true;
    }

    // Fallback to test mode if no API key
    console.log("\n" + "=".repeat(80));
    console.log("📧 PASSWORD RESET EMAIL (TEST MODE)");
    console.log("=".repeat(80));
    console.log(`To: ${to}`);
    console.log(`Subject: Reset Your VendShop Password`);
    console.log(`\n🔗 Reset Link: ${resetLink}`);
    console.log("\n💡 Copy the reset link above and paste it in your browser to test password reset");
    console.log("⚠️  To enable real email sending, set RESEND_API_KEY environment variable");
    console.log("=".repeat(80) + "\n");
    return true;
  } catch (error) {
    console.error("❌ Email function error:", error);
    return false;
  }
}

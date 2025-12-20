export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<boolean> {
  // TEST MODE: Log the reset link to console
  console.log("\n" + "=".repeat(80));
  console.log("📧 PASSWORD RESET EMAIL (TEST MODE)");
  console.log("=".repeat(80));
  console.log(`To: ${to}`);
  console.log(`Subject: Reset Your VendShop Password`);
  console.log(`\n🔗 Reset Link: ${resetLink}`);
  console.log("\n💡 Copy the reset link above and paste it in your browser to test password reset");
  console.log("=".repeat(80) + "\n");
  return true;
}

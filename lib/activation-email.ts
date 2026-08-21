import "server-only";
import nodemailer from "nodemailer";

const FROM_ADDRESS = "accounts@qasaskids.com";

function smtpSettings() {
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  if (!user || !password) throw new Error("SMTP credentials are not configured.");
  if (user.toLowerCase() !== FROM_ADDRESS) {
    throw new Error("SMTP_USER must be the accounts@qasaskids.com mailbox.");
  }

  return {
    host: process.env.SMTP_HOST?.trim() || "smtp.hostinger.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  };
}

export async function sendActivationCodeEmail(email: string, code: string) {
  const transporter = nodemailer.createTransport(smtpSettings());
  await transporter.sendMail({
    from: `Qasas Kids <${FROM_ADDRESS}>`,
    to: email,
    replyTo: FROM_ADDRESS,
    subject: "Your Qasas Kids activation code",
    text: [
      "Thank you for buying Qasas Kids in person.",
      "",
      `Your activation code is: ${code}`,
      "",
      "Go to https://qasaskids.com, create a parent account, and enter this code where it asks for your order number.",
      "",
      "This code can be used once and gives your family 12 months of companion access.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1a2a4a;line-height:1.6">
        <p>Thank you for buying Qasas Kids in person.</p>
        <p style="margin:28px 0 8px">Your activation code is:</p>
        <p style="font-size:30px;font-weight:700;letter-spacing:0.08em;color:#004aad;margin:0 0 28px">${code}</p>
        <p>Go to <a href="https://qasaskids.com">qasaskids.com</a>, create a parent account, and enter this code where it asks for your order number.</p>
        <p>This code can be used once and gives your family 12 months of companion access.</p>
      </div>
    `,
  });
}

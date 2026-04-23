import { Resend } from "resend";

// Lazy-load Resend instance to ensure env vars are loaded
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not defined in environment variables");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  username: string
) {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: email,
      subject: "Verify Your Email - Queztlearn",
      html: `
        <h2>Welcome to Queztlearn, ${username}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  username: string
) {
  const resetUrl = `${process.env.FRONTEND_URL}/set-password?token=${token}`;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || "gauharamir15@gmai;.com",
      to: email,
      subject: "Set Your Password - Queztlearn",
      html: `
        <h2>Hello ${username},</h2>
        <p>Click the link below to set your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Set Password
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
}

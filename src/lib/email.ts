// Email sender using Resend (https://resend.com)
// Free tier: 3,000 emails/month, 100/day — plenty for OTP + invoices
// No business approval needed (unlike WhatsApp)
//
// To enable: set RESEND_API_KEY env var
// Test mode: uses onboarding@resend.dev (no env needed for testing)
//
// All sent emails are logged to the EmailLog table (same shape as WhatsappLog)

import { Resend } from "resend";
import { db } from "./db";

let cachedClient: Resend | null = null;

function getClient(): Resend | null {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

export function isEmailConfigured(): boolean {
  return !!getClient();
}

// Default "from" address — Resend provides onboarding@resend.dev for testing
function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? "onboarding@resend.dev";
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  meta?: { userId?: string; purpose?: string };
}): Promise<{ ok: boolean; messageId?: string; error?: string; skipped?: boolean }> {
  const client = getClient();
  // Log the attempt (use WhatsappLog table for backwards compat — same shape)
  const logEntry = await db.whatsappLog.create({
    data: {
      userId: args.meta?.userId ?? null,
      toPhone: args.to, // column reused for email
      messageBody: args.text ?? args.html.slice(0, 1000),
      status: "PENDING",
      purpose: args.meta?.purpose ?? null,
    },
  });
  if (!client) {
    // Dev mode — skip send, mark as SKIPPED
    await db.whatsappLog.update({
      where: { id: logEntry.id },
      data: { status: "SKIPPED" },
    });
    console.log(`[Email] (skipped, no RESEND_API_KEY) To: ${args.to}, Subject: ${args.subject}`);
    return { ok: true, skipped: true };
  }
  try {
    const r = await client.emails.send({
      from: getFromAddress(),
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });
    if (r.error) {
      await db.whatsappLog.update({
        where: { id: logEntry.id },
        data: { status: "FAILED", error: JSON.stringify(r.error).slice(0, 500) },
      });
      return { ok: false, error: JSON.stringify(r.error) };
    }
    const messageId = r.data?.id;
    await db.whatsappLog.update({
      where: { id: logEntry.id },
      data: { status: "SENT", messageId: messageId ?? null },
    });
    return { ok: true, messageId: messageId ?? undefined };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Network error";
    await db.whatsappLog.update({
      where: { id: logEntry.id },
      data: { status: "FAILED", error: errMsg.slice(0, 500) },
    });
    return { ok: false, error: errMsg };
  }
}

// Send OTP via email (replaces sendOtpWhatsapp)
export async function sendOtpEmail(
  email: string,
  code: string,
  purpose: string,
  userName?: string,
  userId?: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Online Coaching — Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #6d28d9, #9333ea); color: white; border-radius: 8px; font-weight: bold; font-size: 14px;">🎓 Online Coaching</div>
    </div>
    <h1 style="color: #18181b; font-size: 22px; margin: 0 0 12px;">Your Verification Code</h1>
    <p style="color: #52525b; font-size: 14px; line-height: 1.6;">Hi ${userName ?? "Student"},</p>
    <p style="color: #52525b; font-size: 14px; line-height: 1.6;">
      Use the code below to verify your ${purpose.toLowerCase()}.
    </p>
    <div style="margin: 24px 0; padding: 16px; background: #f4f4f5; border-radius: 8px; text-align: center;">
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #6d28d9; font-family: 'SF Mono', 'Monaco', monospace;">${code}</div>
    </div>
    <p style="color: #71717a; font-size: 12px; line-height: 1.6;">
      <strong>Validity:</strong> 5 minutes<br/>
      <strong>Purpose:</strong> ${purpose}<br/><br/>
      🔒 Do NOT share this code with anyone. We will never ask for it.
    </p>
    <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;">
    <p style="color: #a1a1aa; font-size: 11px; line-height: 1.5; text-align: center;">
      Online Coaching Platform • support@onlinecoaching.app<br/>
      This is an automated email — please do not reply.
    </p>
  </div>
</body>
</html>`;
  const text = `Your Online Coaching verification code is: ${code}

Purpose: ${purpose}
Validity: 5 minutes

Do NOT share this code with anyone. We will never ask for it.`;
  const r = await sendEmail({
    to: email,
    subject: `🔐 Your verification code: ${code}`,
    html,
    text,
    meta: { userId, purpose: "OTP" },
  });
  return r.ok;
}

// Send invoice via email (replaces sendInvoiceWhatsapp)
export async function sendInvoiceEmail(
  email: string,
  invoice: {
    number: string;
    courseTitle: string;
    amount: number;
    studentName: string;
    date: string;
  },
  userId?: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.number}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #6d28d9, #9333ea); color: white; border-radius: 8px; font-weight: bold; font-size: 14px;">🎓 Online Coaching</div>
    </div>
    <h1 style="color: #18181b; font-size: 22px; margin: 0 0 4px;">🧾 Invoice ${invoice.number}</h1>
    <p style="color: #52525b; font-size: 13px; margin: 0 0 24px;">Payment received successfully</p>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Course</td>
        <td style="padding: 8px 0; color: #18181b; font-size: 13px; font-weight: 600; text-align: right;">${invoice.courseTitle}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Student</td>
        <td style="padding: 8px 0; color: #18181b; font-size: 13px; font-weight: 600; text-align: right;">${invoice.studentName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #71717a; font-size: 13px;">Date</td>
        <td style="padding: 8px 0; color: #18181b; font-size: 13px; text-align: right;">${new Date(invoice.date).toLocaleString()}</td>
      </tr>
      <tr style="border-top: 2px solid #e4e4e7;">
        <td style="padding: 16px 0; color: #18181b; font-size: 16px; font-weight: bold;">Total</td>
        <td style="padding: 16px 0; color: #6d28d9; font-size: 22px; font-weight: bold; text-align: right;">₹${invoice.amount.toLocaleString()}</td>
      </tr>
    </table>
    <div style="padding: 16px; background: #dcfce7; border-radius: 8px; text-align: center; margin-bottom: 24px;">
      <div style="color: #166534; font-weight: bold; font-size: 14px;">✅ Payment Successful</div>
      <div style="color: #15803d; font-size: 12px; margin-top: 4px;">Your enrollment is now active</div>
    </div>
    <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;">
    <p style="color: #a1a1aa; font-size: 11px; line-height: 1.5; text-align: center;">
      Thank you for choosing Online Coaching!<br/>
      support@onlinecoaching.app
    </p>
  </div>
</body>
</html>`;
  const text = `INVOICE ${invoice.number}

Course: ${invoice.courseTitle}
Student: ${invoice.studentName}
Amount: Rs ${invoice.amount.toLocaleString()}
Date: ${invoice.date}

Payment received successfully. Your enrollment is now active.

Thank you for choosing Online Coaching!`;
  const r = await sendEmail({
    to: email,
    subject: `🧾 Invoice ${invoice.number} — ₹${invoice.amount.toLocaleString()}`,
    html,
    text,
    meta: { userId, purpose: "INVOICE" },
  });
  return r.ok;
}

// Retry failed email sends (called by cron)
export async function retryFailedEmails(limit = 50): Promise<{ retried: number }> {
  const failed = await db.whatsappLog.findMany({
    where: { status: "FAILED" },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  let retried = 0;
  const client = getClient();
  if (!client) return { retried: 0 };
  for (const log of failed) {
    try {
      const r = await client.emails.send({
        from: getFromAddress(),
        to: log.toPhone, // column reused for email
        subject: "Online Coaching Notification (retry)",
        text: log.messageBody,
      });
      if (r.data?.id) {
        await db.whatsappLog.update({
          where: { id: log.id },
          data: { status: "SENT", messageId: r.data.id, error: null },
        });
        retried++;
      }
    } catch {
      // keep as FAILED
    }
  }
  return { retried };
}

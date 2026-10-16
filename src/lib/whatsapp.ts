// WhatsApp Business API client
// Sends OTP + invoice notifications via WhatsApp to the student's phone
//
// To enable: set WHATSAPP_API_URL, WHATSAPP_TOKEN in .env
// Without these env vars, the functions are no-ops (return ok=true) so the
// flow doesn't break in dev mode.
//
// All sent messages are logged to the WhatsappLog table for audit + retry.

import { db } from "./db";

const DEFAULT_TEMPLATE = "payment_otp";

export async function sendWhatsappMessage(
  toPhone: string,
  message: string,
  meta?: { userId?: string; purpose?: string }
): Promise<{
  ok: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
}> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_TOKEN;
  const phone = sanitizePhone(toPhone);
  // Log the attempt
  const logEntry = await db.whatsappLog.create({
    data: {
      userId: meta?.userId ?? null,
      toPhone: phone,
      messageBody: message.slice(0, 1000),
      status: "PENDING",
      purpose: meta?.purpose ?? null,
    },
  });
  if (!apiUrl || !token) {
    // Dev mode — skip send, mark as SKIPPED
    await db.whatsappLog.update({
      where: { id: logEntry.id },
      data: { status: "SKIPPED" },
    });
    console.log(`[WhatsApp] (skipped, no env) To: ${phone}, Msg: ${message.slice(0, 80)}...`);
    return { ok: true, skipped: true };
  }
  try {
    const body = {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message },
    };
    const r = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) {
      await db.whatsappLog.update({
        where: { id: logEntry.id },
        data: { status: "FAILED", error: JSON.stringify(data).slice(0, 500) },
      });
      return { ok: false, error: JSON.stringify(data) };
    }
    const messageId = data?.messages?.[0]?.id;
    await db.whatsappLog.update({
      where: { id: logEntry.id },
      data: { status: "SENT", messageId: messageId ?? null },
    });
    return { ok: true, messageId };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Network error";
    await db.whatsappLog.update({
      where: { id: logEntry.id },
      data: { status: "FAILED", error: errMsg.slice(0, 500) },
    });
    return { ok: false, error: errMsg };
  }
}

// Send OTP via WhatsApp (or just log in dev)
export async function sendOtpWhatsapp(
  phone: string,
  code: string,
  purpose: string,
  userId?: string
): Promise<boolean> {
  const message = `🔐 Your Online Coaching verification code is: ${code}

Purpose: ${purpose}
Validity: 5 minutes

Do NOT share this code with anyone. We will never ask for it.`;
  const r = await sendWhatsappMessage(phone, message, { userId, purpose: "OTP" });
  return r.ok;
}

// Send invoice via WhatsApp
export async function sendInvoiceWhatsapp(
  phone: string,
  invoice: {
    number: string;
    courseTitle: string;
    amount: number;
    studentName: string;
    date: string;
  },
  userId?: string
): Promise<boolean> {
  const message = `🧾 INVOICE ${invoice.number}

Course: ${invoice.courseTitle}
Student: ${invoice.studentName}
Amount: ₹${invoice.amount.toLocaleString()}
Date: ${invoice.date}

Payment received successfully. Your enrollment is now active.

Thank you for choosing Online Coaching!`;
  const r = await sendWhatsappMessage(phone, message, { userId, purpose: "INVOICE" });
  return r.ok;
}

function sanitizePhone(phone: string): string {
  let p = phone.replace(/[^\d]/g, "");
  if (p.startsWith("91") && p.length === 12) return p;
  if (p.length === 10) return `91${p}`;
  return p;
}

// Retry failed WhatsApp messages (called by cron)
export async function retryFailedWhatsapp(limit = 50): Promise<{ retried: number }> {
  const failed = await db.whatsappLog.findMany({
    where: { status: "FAILED" },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  let retried = 0;
  for (const log of failed) {
    // Re-attempt only if WhatsApp env is configured
    const apiUrl = process.env.WHATSAPP_API_URL;
    const token = process.env.WHATSAPP_TOKEN;
    if (!apiUrl || !token) break;
    try {
      const body = {
        messaging_product: "whatsapp",
        to: log.toPhone,
        type: "text",
        text: { body: log.messageBody },
      };
      const r = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (r.ok && data?.messages?.[0]?.id) {
        await db.whatsappLog.update({
          where: { id: log.id },
          data: { status: "SENT", messageId: data.messages[0].id, error: null },
        });
        retried++;
      }
    } catch {
      // keep as FAILED
    }
  }
  return { retried };
}

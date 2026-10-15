// WhatsApp Business API client
// Sends OTP + invoice notifications via WhatsApp to the student's phone
//
// To enable: set WHATSAPP_API_URL, WHATSAPP_TOKEN, WHATSAPP_TEMPLATE_NAME in .env
// Without these env vars, the functions are no-ops (return ok=true) so the
// flow doesn't break in dev mode.

const DEFAULT_TEMPLATE = "payment_otp"; // WhatsApp template name (must be pre-approved in Meta Business)

export async function sendWhatsappMessage(toPhone: string, message: string): Promise<{
  ok: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
}> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_TOKEN;
  if (!apiUrl || !token) {
    // Dev mode — don't actually send, just log
    console.log(`[WhatsApp] (skipped, no env) To: ${toPhone}, Msg: ${message.slice(0, 80)}...`);
    return { ok: true, skipped: true };
  }
  try {
    const phone = sanitizePhone(toPhone);
    const body = {
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: message },
    };
    const r = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) {
      return { ok: false, error: JSON.stringify(data) };
    }
    return { ok: true, messageId: data?.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

// Send OTP via WhatsApp (or just log in dev)
export async function sendOtpWhatsapp(phone: string, code: string, purpose: string): Promise<boolean> {
  const message = `🔐 Your Online Coaching verification code is: ${code}

Purpose: ${purpose}
Validity: 5 minutes

Do NOT share this code with anyone. We will never ask for it.`;
  const r = await sendWhatsappMessage(phone, message);
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
  }
): Promise<boolean> {
  const message = `🧾 INVOICE ${invoice.number}

Course: ${invoice.courseTitle}
Student: ${invoice.studentName}
Amount: ₹${invoice.amount.toLocaleString()}
Date: ${invoice.date}

Payment received successfully. Your enrollment is now active.

Thank you for choosing Online Coaching!`;
  const r = await sendWhatsappMessage(phone, message);
  return r.ok;
}

function sanitizePhone(phone: string): string {
  // Remove spaces, dashes, +; ensure leading country code
  let p = phone.replace(/[^\d]/g, "");
  if (p.startsWith("91") && p.length === 12) return p;
  if (p.length === 10) return `91${p}`; // assume India
  return p;
}

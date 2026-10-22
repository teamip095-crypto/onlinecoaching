// DEPRECATED — this module is kept for backward-compat with old imports.
// The app now uses email.ts (Resend) for OTP + invoice delivery.
// All functions are no-ops and log a warning.

export async function sendOtpWhatsapp(phone: string, code: string, purpose: string): Promise<boolean> {
  console.warn("[DEPRECATED] sendOtpWhatsapp called — use sendOtpEmail from email.ts instead");
  return false;
}

export async function sendInvoiceWhatsapp(
  phone: string,
  invoice: { number: string; courseTitle: string; amount: number; studentName: string; date: string }
): Promise<boolean> {
  console.warn("[DEPRECATED] sendInvoiceWhatsapp called — use sendInvoiceEmail from email.ts instead");
  return false;
}

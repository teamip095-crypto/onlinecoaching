// Invoice number generator + PDF text generation
// In production: replace generateInvoiceText with a real PDF library call (e.g. @react-pdf/renderer)
// For now: produces a structured invoice text that can be sent via WhatsApp

import crypto from "crypto";

export type Invoice = {
  number: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseTitle: string;
  courseId: string;
  amountPaise: number;
  amountRupees: number;
  currency: string;
  date: string;
  transactionId: string;
  upiId: string;
  paymentMethod: string;
};

export function generateInvoiceNumber(): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = crypto.randomInt(1000, 9999);
  return `INV-${y}${m}${day}-${rand}`;
}

export function buildInvoice(args: {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseTitle: string;
  courseId: string;
  amountPaise: number;
  transactionId: string;
  upiId: string;
}): Invoice {
  return {
    number: generateInvoiceNumber(),
    ...args,
    amountRupees: args.amountPaise / 100,
    currency: "INR",
    date: new Date().toISOString(),
    transactionId: args.transactionId,
    paymentMethod: "UPI",
  };
}

export function invoiceToText(inv: Invoice): string {
  return [
    "═══════════════════════════════",
    "      ONLINE COACHING",
    "      TAX INVOICE",
    "═══════════════════════════════",
    "",
    `Invoice No: ${inv.number}`,
    `Date: ${new Date(inv.date).toLocaleString()}`,
    `Transaction ID: ${inv.transactionId}`,
    `Payment Method: ${inv.paymentMethod} (${inv.upiId})`,
    "",
    "── Billed To ──",
    `Name: ${inv.studentName}`,
    `Email: ${inv.studentEmail}`,
    `Phone: ${inv.studentPhone}`,
    "",
    "── Course Details ──",
    `Course: ${inv.courseTitle}`,
    `Course ID: ${inv.courseId}`,
    "",
    "── Amount ──",
    `Subtotal: ₹${inv.amountRupees.toFixed(2)} ${inv.currency}`,
    `Tax (GST 0%): ₹0.00`,
    `Total: ₹${inv.amountRupees.toFixed(2)} ${inv.currency}`,
    "",
    "═══════════════════════════════",
    "Payment Status: ✅ PAID",
    "═══════════════════════════════",
    "",
    "Thank you for your purchase!",
    "This is a system-generated invoice.",
    "For support: support@onlinecoaching.app",
  ].join("\n");
}

// Razorpay integration — conditional
// If RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET env vars are set, uses real Razorpay API
// Otherwise falls back to demo mode (no real money, signed tokens)

import crypto from "crypto";
import Razorpay from "razorpay";

let cachedClient: Razorpay | null = null;
let useReal = false;

function getRazorpay(): Razorpay | null {
  if (cachedClient) return cachedClient;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    useReal = false;
    return null;
  }
  cachedClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  useReal = true;
  return cachedClient;
}

export function isRazorpayConfigured(): boolean {
  return !!getRazorpay();
}

// Create a Razorpay order (or generate a demo order ID if not configured)
export async function createOrder(args: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{
  providerOrderId: string;
  amountPaise: number;
  currency: string;
  receipt: string;
  real: boolean;
}> {
  const client = getRazorpay();
  if (!client) {
    // Demo mode — generate a fake order ID
    return {
      providerOrderId: `order_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amountPaise: args.amountPaise,
      currency: "INR",
      receipt: args.receipt,
      real: false,
    };
  }
  // Real Razorpay API call
  const order = await client.orders.create({
    amount: args.amountPaise,
    currency: "INR",
    receipt: args.receipt,
    notes: args.notes ?? {},
  });
  return {
    providerOrderId: order.id,
    amountPaise: Number(order.amount),
    currency: order.currency ?? "INR",
    receipt: order.receipt ?? args.receipt,
    real: true,
  };
}

// Verify Razorpay payment signature
export function verifyPaymentSignature(args: {
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
}): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    // Demo mode — accept "demo_signature"
    return args.providerSignature === "demo_signature";
  }
  // Real Razorpay signature verification
  // HMAC-SHA256 of (providerOrderId|providerPaymentId) using key_secret
  const expectedSig = crypto
    .createHmac("sha256", keySecret)
    .update(`${args.providerOrderId}|${args.providerPaymentId}`)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(args.providerSignature)
  );
}

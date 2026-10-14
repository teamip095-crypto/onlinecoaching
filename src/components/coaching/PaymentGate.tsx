"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Lock,
  ShieldCheck,
  CreditCard,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  price: number; // paise
  onSuccess?: () => void;
};

export function PaymentGate({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  price,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<"details" | "processing" | "success" | "failed">("details");
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setStep("processing");
    setError(null);
    try {
      // Step 1: create order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
        credentials: "include",
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error ?? "Failed to create order");

      // Step 2: simulate provider payment (no real money)
      // In production: open Razorpay checkout here with order.providerOrderId
      // For demo, we just sleep 1.5s to simulate user completing payment
      await new Promise((r) => setTimeout(r, 1500));

      // Step 3: verify payment (server-side signature check)
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: order.paymentId,
          providerPaymentId: `pay_demo_${Date.now()}`,
          providerSignature: "demo_signature",
        }),
        credentials: "include",
      });
      const verify = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verify.error ?? "Verification failed");

      setStep("success");
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setStep("details");
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
      setStep("failed");
    }
  };

  const close = () => {
    onOpenChange(false);
    setStep("details");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); else onOpenChange(o); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 bg-coaching-gradient-soft border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" />
            Unlock Course
          </DialogTitle>
          <DialogDescription className="text-xs">
            Secure payment • Encrypted • Server-verified
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Course summary */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground">Enrolling in</p>
            <p className="font-semibold text-sm mt-0.5">{courseTitle}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">Total payable</span>
              <span className="text-lg font-bold tabular-nums">
                ₹{(price / 100).toLocaleString()}
              </span>
            </div>
          </div>

          {step === "details" && (
            <>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  This will unlock:
                </p>
                <ul className="text-xs space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    All live & recorded lectures
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    Complete study material (PDFs, videos, DPPs)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    Full test series with solutions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    Doubt solving with faculty (24h response)
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <p className="text-[10px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <ShieldCheck className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>
                    All content is encrypted, watermarked with your name &
                    roll no, and download-disabled. Sharing or piracy will
                    be traced back to your account.
                  </span>
                </p>
              </div>

              <Button
                onClick={pay}
                className="w-full h-10 bg-coaching-gradient text-white hover:opacity-90"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay ₹{(price / 100).toLocaleString()} & Unlock
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                💳 Demo payment gateway — no real money charged
              </p>
            </>
          )}

          {step === "processing" && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-medium mt-3">Processing payment...</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Verifying signature on server
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-bold mt-3">Payment Successful!</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Enrollment activated. You can now access all content.
              </p>
            </div>
          )}

          {step === "failed" && (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <p className="text-sm font-bold mt-3">Payment Failed</p>
              <p className="text-[10px] text-muted-foreground mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setStep("details")}
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

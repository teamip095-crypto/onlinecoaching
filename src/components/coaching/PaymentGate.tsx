"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  Smartphone,
} from "lucide-react";
import QRCode from "qrcode";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  price: number; // paise
  onSuccess?: () => void;
};

type Step = "details" | "qr" | "verify" | "processing" | "success" | "failed";

export function PaymentGate({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  price,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("details");
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState<"upi" | "number" | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("details");
      setOrder(null);
      setQrUrl("");
      setUtr("");
      setError(null);
    }
  }, [open]);

  // Generate QR code when order is created
  useEffect(() => {
    if (order?.upiDeepLink && !qrUrl) {
      QRCode.toDataURL(order.upiDeepLink, {
        width: 240,
        margin: 1,
        color: { dark: "#1f2937", light: "#ffffff" },
      }).then(setQrUrl).catch(() => {});
    }
  }, [order, qrUrl]);

  const createOrder = async () => {
    setStep("processing");
    setError(null);
    try {
      const r = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
        credentials: "include",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      setOrder(data);
      setStep("qr");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setStep("failed");
    }
  };

  const verifyPayment = async () => {
    if (!order || !utr || utr.length < 6) {
      setError("Please enter the UTR (at least 6 chars)");
      return;
    }
    setStep("processing");
    setError(null);
    try {
      const r = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: order.paymentId, utr }),
        credentials: "include",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Verification failed");
      setStep("success");
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setStep("failed");
    }
  };

  const close = () => {
    onOpenChange(false);
    setStep("details");
    setOrder(null);
    setQrUrl("");
    setUtr("");
    setError(null);
  };

  const copy = (text: string, which: "upi" | "number") => {
    navigator.clipboard?.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
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
            UPI QR Payment • No gateway • Direct to coaching
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Step: details */}
          {step === "details" && (
            <>
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
              <ul className="text-xs space-y-1.5">
                {[
                  "All live & recorded lectures",
                  "Complete study material (PDFs, videos, DPPs)",
                  "Full test series with solutions",
                  "Doubt solving with faculty",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <p className="text-[10px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <ShieldCheck className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>
                    All content is encrypted + watermarked with your email + IP.
                    Sharing or piracy will be traced.
                  </span>
                </p>
              </div>
              <Button
                onClick={createOrder}
                className="w-full h-10 bg-coaching-gradient text-white hover:opacity-90"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Show UPI QR — ₹{(price / 100).toLocaleString()}
              </Button>
            </>
          )}

          {/* Step: QR — scan + enter UTR */}
          {step === "qr" && order && (
            <>
              <div className="text-center">
                <div className="inline-block p-3 bg-white rounded-xl border-2 border-border">
                  {qrUrl ? (
                    <img src={qrUrl} alt="UPI QR" className="w-56 h-56" />
                  ) : (
                    <Loader2 className="h-12 w-12 animate-spin" />
                  )}
                </div>
                <p className="text-2xl font-bold mt-3">
                  ₹{(order.amountRupees ?? order.amount / 100).toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">{order.notes}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div>
                    <p className="text-[10px] text-muted-foreground">UPI ID</p>
                    <p className="text-xs font-mono">{order.upiId}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                    onClick={() => copy(order.upiId, "upi")}>
                    {copied === "upi" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div>
                    <p className="text-[10px] text-muted-foreground">UPI Number</p>
                    <p className="text-xs font-mono">{order.upiNumber}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                    onClick={() => copy(order.upiNumber, "number")}>
                    {copied === "number" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="utr" className="text-xs flex items-center gap-1.5">
                  <Smartphone className="h-3 w-3" />
                  UTR / Transaction ID (from UPI app receipt)
                </Label>
                <Input
                  id="utr"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="e.g. 4567123456789"
                  className="h-10 font-mono"
                />
                <p className="text-[10px] text-muted-foreground">
                  After paying via UPI, find the UTR in your UPI app payment receipt.
                  Enter it here to verify + activate enrollment.
                </p>
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("details")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={verifyPayment}
                  disabled={!utr || utr.length < 6}
                  className="flex-1 bg-coaching-gradient text-white"
                >
                  I've Paid — Verify
                </Button>
              </div>
            </>
          )}

          {step === "processing" && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-medium mt-3">Processing...</p>
              <p className="text-[10px] text-muted-foreground mt-1">Verifying UTR + signature</p>
            </div>
          )}

          {step === "success" && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-bold mt-3">Payment Successful! 🎉</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Invoice + OTP sent to your email. Verify OTP to complete enrollment.
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
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setStep("qr")}>
                Try again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

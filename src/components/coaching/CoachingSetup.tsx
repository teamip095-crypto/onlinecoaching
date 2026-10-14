"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle2,
  Building2,
  Palette,
  Crown,
  QrCode,
  Copy,
  Check,
  Smartphone,
} from "lucide-react";

const PLANS = [
  {
    id: "TRIAL",
    name: "Trial",
    price: 0,
    period: "14 days",
    color: "bg-slate-100 dark:bg-slate-800",
    students: 25,
    faculty: 2,
    features: ["25 students max", "2 faculty", "Watermarked content", "Basic DRM"],
  },
  {
    id: "STARTER",
    name: "Starter",
    price: 999,
    period: "/year",
    color: "bg-emerald-100 dark:bg-emerald-950/40",
    students: 100,
    faculty: 5,
    features: ["100 students", "5 faculty", "Custom branding", "All DRM features", "Email support"],
    popular: true,
  },
  {
    id: "PRO",
    name: "Pro",
    price: 2999,
    period: "/year",
    color: "bg-violet-100 dark:bg-violet-950/40",
    students: 500,
    faculty: 20,
    features: ["500 students", "20 faculty", "White-label app", "Priority support", "Custom domain", "Analytics"],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 9999,
    period: "/year",
    color: "bg-amber-100 dark:bg-amber-950/40",
    students: 5000,
    faculty: 100,
    features: ["5000 students", "100 faculty", "Dedicated server", "24/7 support", "Custom integrations", "SLA"],
  },
];

const COLORS = ["#6d28d9", "#dc2626", "#059669", "#d97706", "#2563eb", "#db2777"];

type Step = "details" | "plan" | "payment" | "done";

export function CoachingSetup({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [plan, setPlan] = useState("STARTER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<{
    coachingId: string;
    amountRupees: number;
    upiId: string;
    upiNumber: string;
    qrData: string;
    note: string;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [txnId, setTxnId] = useState("");
  const [copied, setCopied] = useState<"upi" | "number" | null>(null);

  const submitDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/coaching/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, tagline, primaryColor: color, plan }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Setup failed");
      if (data.isActive) {
        // Trial — no payment needed
        setStep("done");
      } else {
        setPayment({
          coachingId: data.coachingId,
          amountRupees: data.amountRupees,
          upiId: data.upiId,
          upiNumber: data.upiNumber,
          qrData: data.qrData,
          note: data.note,
        });
        // Generate QR code
        const url = await QRCode.toDataURL(data.qrData, {
          width: 280,
          margin: 1,
          color: { dark: "#1f2937", light: "#ffffff" },
        });
        setQrDataUrl(url);
        setStep("payment");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/coaching/pay-platform-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          coachingId: payment?.coachingId,
          transactionId: txnId,
          amountPaise: payment ? payment.amountRupees * 100 : 0,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Verification failed");
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, which: "upi" | "number") => {
    navigator.clipboard?.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-coaching-gradient flex items-center justify-center mb-3">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Start Your Coaching</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up your coaching institute in 3 easy steps
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-6">
          {["details", "plan", "payment", "done"].map((s, i) => {
            const stepIdx = ["details", "plan", "payment", "done"].indexOf(step);
            const done = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={s} className="flex items-center">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                        ? "bg-coaching-gradient text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                {i < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-0.5 ${
                      done ? "bg-emerald-500" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Details */}
        {step === "details" && (
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-base">Coaching Details</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your institute's name and branding
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cn" className="text-xs">Coaching Name *</Label>
              <Input
                id="cn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sharma Physics Classes"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct" className="text-xs">Tagline (optional)</Label>
              <Input
                id="ct"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Quality education since 2010"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Palette className="h-3 w-3" />
                Primary Color
              </Label>
              <div className="flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full border-2 ${
                      color === c ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <Button
              disabled={loading || name.length < 3}
              onClick={() => setStep("plan")}
              className="w-full bg-coaching-gradient text-white"
            >
              Continue
            </Button>
          </Card>
        )}

        {/* Step 2: Plan */}
        {step === "plan" && (
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-base flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Choose Your Plan
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pay platform fee to activate your coaching
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                    plan === p.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  {p.popular && (
                    <Badge className="absolute -top-2 left-3 bg-primary text-primary-foreground hover:bg-primary text-[9px]">
                      POPULAR
                    </Badge>
                  )}
                  <p className="font-bold text-sm">{p.name}</p>
                  <p className="text-2xl font-bold mt-1">
                    ₹{p.price}
                    <span className="text-xs font-normal text-muted-foreground">
                      {p.period}
                    </span>
                  </p>
                  <ul className="text-[10px] text-muted-foreground mt-2 space-y-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-1">
                        <Check className="h-2.5 w-2.5 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("details")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                disabled={loading}
                onClick={submitDetails}
                className="flex-1 bg-coaching-gradient text-white"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {plan === "TRIAL" ? "Start Free Trial" : "Proceed to Payment"}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Payment */}
        {step === "payment" && payment && (
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-base flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                Pay Platform Fee
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Scan QR with any UPI app (GPay, PhonePe, Paytm, BHIM, etc.)
              </p>
            </div>
            <div className="text-center">
              <div className="inline-block p-3 bg-white rounded-xl border-2 border-border">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="UPI QR"
                    className="w-64 h-64"
                  />
                ) : (
                  <Loader2 className="h-12 w-12 animate-spin" />
                )}
              </div>
              <p className="text-3xl font-bold mt-3">
                ₹{payment.amountRupees.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{payment.note}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div>
                  <p className="text-[10px] text-muted-foreground">UPI ID</p>
                  <p className="text-xs font-mono">{payment.upiId}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => copy(payment.upiId, "upi")}
                >
                  {copied === "upi" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div>
                  <p className="text-[10px] text-muted-foreground">UPI Number</p>
                  <p className="text-xs font-mono">{payment.upiNumber}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => copy(payment.upiNumber, "number")}
                >
                  {copied === "number" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="txn" className="text-xs flex items-center gap-1.5">
                <Smartphone className="h-3 w-3" />
                UPI Transaction Reference (UTR / Txn ID)
              </Label>
              <Input
                id="txn"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="e.g. 4567123456789"
                className="h-10 font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                After paying via UPI, find the transaction ID in your UPI app's
                payment receipt. Enter it here to activate your coaching.
              </p>
            </div>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("plan")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                disabled={loading || !txnId}
                onClick={verifyPayment}
                className="flex-1 bg-coaching-gradient text-white"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                I've Paid — Activate
              </Button>
            </div>
          </Card>
        )}

        {/* Step 4: Done */}
        {step === "done" && (
          <Card className="p-8 text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="font-bold text-lg mt-3">Coaching Activated! 🎉</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your coaching institute is now live. Start creating courses,
              uploading videos & study material, and enrolling students.
            </p>
            <Button
              onClick={onComplete}
              className="mt-4 w-full bg-coaching-gradient text-white"
            >
              Go to Faculty Dashboard
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

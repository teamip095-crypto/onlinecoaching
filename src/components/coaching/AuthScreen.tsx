"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Mail, Phone, User, Lock, Loader2, ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";

type Mode = "login" | "signup";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rollNo, setRollNo] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const r = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name, phone, rollNo }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Signup failed");
        // Switch to login mode after successful signup
        setMode("login");
        setError("Account created! Please login.");
        return;
      }
      // Login via NextAuth credentials
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!res || res.error) {
        throw new Error(res?.error ?? "Login failed");
      }
      // Reload page to refresh session
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-coaching-gradient flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Online Coaching</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Smart Learning Platform</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Secured
          </Badge>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-6">
            <div className="text-center mb-5">
              <div className="h-12 w-12 mx-auto rounded-xl bg-coaching-gradient flex items-center justify-center mb-3">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-xl font-bold">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {mode === "login"
                  ? "Login to access your batches, lectures, tests & doubts"
                  : "Join thousands of students preparing for JEE, NEET & Boards"}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Aarav Sharma"
                        className="pl-9 h-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs">Phone (10 digit)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="9000000000"
                          className="pl-9 h-10"
                          inputMode="numeric"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="rollNo" className="text-xs">Roll No. (optional)</Label>
                      <Input
                        id="rollNo"
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        placeholder="JEE26-1247"
                        className="h-10"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-9 h-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 h-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className={`p-2 rounded-md text-xs ${
                  error.includes("created") || error.includes("Please login")
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300"
                }`}>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-coaching-gradient text-white hover:opacity-90"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {mode === "login" ? "Login Securely" : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError(null);
                }}
                className="text-xs text-primary hover:underline"
              >
                {mode === "login"
                  ? "New student? Create an account →"
                  : "← Already have an account? Login"}
              </button>
            </div>

            {/* Demo credentials helper */}
            <div className="mt-4 p-3 rounded-md bg-muted/60 border border-border text-[10px] text-muted-foreground">
              <p className="font-semibold mb-1">Demo logins (try it):</p>
              <p>• <b>Aarav (paid student)</b> — aarav@student.com / student123</p>
              <p>• <b>New student (unpaid)</b> — free@student.com / student123</p>
              <p>• <b>Faculty</b> — aman.faculty@coaching.in / faculty123</p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

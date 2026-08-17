"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, authenticated, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (ready && authenticated) router.replace("/dashboard");
  }, [authenticated, ready, router]);

  function validate() {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Enter a valid email.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAuthError("");
    if (!validate()) return;
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (!ok) {
      setAuthError("Those credentials do not match an active studio account.");
      return;
    }
    toast.success("Welcome back to Duneworks.");
    setExiting(true);
    window.setTimeout(() => router.push("/dashboard"), 420);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[oklch(0.12_0.02_255)] px-4 py-10 text-[oklch(0.94_0.02_90)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.04_80_/_0.28),_transparent_52%),radial-gradient(ellipse_at_bottom,_oklch(0.2_0.03_255_/_0.55),_transparent_48%)]" />
      <AnimatePresence>
        {!exiting && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{
              opacity: 1,
              y: 0,
              x: authError ? [0, -8, 8, -5, 5, 0] : 0,
            }}
            exit={{ opacity: 0, scale: 0.98, y: -12 }}
            transition={{ duration: authError ? 0.4 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md"
          >
            <div className="rounded-3xl border border-white/8 bg-[oklch(0.16_0.02_255_/_0.88)] p-8 shadow-[0_40px_80px_-40px_rgb(0_0_0_/_70%)] backdrop-blur-xl sm:p-10">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full border border-[oklch(0.78_0.09_88_/_0.35)] bg-[oklch(0.78_0.09_88_/_0.1)]">
                  <LogoMark className="size-6" />
                </div>
                <div>
                  <p className="font-heading text-2xl leading-none">Duneworks</p>
                  <p className="mt-1 text-[10px] tracking-[0.24em] text-white/50 uppercase">
                    Productions
                  </p>
                </div>
              </div>
              <p className="font-heading text-4xl">Sign in</p>
              <p className="mt-2 text-sm text-white/55">
                Studio access for pipeline, productions, and finance.
              </p>
              <form className="mt-8 space-y-4" onSubmit={onSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    className="h-10 border-white/10 bg-black/20"
                  />
                  {errors.email ? (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={Boolean(errors.password)}
                      className="h-10 border-white/10 bg-black/20 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 right-2 -translate-y-1/2 text-white/50"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  ) : null}
                </div>
                <AnimatePresence>
                  {authError ? (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    >
                      {authError}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
                <Button type="submit" className="h-10 w-full" disabled={submitting || !ready}>
                  {submitting ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

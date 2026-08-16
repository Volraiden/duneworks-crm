"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { BetaBadge } from "@/components/beta-badge";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, authenticated, ready, needsSetup } = useAuth();
  const [name, setName] = useState("");
  const [studioName, setStudioName] = useState("Duneworks Productions");
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
    if (needsSetup && !name.trim()) next.name = "Your name is required.";
    if (needsSetup && !studioName.trim()) next.studioName = "Studio name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Enter a valid email.";
    if (!password) next.password = "Password is required.";
    else if (needsSetup && password.length < 8)
      next.password = "Use at least 8 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setAuthError("");
    if (!validate()) return;
    setSubmitting(true);

    if (needsSetup) {
      const result = await register({
        name,
        email,
        password,
        studioName,
      });
      setSubmitting(false);
      if (!result.ok) {
        setAuthError(result.error || "Could not create the studio account.");
        return;
      }
      toast.success("Studio account created.");
    } else {
      const ok = await login(email, password);
      setSubmitting(false);
      if (!ok) {
        setAuthError("Those details don’t match this studio account.");
        return;
      }
      toast.success("Welcome back to the studio.");
    }

    setExiting(true);
    window.setTimeout(() => router.push("/dashboard"), 420);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[oklch(0.13_0.012_75)] px-4 py-10 text-[oklch(0.93_0.02_85)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.32_0.04_80_/_0.35),_transparent_55%),radial-gradient(ellipse_at_bottom,_oklch(0.22_0.03_70_/_0.4),_transparent_50%)]" />
      <AnimatePresence>
        {!exiting && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{
              opacity: 1,
              y: 0,
              x: authError ? [0, -10, 10, -6, 6, 0] : 0,
            }}
            exit={{ opacity: 0, scale: 0.98, y: -12 }}
            transition={{ duration: authError ? 0.45 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md"
          >
            <div className="glass-panel rounded-3xl p-8 sm:p-10">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                    <LogoMark className="size-6" />
                  </div>
                  <div>
                    <p className="font-heading text-2xl leading-none">Duneworks</p>
                    <p className="mt-1 text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                      Productions
                    </p>
                  </div>
                </div>
                <BetaBadge />
              </div>
              <p className="font-heading text-4xl">
                {needsSetup ? "Create studio" : "Studio access"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {needsSetup
                  ? "Set up the first account. Client, project, and finance data is stored in the studio database."
                  : "Sign in to the Duneworks productions CRM."}
              </p>
              <form className="mt-8 space-y-4" onSubmit={onSubmit}>
                {needsSetup ? (
                  <>
                    <Field
                      id="studioName"
                      label="Studio name"
                      value={studioName}
                      onChange={setStudioName}
                      error={errors.studioName}
                    />
                    <Field
                      id="name"
                      label="Your name"
                      value={name}
                      onChange={setName}
                      error={errors.name}
                    />
                  </>
                ) : null}
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                  autoComplete="username"
                />
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={needsSetup ? "new-password" : "current-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={Boolean(errors.password)}
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
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
                  {submitting
                    ? "Saving…"
                    : needsSetup
                      ? "Create account"
                      : "Enter studio"}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className="h-10"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

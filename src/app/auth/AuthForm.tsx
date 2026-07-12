"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Route as RouteIcon, ShieldCheck, Eye, EyeOff, Loader2, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { CAMPUSES, getActiveCampus, ALLOWED_EMAIL_DOMAINS } from "@/lib/campuses";

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-success"];
  return {
    level: score,
    label: labels[Math.max(0, score - 1)] ?? "Weak",
    color: colors[Math.max(0, score - 1)] ?? "bg-destructive",
  };
}

export function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Subdomain active campus resolution
  const [activeCampus, setActiveCampus] = useState(CAMPUSES[0]);
  const [selectedCampusId, setSelectedCampusId] = useState(CAMPUSES[0].id);
  const [isGenericHost, setIsGenericHost] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = getActiveCampus();
      setActiveCampus(active);
      setSelectedCampusId(active.id);

      const hostname = window.location.hostname;
      // If we are on a bare domain (e.g. localhost, campuspool.com, or IP)
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "campuspool.com" ||
        hostname.split(".").length === 1
      ) {
        setIsGenericHost(true);
      }
    }
  }, []);

  // Auto-select campus if the typed email's domain matches any campus config
  useEffect(() => {
    const domain = email.toLowerCase().trim().split("@")[1] ?? "";
    if (domain) {
      const match = CAMPUSES.find((c) => c.emailDomains.includes(domain));
      if (match) {
        setSelectedCampusId(match.id);
      }
    }
  }, [email]);

  const currentCampus = CAMPUSES.find((c) => c.id === selectedCampusId) || activeCampus;
  const allowedDomains = currentCampus.emailDomains;

  const emailDomain = email.includes("@") ? email.toLowerCase().trim().split("@")[1] ?? "" : "";
  const showDomainHint = email.includes("@") && emailDomain.length > 0 && !allowedDomains.includes(emailDomain);
  const pwStrength = getPasswordStrength(password);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = email.toLowerCase().trim().split("@")[1] ?? "";
    if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      return toast.error("Access denied. Logins are restricted to whitelisted university emails.");
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      if (/confirm/i.test(error.message) || /email/i.test(error.message))
        return toast.error("Confirm your email first — check your inbox for the verification link.");
      return toast.error(error.message);
    }
    toast.success("Welcome back!");
    router.refresh();
    router.push("/home");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = email.toLowerCase().trim().split("@")[1] ?? "";
    if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      return toast.error("Access denied. Registrations are restricted to whitelisted university emails.");
    }
    if (!allowedDomains.includes(domain)) {
      return toast.error(
        `Use your ${currentCampus.name} email (ending in: ${allowedDomains.join(", ")})`
      );
    }
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          full_name: fullName.trim(),
          college: currentCampus.defaultCollegeName,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSignedUp(email.trim());
    toast.success("Check your inbox to verify your email");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <RouteIcon className="h-4 w-4" />
            </span>
            CampusPool
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-md flex-col px-5 py-16">
        <div className="text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-1.5 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" /> {currentCampus.name} verified access
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to CampusPool</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only <span className="text-foreground">{allowedDomains.map((d) => `@${d}`).join(", ")}</span> emails can sign up.
        </p>

        {signedUp ? (
          <div className="surface-card mt-8 p-6 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15">
                <Mail className="h-5 w-5 text-success" />
              </div>
              <div className="text-base font-semibold">Verify your email</div>
            </div>
            <p className="mt-3 text-muted-foreground">
              We sent a verification link to <span className="text-foreground font-medium">{signedUp}</span>. Click
              the link to activate your account, then come back and sign in.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Check your spam folder if you don't see it
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={() => setSignedUp(null)}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="signin" className="mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                {isGenericHost && (
                  <div className="space-y-1.5">
                    <Label htmlFor="si-college">Select your College</Label>
                    <select
                      id="si-college"
                      value={selectedCampusId}
                      onChange={(e) => setSelectedCampusId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      {CAMPUSES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="si-email">College email</Label>
                  <Input
                    id="si-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`you@${allowedDomains[0]}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="si-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                {isGenericHost && (
                  <div className="space-y-1.5">
                    <Label htmlFor="su-college">Select your College</Label>
                    <select
                      id="su-college"
                      value={selectedCampusId}
                      onChange={(e) => setSelectedCampusId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      {CAMPUSES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Priya Sharma" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">College email</Label>
                  <Input
                    id="su-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={`your-id@${allowedDomains[0]}`}
                  />
                  {showDomainHint && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <ShieldCheck className="h-3 w-3" />
                      Only {allowedDomains.map((d) => `@${d}`).join(", ")} emails are accepted
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="su-password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {password.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= pwStrength.level ? pwStrength.color : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Password strength: <span className="text-foreground">{pwStrength.label}</span>
                      </p>
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

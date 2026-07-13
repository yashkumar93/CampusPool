"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Route as RouteIcon, ShieldCheck, Eye, EyeOff, Loader2, Mail, CheckCircle2, Check, Search } from "lucide-react";
import Link from "next/link";
import { CAMPUSES, getActiveCampus, ALLOWED_EMAIL_DOMAINS } from "@/lib/campuses";

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-[#F15E6C]", "bg-orange-500", "bg-yellow-500", "bg-[#b7c6c2]"];
  return {
    level: score,
    label: labels[Math.max(0, score - 1)] ?? "Weak",
    color: colors[Math.max(0, score - 1)] ?? "bg-destructive",
  };
}

const ORGANIZATIONS: { name: string; campusId: string; domain: string }[] = [
  { name: "VIT Vellore", campusId: "vit", domain: "vit.ac.in" },
  { name: "VIT Vellore", campusId: "vit", domain: "vitstudent.ac.in" },
  { name: "VIT-AP University", campusId: "vitap", domain: "vitap.ac.in" },
  { name: "VIT-AP University", campusId: "vitap", domain: "vitapstudent.ac.in" },
  { name: "SRM Kattankulathur", campusId: "srm", domain: "srmist.edu.in" },
  { name: "SRM University AP", campusId: "other", domain: "srmap.edu.in" },
  { name: "Anna University", campusId: "other", domain: "annauniv.edu" },
  { name: "IIT Madras", campusId: "other", domain: "iitm.ac.in" },
  { name: "SSN College of Engineering", campusId: "other", domain: "ssn.edu.in" },
  { name: "SVCE (Sri Venkateswara College of Engineering)", campusId: "other", domain: "svce.ac.in" },
  { name: "Rajalakshmi Engineering College", campusId: "other", domain: "rajalakshmi.edu.in" },
  { name: "Sathyabama University", campusId: "other", domain: "sathyabama.ac.in" },
  { name: "Hindustan University", campusId: "other", domain: "hindustanuniv.ac.in" },
  { name: "Saveetha University", campusId: "other", domain: "saveetha.ac.in" },
  { name: "Vel Tech University", campusId: "other", domain: "veltech.edu.in" },
  { name: "B.S. Abdur Rahman Crescent Institute", campusId: "other", domain: "crescent.education" },
  { name: "St. Joseph's Institute of Technology", campusId: "other", domain: "stjosephstechnology.ac.in" },
  { name: "Jeppiaar Engineering College", campusId: "other", domain: "jeppiaarcollege.org" },
  { name: "Panimalar Engineering College", campusId: "other", domain: "panimalar.ac.in" },
  { name: "Sri Sairam Engineering College", campusId: "other", domain: "sairam.edu.in" },
  { name: "Sri Sairam Institute of Technology", campusId: "other", domain: "sairamit.edu.in" },
  { name: "Loyola College", campusId: "other", domain: "loyolacollege.edu" },
  { name: "Madras Christian College", campusId: "other", domain: "mcc.edu.in" },
  { name: "D.G. Vaishnav College", campusId: "other", domain: "dgvaishnavcollege.edu.in" },
  { name: "Ethiraj College for Women", campusId: "other", domain: "ethirajcollege.edu.in" },
  { name: "Women's Christian College", campusId: "other", domain: "wcc.edu.in" },
  { name: "Stella Maris College", campusId: "other", domain: "stellamariscollege.edu.in" },
  { name: "M.O.P. Vaishnav College for Women", campusId: "other", domain: "mopvc.edu.in" },
  { name: "PSG College of Technology", campusId: "other", domain: "psgtech.edu" },
  { name: "PSG College of Arts and Science", campusId: "other", domain: "psgcas.ac.in" },
  { name: "Coimbatore Institute of Technology", campusId: "other", domain: "cit.edu.in" },
  { name: "Amrita Vishwa Vidyapeetham", campusId: "other", domain: "amrita.edu" },
  { name: "Karunya Institute of Technology", campusId: "other", domain: "karunya.edu" },
  { name: "Government College of Technology", campusId: "other", domain: "gct.ac.in" },
  { name: "KPR Institute of Engineering and Technology", campusId: "other", domain: "kpriet.ac.in" },
  { name: "Sri Krishna College of Engineering and Technology", campusId: "other", domain: "skcet.ac.in" },
  { name: "Sri Krishna College of Technology", campusId: "other", domain: "skct.edu.in" },
  { name: "Kongu Engineering College", campusId: "other", domain: "kongu.ac.in" },
  { name: "Bannari Amman Institute of Technology", campusId: "other", domain: "bitsathy.ac.in" },
  { name: "Velalar College of Engineering and Technology", campusId: "other", domain: "velalarengg.ac.in" },
  { name: "NxtWave", campusId: "other", domain: "nxtwave.co.in" },
];

export function AuthForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signedUp, setSignedUp] = useState<string | null>(null);

  // Forgot Password / Reset Password States
  const [forgotPassword, setForgotPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  // Active campus & subdomain resolution logic
  const [selectedCampusId, setSelectedCampusId] = useState<string>("other");
  const [activeCampus, setActiveCampus] = useState<any>(CAMPUSES[0]);
  const [isGenericHost, setIsGenericHost] = useState(true);

  // Check for recovery hash fragment on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    if (hash.includes("type=recovery") || params.get("type") === "recovery") {
      setIsResetMode(true);
      toast.success("Authentication confirmed. Please set your new password below.");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hostname = window.location.hostname;
    
    // If we are on a bare domain (e.g. localhost, nxtpool.com, or IP)
    // let user select their campus/organization. Otherwise resolve automatically.
    const isBare =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "nxtpool.com" ||
      hostname.endsWith(".lovable.app");

    setIsGenericHost(isBare);

    if (!isBare) {
      const sub = hostname.split(".")[0];
      const match = CAMPUSES.find((c) => c.subdomain === sub);
      if (match) {
        setActiveCampus(match);
        setSelectedCampusId(match.id);
      }
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<typeof ORGANIZATIONS[0] | null>(null);
  const [focusedInput, setFocusedInput] = useState<"signin" | "signup" | null>(null);

  // Auto-select campus if the typed email's domain matches any campus config or whitelist
  useEffect(() => {
    const domain = email.toLowerCase().trim().split("@")[1] ?? "";
    if (domain) {
      const match = ORGANIZATIONS.find((org) => org.domain === domain);
      if (match) {
        setSelectedCampusId(match.campusId);
        setSelectedOrg(match);
        setSearchQuery(match.name);
      } else {
        const matchCampus = CAMPUSES.find((c) => c.emailDomains.includes(domain));
        if (matchCampus) {
          setSelectedCampusId(matchCampus.id);
          const defaultOrg = ORGANIZATIONS.find(org => org.campusId === matchCampus.id);
          if (defaultOrg) {
            setSelectedOrg(defaultOrg);
            setSearchQuery(defaultOrg.name);
          }
        }
      }
    }
  }, [email]);

  const currentCampus = CAMPUSES.find((c) => c.id === selectedCampusId) || activeCampus;
  const allowedDomains = selectedOrg ? [selectedOrg.domain] : currentCampus.emailDomains;
  const filteredOrgs = ORGANIZATIONS.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          college: selectedOrg ? selectedOrg.name : currentCampus.defaultCollegeName,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSignedUp(email.trim());
    toast.success("Check your inbox to verify your email");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your college email address first");
    const domain = email.toLowerCase().trim().split("@")[1] ?? "";
    if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      return toast.error("Access denied. University email is not whitelisted.");
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth?type=recovery`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent! Check your email inbox.");
    setForgotPassword(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated successfully! Redirecting you...");
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-[#171e19] relative overflow-hidden font-sans">
      {/* Floating dot pattern background overlay */}
      <div className="absolute inset-0 bg-dot-pattern opacity-10 pointer-events-none" />

      <header className="border-b-2 border-black bg-[#ffe17c]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-lg text-black">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-black border-2 border-black">
              <RouteIcon className="h-4 w-4 text-[#ffe17c]" />
            </span>
            NxtPool
          </Link>
          <Link href="/" className="text-sm font-bold text-black hover:underline">← Back</Link>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-md flex-col px-5 py-16 animate-fade-in-up">
        {isResetMode ? (
          <div className="bg-white border-2 border-black rounded-xl p-8 shadow-neo-lg text-black">
            <h1 className="text-3xl font-heading font-extrabold tracking-tighter text-black">Set new password</h1>
            <p className="mt-2 text-sm text-neutral-600 font-sans font-medium">
              Enter your new account password (at least 8 characters).
            </p>
            <form onSubmit={handleUpdatePassword} className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-black font-bold">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10 bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-3.5 text-neutral-500 hover:text-black transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-12 btn-neo-primary font-bold mt-4 flex items-center justify-center gap-2 cursor-pointer"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Saving..." : "Update password"}
              </button>
            </form>
          </div>
        ) : forgotPassword ? (
          <div className="bg-white border-2 border-black rounded-xl p-8 shadow-neo-lg text-black">
            <h1 className="text-3xl font-heading font-extrabold tracking-tighter text-black">Reset password</h1>
            <p className="mt-2 text-sm text-neutral-600 font-sans font-medium">
              Enter your college email below and we will send you a password reset link.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-black font-bold">College email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black h-11"
                />
              </div>
              <button
                type="submit"
                className="w-full h-12 btn-neo-primary font-bold mt-4 flex items-center justify-center gap-2 cursor-pointer"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Sending..." : "Send reset link"}
              </button>
              <button
                type="button"
                onClick={() => setForgotPassword(false)}
                className="w-full h-12 btn-neo-secondary font-bold cursor-pointer"
              >
                Back to sign in
              </button>
            </form>
          </div>
        ) : signedUp ? (
          <div className="bg-[#ffe17c] border-2 border-black rounded-xl p-8 shadow-neo-lg text-black text-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-black border-2 border-black">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div className="text-lg font-heading font-extrabold tracking-tight">Verify your email</div>
            </div>
            <p className="font-sans font-medium text-neutral-800 leading-relaxed">
              We sent a verification link to <span className="font-bold underline">{signedUp}</span>. Click
              the link to activate your account, then come back and sign in.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 bg-white/40 border border-black/25 px-2.5 py-1.5 rounded">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-black" />
              Check your spam folder if you don't see it
            </div>
            <button 
              type="button" 
              className="w-full h-12 btn-neo-secondary font-bold" 
              onClick={() => setSignedUp(null)}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <div className="bg-white border-2 border-black rounded-xl p-8 shadow-neo-lg text-black">
            <h1 className="text-3xl font-heading font-extrabold tracking-tighter text-black">Sign in to NxtPool</h1>
            <p className="mt-2 text-sm text-neutral-600 font-sans font-medium">
              Sign in or create an account using your verified organization or college email.
            </p>

            <Tabs defaultValue="signin" className="mt-6">
              <TabsList className="grid w-full grid-cols-2 bg-neutral-100 border-2 border-black p-1 h-12 rounded-lg">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none font-bold text-black py-2 rounded-md transition-colors cursor-pointer"
                >
                  Sign in
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none font-bold text-black py-2 rounded-md transition-colors cursor-pointer"
                >
                  Create account
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-5">
                <form onSubmit={handleSignIn} className="space-y-4">
                  {isGenericHost && (
                    <div className="space-y-1.5 relative">
                      <Label className="text-black font-bold">Select your org or college</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
                        <Input
                          type="text"
                          placeholder="Search organization or college..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (selectedOrg && e.target.value !== selectedOrg.name) {
                              setSelectedOrg(null);
                            }
                          }}
                          onFocus={() => setFocusedInput("signin")}
                          onBlur={() => {
                            setTimeout(() => setFocusedInput(null), 250);
                          }}
                          className="pl-9 pr-10 bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black h-11"
                        />
                        {selectedOrg && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#b7c6c2]/40 text-black border border-black">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      
                      {focusedInput === "signin" && (
                        <div className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto rounded-lg border-2 border-black bg-white shadow-neo-lg p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          {filteredOrgs.length === 0 ? (
                            <div className="p-3 text-xs text-neutral-500 font-bold text-center">
                              No matching organizations found.<br/>
                              Try typing another name.
                            </div>
                          ) : (
                            filteredOrgs.map((org, index) => {
                              const isSelected = selectedOrg?.name === org.name && selectedOrg?.domain === org.domain;
                              return (
                                <button
                                  key={`si-${org.domain}-${index}`}
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrg(org);
                                    setSelectedCampusId(org.campusId);
                                    setSearchQuery(org.name);
                                    setFocusedInput(null);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${
                                    isSelected 
                                      ? "bg-[#ffe17c] text-black font-extrabold border border-black shadow-neo-sm" 
                                      : "hover:bg-neutral-100 text-black"
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="block font-bold">{org.name}</span>
                                      <span className="block text-[10px] text-neutral-500">
                                        @{org.domain}
                                      </span>
                                    </div>
                                    {isSelected && <Check className="h-3.5 w-3.5" />}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="si-email" className="text-black font-bold">College email</Label>
                    <Input
                      id="si-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={`you@${allowedDomains[0]}`}
                      className="bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="si-password" className="text-black font-bold">Password</Label>
                    <div className="relative">
                      <Input
                        id="si-password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black h-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-3.5 text-neutral-500 hover:text-black transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setForgotPassword(true)}
                      className="text-xs font-bold text-neutral-600 hover:text-black hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full h-12 btn-neo-primary font-bold mt-4 flex items-center justify-center gap-2" 
                    disabled={loading}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? "Signing in…" : "Sign in"}
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {isGenericHost && (
                    <div className="space-y-1.5 relative">
                      <Label className="text-black font-bold">Select your org or college</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
                        <Input
                          type="text"
                          placeholder="Search organization or college..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (selectedOrg && e.target.value !== selectedOrg.name) {
                              setSelectedOrg(null);
                            }
                          }}
                          onFocus={() => setFocusedInput("signup")}
                          onBlur={() => {
                            setTimeout(() => setFocusedInput(null), 250);
                          }}
                          className="pl-9 pr-10 bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black h-11"
                        />
                        {selectedOrg && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#b7c6c2]/40 text-black border border-black">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      
                      {focusedInput === "signup" && (
                        <div className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto rounded-lg border-2 border-black bg-white shadow-neo-lg p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                          {filteredOrgs.length === 0 ? (
                            <div className="p-3 text-xs text-neutral-500 font-bold text-center">
                              No matching organizations found.<br/>
                              Try typing another name.
                            </div>
                          ) : (
                            filteredOrgs.map((org, index) => {
                              const isSelected = selectedOrg?.name === org.name && selectedOrg?.domain === org.domain;
                              return (
                                <button
                                  key={`su-${org.domain}-${index}`}
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrg(org);
                                    setSelectedCampusId(org.campusId);
                                    setSearchQuery(org.name);
                                    setFocusedInput(null);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${
                                    isSelected 
                                      ? "bg-[#ffe17c] text-black font-extrabold border border-black shadow-neo-sm" 
                                      : "hover:bg-neutral-100 text-black"
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="block font-bold">{org.name}</span>
                                      <span className="block text-[10px] text-neutral-500">
                                        @{org.domain}
                                      </span>
                                    </div>
                                    {isSelected && <Check className="h-3.5 w-3.5" />}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="su-name" className="text-black font-bold">Full name</Label>
                    <Input 
                      id="su-name" 
                      required 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Priya Sharma" 
                      className="bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-email" className="text-black font-bold">College email</Label>
                    <Input
                      id="su-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={`your-id@${allowedDomains[0]}`}
                      className="bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black h-11"
                    />
                    {showDomainHint && (
                      <p className="text-xs text-red-500 font-bold flex items-center gap-1 mt-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-red-500" />
                        {allowedDomains.length > 3
                          ? "Email domain must match your selected organization"
                          : `Only ${allowedDomains.map((d) => `@${d}`).join(", ")} emails are accepted`}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-password" className="text-black font-bold">Password</Label>
                    <div className="relative">
                      <Input
                        id="su-password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="pr-10 bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black h-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-3.5 text-neutral-500 hover:text-black transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    {password.length > 0 && (
                      <div className="space-y-1 mt-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded border border-black transition-all duration-300 ${
                                i <= pwStrength.level ? pwStrength.color : "bg-neutral-100"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-neutral-500 font-bold">
                          Password strength: <span className="text-black underline">{pwStrength.label}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    className="w-full h-12 btn-neo-primary font-bold mt-4 flex items-center justify-center gap-2" 
                    disabled={loading}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? "Creating account…" : "Create account"}
                  </button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

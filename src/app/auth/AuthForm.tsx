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
  const colors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-success"];
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
  { name: "University of Madras", campusId: "other", domain: "madrasuniversity.ac.in" },
  { name: "IIT Bombay", campusId: "other", domain: "iitb.ac.in" },
  { name: "IIT Delhi", campusId: "other", domain: "iitd.ac.in" },
  { name: "IIT Kanpur", campusId: "other", domain: "iitk.ac.in" },
  { name: "IIT Kharagpur", campusId: "other", domain: "iitkgp.ac.in" },
  { name: "IIT Guwahati", campusId: "other", domain: "iitg.ac.in" },
  { name: "IIT Roorkee", campusId: "other", domain: "iitr.ac.in" },
  { name: "IIT Hyderabad", campusId: "other", domain: "iith.ac.in" },
  { name: "IIT Bhubaneswar", campusId: "other", domain: "iitbbs.ac.in" },
  { name: "IIT Jodhpur", campusId: "other", domain: "iitj.ac.in" },
  { name: "IIT Mandi", campusId: "other", domain: "iitmandi.ac.in" },
  { name: "IIT Gandhinagar", campusId: "other", domain: "iitgn.ac.in" },
  { name: "IIIT Hyderabad", campusId: "other", domain: "iiit.ac.in" },
  { name: "IIIT Bangalore", campusId: "other", domain: "iiitb.ac.in" },
  { name: "IIIT Delhi", campusId: "other", domain: "iiitd.ac.in" },
  { name: "IIIT Lucknow", campusId: "other", domain: "iiitl.ac.in" },
  { name: "IIITDM Kancheepuram", campusId: "other", domain: "iiitdm.ac.in" },
  { name: "IIIT Kottayam", campusId: "other", domain: "iiitkottayam.ac.in" },
  { name: "IIIT Naya Raipur", campusId: "other", domain: "iiitnr.edu.in" },
  { name: "IISc Bangalore", campusId: "other", domain: "iisc.ac.in" },
  { name: "RV College of Engineering", campusId: "other", domain: "rvce.edu.in" },
  { name: "BMS College of Engineering", campusId: "other", domain: "bmsce.ac.in" },
  { name: "BMS Institute of Technology", campusId: "other", domain: "bmsit.in" },
  { name: "M.S. Ramaiah Institute of Technology", campusId: "other", domain: "msrit.edu" },
  { name: "PES University", campusId: "other", domain: "pes.edu" },
  { name: "Christ University", campusId: "other", domain: "christuniversity.in" },
  { name: "REVA University", campusId: "other", domain: "reva.edu.in" },
  { name: "CMR Institute of Technology", campusId: "other", domain: "cmrit.ac.in" },
  { name: "Nitte Meenakshi Institute of Technology", campusId: "other", domain: "nmit.ac.in" },
  { name: "New Horizon College of Engineering", campusId: "other", domain: "newhorizonindia.edu" },
  { name: "Jain University", campusId: "other", domain: "jainuniversity.ac.in" },
  { name: "Alliance University", campusId: "other", domain: "alliance.edu.in" },
  { name: "Presidency University", campusId: "other", domain: "presidencyuniversity.in" },
  { name: "ACS College of Engineering", campusId: "other", domain: "acsce.edu.in" },
  { name: "Dayananda Sagar College of Engineering", campusId: "other", domain: "dayanandasagar.edu" },
  { name: "University of Hyderabad", campusId: "other", domain: "uohyd.ac.in" },
  { name: "Osmania University", campusId: "other", domain: "osmania.ac.in" },
  { name: "JNTU Hyderabad", campusId: "other", domain: "jntuh.ac.in" },
  { name: "Chaitanya Bharathi Institute of Technology", campusId: "other", domain: "cbit.ac.in" },
  { name: "Gokaraju Rangaraju Institute of Engineering and Technology", campusId: "other", domain: "griet.ac.in" },
  { name: "CVR College of Engineering", campusId: "other", domain: "cvr.ac.in" },
  { name: "VNR Vignana Jyothi Institute of Engineering and Technology", campusId: "other", domain: "vnrvjiet.in" },
  { name: "Mahatma Gandhi Institute of Technology", campusId: "other", domain: "mgit.ac.in" },
  { name: "Mahindra University", campusId: "other", domain: "mahindrauniversity.edu.in" },
  { name: "Anurag University", campusId: "other", domain: "anurag.edu.in" },
  { name: "MLR Institute of Technology", campusId: "other", domain: "mlrinstitutions.ac.in" },
  { name: "Woxsen University", campusId: "other", domain: "woxsen.edu.in" },
  { name: "IFHE Hyderabad", campusId: "other", domain: "ifheindia.org" },
  { name: "K L University", campusId: "other", domain: "kluniversity.in" },
  { name: "Vignan's Foundation for Science, Technology & Research", campusId: "other", domain: "vignan.ac.in" },
  { name: "GITAM University", campusId: "other", domain: "gitam.edu" },
  { name: "RGUKT", campusId: "other", domain: "rgukt.in" },
  { name: "SRKR Engineering College", campusId: "other", domain: "srkr.edu.in" },
  { name: "Aditya Engineering College", campusId: "other", domain: "aditya.ac.in" },
  { name: "Aditya Engineering College (AEC)", campusId: "other", domain: "aec.edu.in" },
  { name: "PVP Siddhartha Institute of Technology", campusId: "other", domain: "pvpsiddhartha.ac.in" },
  { name: "RVR & JC College of Engineering", campusId: "other", domain: "rvrjc.ac.in" },
  { name: "Velagapudi Ramakrishna Siddhartha Engineering College", campusId: "other", domain: "vrsiddhartha.ac.in" },
  { name: "Sri Venkateswara University", campusId: "other", domain: "svuniversity.edu.in" },
  { name: "JNTU Kakinada", campusId: "other", domain: "jntuku.edu.in" },
  { name: "Andhra University", campusId: "other", domain: "andhrauniversity.edu.in" },
  { name: "NIST University", campusId: "other", domain: "nist.edu" },
  { name: "BITS Pilani", campusId: "other", domain: "bits-pilani.ac.in" },
  { name: "Manipal Academy of Higher Education", campusId: "other", domain: "manipal.edu" },
  { name: "Amity University", campusId: "other", domain: "amity.edu" },
  { name: "Amity University (IN)", campusId: "other", domain: "amity.edu.in" },
  { name: "Delhi Technological University", campusId: "other", domain: "dtu.ac.in" },
  { name: "NIT Trichy", campusId: "other", domain: "nitt.edu" },
  { name: "NIT Surathkal", campusId: "other", domain: "nitk.edu.in" },
  { name: "NIT Warangal", campusId: "other", domain: "nitw.ac.in" },
  { name: "NIT Calicut", campusId: "other", domain: "nitc.ac.in" },
  { name: "NIT Rourkela", campusId: "other", domain: "nitrkl.ac.in" },
  { name: "MNIT Jaipur", campusId: "other", domain: "mnit.ac.in" },
  { name: "IIIT Allahabad", campusId: "other", domain: "iiita.ac.in" },
  { name: "Jadavpur University", campusId: "other", domain: "jadavpuruniversity.in" },
  { name: "KIIT University", campusId: "other", domain: "kiit.ac.in" },
  { name: "Siksha 'O' Anusandhan", campusId: "other", domain: "soa.ac.in" },
  { name: "Thapar Institute of Engineering and Technology", campusId: "other", domain: "thapar.edu" },
  { name: "Chitkara University", campusId: "other", domain: "chitkara.edu.in" },
  { name: "The LNM Institute of Information Technology", campusId: "other", domain: "lnmiit.ac.in" },
  { name: "VIT Bhopal University", campusId: "other", domain: "vitbhopal.ac.in" },
  { name: "Sharda University", campusId: "other", domain: "sharda.ac.in" },
  { name: "Galgotias University", campusId: "other", domain: "galgotiasuniversity.edu.in" },
  { name: "Lovely Professional University", campusId: "other", domain: "lpu.in" },
  { name: "Chandigarh University", campusId: "other", domain: "cuonline.ac.in" },
  { name: "Symbiosis International University", campusId: "other", domain: "symbiosis.ac.in" },
  { name: "MIT World Peace University", campusId: "other", domain: "mitwpu.edu.in" },
  { name: "COEP Technological University", campusId: "other", domain: "coep.org.in" },
  { name: "Pimpri Chinchwad College of Engineering", campusId: "other", domain: "pccoepune.com" },
  { name: "NxtWave", campusId: "other", domain: "nxtwave.co.in" },
];

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
      // If we are on a bare domain (e.g. localhost, nxtpool.com, or IP)
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "nxtpool.com" ||
        hostname.split(".").length === 1
      ) {
        setIsGenericHost(true);
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating canopy orbs */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-[#4f772d]/8 blur-[120px] animate-[drift_20s_ease-in-out_infinite]" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-10%] top-[-5%] h-[400px] w-[400px] rounded-full bg-[#90a955]/6 blur-[100px] animate-[drift_25s_ease-in-out_infinite_reverse]" aria-hidden="true" />
      <div className="pointer-events-none absolute left-[30%] bottom-10 h-[300px] w-[300px] rounded-full bg-[#ecf39e]/4 blur-[80px] animate-[drift_18s_ease-in-out_infinite]" aria-hidden="true" />
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <RouteIcon className="h-4 w-4" />
            </span>
            NxtPool
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</Link>
        </div>
      </header>

      <div className="relative mx-auto flex max-w-md flex-col px-5 py-16 animate-fade-in-up">
        <div className="text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-1.5 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" /> {currentCampus.name} verified access
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to NxtPool</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in or create an account using your verified organization or college email.
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
                  <div className="space-y-1.5 relative">
                    <Label>Select your org or college</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                        className="pl-9 pr-10"
                      />
                      {selectedOrg && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-success/20 text-success">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    
                    {focusedInput === "signin" && (
                      <div className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-xl p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        {filteredOrgs.length === 0 ? (
                          <div className="p-3 text-xs text-muted-foreground text-center">
                            No matching organizations found.<br/>
                            Try typing another name.
                          </div>
                        ) : (
                          filteredOrgs.map((org) => {
                            const isSelected = selectedOrg?.name === org.name;
                            return (
                              <button
                                key={`si-${org.name}`}
                                type="button"
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setSelectedCampusId(org.campusId);
                                  setSearchQuery(org.name);
                                  setFocusedInput(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between transition-colors ${
                                  isSelected 
                                    ? "bg-primary text-primary-foreground font-semibold" 
                                    : "hover:bg-muted text-foreground"
                                }`}
                              >
                                <div>
                                  <span className="block font-medium">{org.name}</span>
                                  <span className={`block text-[10px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                    @{org.domain}
                                  </span>
                                </div>
                                {isSelected && <Check className="h-3 w-3" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
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
                  <div className="space-y-1.5 relative">
                    <Label>Select your org or college</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                        className="pl-9 pr-10"
                      />
                      {selectedOrg && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-success/20 text-success">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    
                    {focusedInput === "signup" && (
                      <div className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-xl p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        {filteredOrgs.length === 0 ? (
                          <div className="p-3 text-xs text-muted-foreground text-center">
                            No matching organizations found.<br/>
                            Try typing another name.
                          </div>
                        ) : (
                          filteredOrgs.map((org) => {
                            const isSelected = selectedOrg?.name === org.name;
                            return (
                              <button
                                key={`su-${org.name}`}
                                type="button"
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setSelectedCampusId(org.campusId);
                                  setSearchQuery(org.name);
                                  setFocusedInput(null);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between transition-colors ${
                                  isSelected 
                                    ? "bg-primary text-primary-foreground font-semibold" 
                                    : "hover:bg-muted text-foreground"
                                }`}
                              >
                                <div>
                                  <span className="block font-medium">{org.name}</span>
                                  <span className={`block text-[10px] ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                    @{org.domain}
                                  </span>
                                </div>
                                {isSelected && <Check className="h-3 w-3" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
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
                      {allowedDomains.length > 3
                        ? "Email domain must match your selected organization"
                        : `Only ${allowedDomains.map((d) => `@${d}`).join(", ")} emails are accepted`}
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

import { Metadata } from "next";
import Link from "next/link";
import {
  Zap, Users, Bus, Sparkles, ShieldCheck, BarChart3, MapPin, ArrowRight, Leaf, IndianRupee,
} from "lucide-react";

export const metadata: Metadata = {
  title: "NXTPOOL — One App. Every Ride. Every Student.",
  description: "AI-powered campus mobility platform connecting verified students through intelligent ride sharing, live bus routes and transport comparison.",
  openGraph: {
    title: "NXTPOOL — One App. Every Ride. Every Student.",
    description: "AI-powered campus mobility platform for verified student ride sharing, bus routes and smart transport comparison.",
  }
};

const features = [
  {
    icon: Users,
    title: "Verified Ride Sharing",
    desc: "Share rides only with students verified through official college email domains. No strangers, ever.",
  },
  {
    icon: Sparkles,
    title: "AI Recommendations",
    desc: "Our agents read your timetable, traffic and ride availability to pick the smartest way to campus.",
  },
  {
    icon: Bus,
    title: "Live Bus Routes",
    desc: "MTC arrivals, crowding levels and route maps — no more guessing when the 21G shows up.",
  },
  {
    icon: ShieldCheck,
    title: "Safety First",
    desc: "SOS button, trip sharing, emergency contacts, ratings and female-only ride options.",
  },
  {
    icon: BarChart3,
    title: "Campus Analytics",
    desc: "Money saved, CO₂ reduced, popular routes and peak hours across your campus community.",
  },
  {
    icon: MapPin,
    title: "One Live Map",
    desc: "Students, drivers, pickup points and bus stops on a single interactive campus map.",
  },
];

const stats = [
  { icon: Users, value: "2,100+", label: "Verified students" },
  { icon: IndianRupee, value: "₹4.8L+", label: "Saved on travel" },
  { icon: Leaf, value: "7.4t", label: "CO₂ avoided" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background" style={{ backgroundImage: "var(--gradient-hero)" }}>
      {/* Nav */}
      <header className="sticky top-0 z-30 glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand shadow-glow">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              NXT<span className="gradient-text">POOL</span>
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/auth"
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/auth"
              className="rounded-xl gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Next-Generation Campus Mobility Platform
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-6xl text-foreground">
            One App. <span className="gradient-text">Every Ride.</span>
            <br /> Every Student.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            NXTPOOL is an AI-powered campus mobility platform that connects verified students through
            intelligent ride sharing while comparing public transport and travel options — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 hover:shadow-glow-green"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Explore Demo
            </Link>
          </div>
        </div>

        <div className="relative mx-auto mt-14 max-w-4xl">
          <div className="absolute -inset-4 rounded-3xl gradient-brand opacity-20 blur-3xl" />
          <img
            src="/hero-campus.png"
            alt="NXTPOOL live campus mobility map connecting students, bikes, cars and buses"
            width={1536}
            height={1024}
            className="relative w-full rounded-3xl border border-border shadow-2xl animate-float"
          />
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="card-elevated flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                <s.icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl text-foreground">
            Not another cab app. <span className="gradient-text">A mobility ecosystem.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Students juggle Maps, Ola, Uber, Rapido, bus timings and WhatsApp groups just to reach class.
            NXTPOOL brings it all together — intelligently.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card-elevated group p-6 transition-all hover:shadow-glow">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl gradient-brand shadow-glow transition-transform group-hover:scale-110">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card-elevated relative overflow-hidden p-10 text-center sm:p-14" style={{ backgroundImage: "var(--gradient-hero)" }}>
          <h2 className="font-display text-3xl font-bold sm:text-4xl text-foreground">
            Travel smarter from <span className="gradient-text">day one</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join with your college email and get AI-matched with students on your exact route.
          </p>
          <Link
            href="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-xl gradient-brand px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90"
          >
            Join NXTPOOL <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-bold text-foreground">NXTPOOL</span>
          </div>
          <nav className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
            <span className="cursor-pointer transition-colors hover:text-foreground">About</span>
            <span className="cursor-pointer transition-colors hover:text-foreground">Contact</span>
            <span className="cursor-pointer transition-colors hover:text-foreground">Privacy</span>
            <span className="cursor-pointer transition-colors hover:text-foreground">Terms</span>
            <span className="cursor-pointer transition-colors hover:text-foreground">GitHub</span>
          </nav>
          <p className="text-xs text-muted-foreground">© 2026 NXTPOOL · Campus Mobility</p>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MapPin, Users, ShieldCheck, MessageCircle, Sparkles,
  Route as RouteIcon, Clock, Navigation, CheckCircle2,
  Calendar, Star, ChevronRight, Check, Zap
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Floating forest background orbs */}
      <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-[#4f772d]/6 blur-[120px] animate-[drift_25s_ease-in-out_infinite]" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-10%] top-[10%] h-[450px] w-[450px] rounded-full bg-[#90a955]/5 blur-[100px] animate-[drift_30s_ease-in-out_infinite_reverse]" aria-hidden="true" />

      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-lg">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20">
              <RouteIcon className="h-4.5 w-4.5" />
            </span>
            NxtPool
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign in</Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="glow-primary">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative mx-auto max-w-6xl px-5 pt-20 pb-24 sm:pt-28 overflow-hidden text-center sm:text-left">
          <div className="relative inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs uppercase tracking-wider text-primary font-medium mb-6">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified Students & Org Members Only
          </div>
          
          <h1 className="relative max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl text-balance">
            Share the ride. Split the cost. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-[#ecf39e] via-[#90a955] to-[#4f772d] bg-clip-text text-transparent">
              Skip the stranger cab.
            </span>
          </h1>
          
          <p className="relative mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            NxtPool matches you with verified peers from your university or organization heading the same way. Set your path, coordinate departure times, split fares, and travel together safely.
          </p>

          <div className="relative mt-10 flex flex-wrap justify-center sm:justify-start gap-4">
            <Link href="/auth">
              <Button size="lg" className="h-12 px-8 text-base glow-primary font-semibold">
                Get started now
              </Button>
            </Link>
            <a href="#how" className="inline-flex">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-background/40 hover:bg-background/60">
                How it works
              </Button>
            </a>
          </div>

          {/* Stats Grid */}
          <div className="relative mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { k: "85%", v: "Average Route Overlap" },
              { k: "±20m", v: "Flexible Departure Window" },
              { k: "1-Tap", v: "Instant Match Approval" },
              { k: "0", v: "Random Strangers" },
            ].map((s, i) => (
              <div
                key={s.v}
                className="surface-card p-5 opacity-0 animate-[fadeInUp_0.5s_ease_forwards] hover:border-primary/40 hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 120 + 300}ms` }}
              >
                <div className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-[#ecf39e] to-[#90a955] bg-clip-text text-transparent">
                  {s.k}
                </div>
                <div className="mt-2 text-xs text-muted-foreground font-medium leading-normal">
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Cards Section */}
        <section id="features" className="border-t border-border/40 bg-surface/20 py-20 relative">
          <div className="mx-auto max-w-6xl px-5">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">App Features</span>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mt-3">Smart Commuting Features</h2>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                NxtPool is packed with features designed specifically for campus schedules, safety, and peer-to-peer coordination.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Verified Org Access",
                  desc: "Sign up is strictly restricted to approved organizational and university email domains. Authenticate and match only with people you trust."
                },
                {
                  icon: Sparkles,
                  title: "Overlap Route Matcher",
                  desc: "Our matching engine processes pickup locations, destinations, and schedules to find matches with highly overlapping routes."
                },
                {
                  icon: MessageCircle,
                  title: "Integrated Group Chat",
                  desc: "Once a ride is matched, a private group chat is instantly provisioned for members to coordinate meetups and split fares."
                },
                {
                  icon: Navigation,
                  title: "Realtime GPS Navigation",
                  desc: "Active navigation maps display live routes, driver coordinates, and remaining step-by-step distance estimations."
                },
                {
                  icon: CheckCircle2,
                  title: "Auto-Arrival Completion",
                  desc: "Trips automatically mark as 'Completed' and shut down when drivers approach within 30 meters of the destination."
                },
                {
                  icon: Clock,
                  title: "Auto-Cleanup Engine",
                  desc: "Rides automatically expire and close when the depart time plus the flexible window passes, keeping the ride feed clean."
                }
              ].map((f) => (
                <div key={f.title} className="surface-card p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 flex flex-col justify-between">
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How to Use Section */}
        <section id="how" className="border-t border-border/40 py-20 bg-background relative">
          <div className="mx-auto max-w-6xl px-5">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Step-by-Step Guide</span>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mt-3">How to Use NxtPool</h2>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                Coordinate your next ride in less than a minute. Here is how easy it is to share a pool.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-4 relative z-10">
              {[
                { step: "01", title: "Select Role & Path", desc: "Toggle between Passenger and Driver. Pick your pickup location, destination, and key landmarks." },
                { step: "02", title: "Configure Schedule", desc: "Specify your departure date, time, and flex minutes (e.g. ±15m) to widen matching options." },
                { step: "03", title: "Coordinate in Chat", desc: "Browse nearby matches, request to join or accept passengers, and confirm details inside the private group chat." },
                { step: "04", title: "Navigate & Complete", desc: "Track driver coordinates in real-time. Upon reaching the destination, the trip closes automatically." },
              ].map((s) => (
                <div key={s.step} className="surface-card p-6 relative hover:border-primary/40 flex flex-col justify-between">
                  <div className="absolute -top-4 right-5 text-4xl font-extrabold text-primary/10 tracking-tight select-none">
                    {s.step}
                  </div>
                  <div>
                    <span className="inline-flex items-center justify-center rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary mb-4">
                      Step {s.step}
                    </span>
                    <h3 className="text-base font-bold text-foreground mt-2">{s.title}</h3>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="border-t border-border/40 bg-surface/20 py-20 relative">
          <div className="mx-auto max-w-4xl px-5">
            <div className="text-center mb-12">
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-bold">Answers to your Questions</span>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mt-3">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Who can sign up for NxtPool?",
                  a: "Only users with whitelisted organization or university emails (e.g. VIT, SRM, IITs, NxtWave) can create accounts. All email domains are verified upon registration."
                },
                {
                  q: "How are ride costs split?",
                  a: "NxtPool calculates an estimated trip cost based on distance and vehicle type (bike, auto, cab). You can coordinate cost division directly with other members in your group chat."
                },
                {
                  q: "What happens if I miss my departure window?",
                  a: "NxtPool has an automatic cleanup engine. If the departure time + flex window passes without actions, the ride automatically closes and expires to keep the feed current."
                },
                {
                  q: "Is real-time GPS navigation secure?",
                  a: "Yes. GPS coordinate broadcasts are isolated to active ride groups. Row Level Security policies ensure that only approved members of your group can see coordinate streams."
                }
              ].map((faq, idx) => (
                <div key={idx} className="surface-card p-5">
                  <h3 className="text-sm font-bold text-foreground flex items-start gap-2.5">
                    <span className="text-primary">Q:</span> {faq.q}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed pl-5">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Call-to-Action */}
        <section className="border-t border-border/40 bg-gradient-to-b from-transparent to-surface/20">
          <div className="mx-auto max-w-3xl px-5 py-24 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Your next pool is <span className="italic">already</span> leaving.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Join NxtPool with your organization or university email to connect with matches heading your way in minutes.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/auth">
                <Button size="lg" className="h-12 px-8 text-base glow-primary font-semibold">
                  Create your account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 bg-background relative z-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-10 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} NxtPool. All rights reserved.</span>
          <nav className="flex items-center gap-5" aria-label="Footer">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Contact Support</span>
          </nav>
          <span>Made for organizations and university campuses</span>
        </div>
      </footer>

      {/* Mobile sticky CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/90 backdrop-blur-md p-3 sm:hidden">
        <Link href="/auth" className="block">
          <Button className="w-full h-11 text-base glow-primary font-semibold">Get started — it's free</Button>
        </Link>
      </div>
    </div>
  );
}

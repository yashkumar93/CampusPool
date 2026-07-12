import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Users, ShieldCheck, MessageCircle, Sparkles, Route as RouteIcon } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <RouteIcon className="h-4 w-4" />
            </span>
            CampusPool
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="glow-primary">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative mx-auto max-w-6xl px-5 pt-20 pb-24 sm:pt-28 overflow-hidden">
          {/* Animated glow orb */}
          <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-[100px] animate-pulse" aria-hidden="true" />
          <div className="pointer-events-none absolute right-0 top-20 h-64 w-64 rounded-full bg-primary/8 blur-[80px] animate-[pulse_4s_ease-in-out_infinite]" aria-hidden="true" />

          <div className="relative flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified university students only
          </div>
          <h1 className="relative mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Share the ride.<br className="hidden sm:block" /> Split the cost. <span className="bg-gradient-to-r from-[#ecf39e] via-[#90a955] to-[#4f772d] bg-clip-text text-transparent">Skip the stranger cab.</span>
          </h1>
          <p className="relative mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            CampusPool matches you with verified classmates heading the same way at
            the same time. Group up, chat, and go — without paying full fare.
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Link href="/auth">
              <Button size="lg" className="h-12 px-6 text-base glow-primary">Get started</Button>
            </Link>
            <a href="#how" className="inline-flex">
              <Button size="lg" variant="outline" className="h-12 px-6 text-base">
                How it works
              </Button>
            </a>
          </div>

          <div className="relative mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { k: "80%", v: "route overlap detected" },
              { k: "±20m", v: "flexible departure window" },
              { k: "1 tap", v: "join a matched group" },
              { k: "0", v: "random strangers" },
            ].map((s, i) => (
              <div
                key={s.v}
                className="surface-card p-5 opacity-0 animate-[fadeInUp_0.5s_ease_forwards] hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300"
                style={{ animationDelay: `${i * 120 + 300}ms` }}
              >
                <div className="text-3xl font-bold tracking-tighter bg-gradient-to-br from-[#ecf39e] to-[#90a955] bg-clip-text text-transparent">{s.k}</div>
                <div className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{s.v}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="border-t border-border/60 bg-surface/50">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How CampusPool works</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { icon: MapPin, title: "Post where you're going", body: "Set pickup, destination and a flexible time window. Takes 15 seconds.", step: 1 },
                { icon: Sparkles, title: "Get smart matches", body: "We score nearby students by pickup distance, route overlap, and departure time.", step: 2 },
                { icon: MessageCircle, title: "Chat and confirm", body: "Every matched group gets a private chat. Split the fare, meet at the gate, go.", step: 3 },
              ].map((f) => (
                <div key={f.title} className="surface-card relative p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                  <div className="absolute -top-3 left-5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {f.step}
                  </div>
                  <f.icon className="h-5 w-5 text-primary mt-2" />
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/60">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-20 md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-primary">Only for Allowed Campuses</div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Built for the people you actually go to class with.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Sign up with your college email. Every profile is verified, rated,
                and tied to a real student. No dashers, no drivers-of-nowhere.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, t: "Verified identities" },
                { icon: Users, t: "Ratings after every ride" },
                { icon: RouteIcon, t: "Route-overlap matching" },
                { icon: MessageCircle, t: "Private group chat" },
              ].map((c) => (
                <div key={c.t} className="surface-card flex items-center gap-3 p-4 hover:border-primary/40">
                  <c.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm">{c.t}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 bg-surface/50">
          <div className="mx-auto max-w-3xl px-5 py-20 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Your next ride is <span className="italic">already</span> leaving.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Join CampusPool with your college email and find a group in minutes.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/auth">
                <Button size="lg" className="h-12 px-8 text-base glow-primary">Create your account</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} CampusPool</span>
          <nav className="flex items-center gap-4" aria-label="Footer">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Contact</span>
          </nav>
          <span>Made for university campuses</span>
        </div>
      </footer>

      {/* Mobile sticky CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur p-3 sm:hidden">
        <Link href="/auth" className="block">
          <Button className="w-full h-11 text-base glow-primary">Get started — it's free</Button>
        </Link>
      </div>
    </div>
  );
}

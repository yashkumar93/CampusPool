import { Metadata } from "next";
import Link from "next/link";
import {
  Zap, Users, Bus, Sparkles, ShieldCheck, BarChart3, MapPin, ArrowRight, Leaf, IndianRupee,
  AlertTriangle, Check, X, ShieldAlert, Star, Compass
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
    <div className="min-h-screen bg-[#171e19] text-black">
      {/* Navigation */}
      <header className="sticky top-0 z-30 h-20 bg-[#ffe17c] border-b-2 border-black flex items-center">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-black border-2 border-black shadow-neo-sm">
              <Zap className="h-5 w-5 text-[#ffe17c] fill-current" />
            </div>
            <span className="font-heading text-2xl font-extrabold tracking-tighter">
              NXTPOOL
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 font-sans font-bold">
            <a href="#problem" className="hover:underline underline-offset-4">The Problem</a>
            <a href="#features" className="hover:underline underline-offset-4">Features</a>
            <a href="#how" className="hover:underline underline-offset-4">How it works</a>
            <a href="#personas" className="hover:underline underline-offset-4">Who it's for</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="font-sans font-bold hover:underline"
            >
              Sign in
            </Link>
            <Link
              href="/auth"
              className="inline-flex h-11 items-center justify-center rounded border-2 border-black bg-black px-5 py-2 text-sm font-bold text-white shadow-neo-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-[#ffe17c] border-b-2 border-black bg-dot-pattern py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-7 text-left space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-1 text-xs font-bold shadow-neo-sm">
              <Sparkles className="h-4 w-4 text-black fill-current" /> NEW: AI Route Matcher 2.0
            </span>
            
            <h1 className="font-heading text-5xl sm:text-8xl font-extrabold tracking-tighter leading-[0.9] text-black">
              One App.<br />
              <span style={{ WebkitTextStroke: "2px black", color: "transparent" }}>Every Ride.</span><br />
              Every Student.
            </h1>
            
            <p className="font-sans font-medium text-lg text-black max-w-xl leading-relaxed">
              NXTPOOL is an AI-powered campus mobility platform connecting verified students through intelligent ride sharing, live public transport routes, and smart fare comparison.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/auth"
                className="btn-neo-primary inline-flex h-14 items-center justify-center px-8 text-base"
              >
                Get Started Now
              </Link>
              <Link
                href="/auth"
                className="btn-neo-secondary inline-flex h-14 items-center justify-center px-8 text-base"
              >
                Explore Demo
              </Link>
            </div>
          </div>

          {/* Right Column (Browser Mockup) */}
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-2 bg-black rounded-2xl opacity-10 blur-xl" />
            <div className="relative bg-white border-2 border-black rounded-xl shadow-neo-xl overflow-hidden animate-float">
              {/* Browser Header */}
              <div className="bg-black h-10 px-4 flex items-center justify-between border-b-2 border-black">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-[10px] font-sans font-bold text-neutral-400">nxtpool.com/dashboard</span>
                <span className="w-12" />
              </div>
              {/* Browser Content */}
              <div className="p-5 bg-neutral-50 space-y-4">
                {/* Mock Map Image */}
                <div className="border-2 border-black rounded-lg overflow-hidden h-44 relative bg-[#b7c6c2]">
                  <img
                    src="/hero-campus.png"
                    alt="Campus Match Map"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-white border-2 border-black px-2 py-0.5 rounded text-[10px] font-bold shadow-neo-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#ff5f57]" /> Active Routing
                  </div>
                </div>
                {/* Sage Panel card */}
                <div className="bg-[#b7c6c2] border-2 border-black p-3.5 rounded-lg shadow-neo-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider bg-white border border-black px-1.5 py-0.5 rounded">MATCH FOUND</span>
                    <span className="text-xs font-extrabold text-black">₹45 saved</span>
                  </div>
                  <div className="text-xs font-sans font-bold text-black flex items-center gap-2">
                    <Users className="w-4 h-4" /> 3 peers matching your path (VIT-AP Main Gate)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Marquee */}
      <section className="bg-[#171e19] border-b-2 border-black overflow-hidden py-5 flex items-center">
        <div className="animate-marquee whitespace-nowrap flex gap-12">
          {[1, 2].map((group) => (
            <div key={group} className="flex gap-16 items-center text-[#b7c6c2] text-2xl sm:text-3xl font-heading font-extrabold tracking-tight opacity-55">
              <span>VIT-AP UNIVERSITY</span>
              <span>VIT VELLORE</span>
              <span>SRM KATTANKULATHUR</span>
              <span>IIT MADRAS</span>
              <span>ANNA UNIVERSITY</span>
              <span>NXTWAVE CAMPUS</span>
            </div>
          ))}
        </div>
      </section>

      {/* Problem vs Solution */}
      <section id="problem" className="bg-white py-20 border-b-2 border-black">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tighter">
              Not another cab app. <span className="gradient-text">A mobility ecosystem.</span>
            </h2>
            <p className="font-sans font-semibold text-neutral-500">
              Students juggle Maps, Uber, Ola, Rapido, bus schedules, and WhatsApp groups just to reach class. NXTPOOL brings it all together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Problem card */}
            <div className="bg-neutral-50 border-2 border-dashed border-gray-400 rounded-3xl p-8 opacity-75 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-10 w-10 bg-red-100 border-2 border-red-500 rounded-lg flex items-center justify-center text-red-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-2xl font-bold">The Chaos We Face</h3>
                <ul className="space-y-3 font-sans font-bold text-sm text-neutral-600">
                  <li className="flex items-center gap-2.5">
                    <X className="w-4 h-4 text-red-500 shrink-0" /> Coordinate with strangers on split apps
                  </li>
                  <li className="flex items-center gap-2.5">
                    <X className="w-4 h-4 text-red-500 shrink-0" /> Unreliable bus arrival estimations
                  </li>
                  <li className="flex items-center gap-2.5">
                    <X className="w-4 h-4 text-red-500 shrink-0" /> Safety concerns with random co-passengers
                  </li>
                  <li className="flex items-center gap-2.5">
                    <X className="w-4 h-4 text-red-500 shrink-0" /> Fragmented pricing across multiple services
                  </li>
                </ul>
              </div>
              <div className="mt-8 text-xs font-bold text-red-500">STRESSFUL COMMUTES DAILY</div>
            </div>

            {/* Solution card */}
            <div className="bg-[#ffe17c] border-2 border-black rounded-3xl p-8 shadow-neo-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-10 w-10 bg-white border-2 border-black rounded-lg flex items-center justify-center text-black">
                  <Sparkles className="w-5 h-5 fill-current" />
                </div>
                <h3 className="font-heading text-2xl font-bold">The NXTPOOL Way</h3>
                <ul className="space-y-3 font-sans font-bold text-sm text-black">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-black stroke-[3px] shrink-0" /> Match only with verified peers from your org
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-black stroke-[3px] shrink-0" /> AI routes matching your exact timetable schedules
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-black stroke-[3px] shrink-0" /> Integrated security triggers & female-only options
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-black stroke-[3px] shrink-0" /> Complete fare splits and navigation in one app
                  </li>
                </ul>
              </div>
              <div className="mt-8 text-xs font-bold uppercase tracking-wider text-black">SMART CAMPUS MOBILITY</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="bg-[#ffe17c] border-b-2 border-black py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tighter">
              A complete mobility ecosystem
            </h2>
            <p className="font-sans font-bold text-neutral-800">
              NXTPOOL brings intelligence to your daily commute with tools designed specifically for students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white border-2 border-black p-6 rounded-xl shadow-neo-md group hover:-translate-y-1 hover:shadow-neo-lg transition-all duration-200">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded border-2 border-black bg-[#b7c6c2] group-hover:bg-[#ffe17c] transition-colors duration-200">
                  <f.icon className="h-5 w-5 text-black" />
                </div>
                <h3 className="font-heading text-xl font-bold text-black">{f.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 font-sans leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works (Dark Mode) */}
      <section id="how" className="bg-[#171e19] py-20 border-b-2 border-black text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tighter text-white">
              How it works
            </h2>
            <p className="font-sans font-bold text-[#b7c6c2]">
              Start pooling in less than a minute. Simple steps from verification to arrival.
            </p>
          </div>

          <div className="relative flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4">
            {/* Connection Line */}
            <div className="absolute top-[48px] left-[10%] right-[10%] h-1 bg-[#272727] hidden md:block z-0" />

            {[
              { step: 1, title: "Register with Org Email", desc: "Sign up using your verified college or corporate email address to unlock your exclusive local network.", color: "border-[#b7c6c2] text-[#b7c6c2]" },
              { step: 2, title: "Post or Request a Ride", desc: "Input your routing paths and departure window. Let our matching engine query active matched groups.", color: "border-[#ffe17c] text-[#ffe17c]" },
              { step: 3, title: "Ride & Auto-Complete", desc: "Coordinate in the private group chat and track driver paths. The ride closes dynamically when you reach the target.", color: "border-white text-white" }
            ].map((s) => (
              <div key={s.step} className="flex-1 text-center relative z-10 space-y-4 max-w-xs">
                <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#171e19] border-4 ${s.color} font-heading text-3xl font-extrabold shadow-neo-sm`}>
                  {s.step}
                </div>
                <h3 className="font-heading text-lg font-bold text-white">{s.title}</h3>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Personas */}
      <section id="personas" className="bg-white py-20 border-b-2 border-black">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tighter">
              Built for every kind of commuter
            </h2>
            <p className="font-sans font-semibold text-neutral-500">
              Whether you travel once a week or twice a day, there's a space for you in the NxtPool community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Sage */}
            <div className="bg-[#b7c6c2] border-2 border-black p-8 rounded-xl flex flex-col justify-between">
              <div className="space-y-4">
                <span className="inline-block bg-white border border-black px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase">PASSENGER</span>
                <h3 className="font-heading text-2xl font-bold text-black">The Daily Commuter</h3>
                <p className="text-xs text-neutral-800 leading-relaxed font-sans font-medium">
                  Students commuting to college from local railway stations, transits, or hostels. NXTPOOL matches you with drivers traveling the exact same direction, saving you high individual cab fares.
                </p>
              </div>
              <div className="mt-8 text-xs font-bold uppercase tracking-wider text-black">SAVE 70% ON FARES</div>
            </div>

            {/* Card 2: Yellow */}
            <div className="bg-[#ffe17c] border-2 border-black p-8 rounded-xl shadow-neo-lg flex flex-col justify-between">
              <div className="space-y-4">
                <span className="inline-block bg-white border border-black px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase">DRIVER</span>
                <h3 className="font-heading text-2xl font-bold text-black">The Vehicle Host</h3>
                <p className="text-xs text-neutral-800 leading-relaxed font-sans font-medium">
                  Students driving bikes or cars to campus. Monetize your empty seats, offset fuel charges, and commute with classmates who share similar schedules.
                </p>
              </div>
              <div className="mt-8 text-xs font-bold uppercase tracking-wider text-black">OFFSET FUEL COST</div>
            </div>

            {/* Card 3: Dark Gray */}
            <div className="bg-[#272727] text-white border-2 border-black p-8 rounded-xl flex flex-col justify-between">
              <div className="space-y-4">
                <span className="inline-block bg-white border border-black text-black px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase">CAB SHARER</span>
                <h3 className="font-heading text-2xl font-bold text-white">The Weekend Traveler</h3>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans font-medium">
                  Students heading to airports or nearby city circles during weekends. Create a group request, find fellow travelers, and coordinate cab splits directly.
                </p>
              </div>
              <div className="mt-8 text-xs font-bold uppercase tracking-wider text-[#ffe17c]">CO-TRAVEL EASILY</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#b7c6c2] py-20 border-b-2 border-black">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tighter">
              Loved by campus communities
            </h2>
            <p className="font-sans font-bold text-neutral-800">
              Here is what verified students are saying about their NxtPool experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Rahul Sharma", role: "VIT-AP Student", review: "NXTPOOL completely replaced the chaotic WhatsApp coordination groups. I easily share rides to the Vijayawada Railway Station every Friday." },
              { name: "Divya K.", role: "NxtWave Student", review: "The email verification gives me peace of mind. I only pool with girls from my own cohort, and the fare division makes commuting highly affordable." },
              { name: "Siddharth R.", role: "SRM Student", review: "I drive my bike to campus daily. Hosting pools on NXTPOOL has allowed me to offset my monthly fuel cost while meeting awesome classmates." }
            ].map((t, idx) => (
              <div key={idx} className="bg-white border-2 border-black p-6 flex flex-col justify-between rounded-tr-[1.5rem] rounded-bl-[1.5rem] rounded-tl-none rounded-br-none shadow-neo-md hover:shadow-neo-lg transition-shadow duration-200">
                <div className="space-y-4">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-[#ffbc2e] text-[#ffbc2e]" />
                    ))}
                  </div>
                  <p className="text-xs text-neutral-600 font-sans italic leading-relaxed">"{t.review}"</p>
                </div>
                <div className="mt-6 border-t border-gray-100 pt-4">
                  <div className="font-heading text-sm font-bold text-black">{t.name}</div>
                  <div className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-wider">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#ffe17c] py-20 text-center border-b-2 border-black">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
          <h2 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tighter">
            Travel smarter from <span style={{ WebkitTextStroke: "2.5px black", color: "transparent" }}>day one</span>
          </h2>
          <p className="font-sans font-bold text-neutral-800 max-w-md mx-auto text-sm leading-relaxed">
            Join with your college email and get AI-matched with students on your exact route in minutes.
          </p>
          <div className="pt-2">
            <Link
              href="/auth"
              className="btn-neo-primary inline-flex h-14 items-center justify-center px-10 text-base"
            >
              Join NXTPOOL <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#171e19] text-white border-t border-black">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#ffe17c] border border-black shadow-neo-sm">
                <Zap className="h-4 w-4 text-black fill-current" />
              </div>
              <span className="font-heading text-lg font-bold text-white">NXTPOOL</span>
            </div>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Premium, verified ride sharing and transit ecosystem for campus and corporate communities.
            </p>
          </div>
          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs uppercase tracking-wider text-[#b7c6c2]">COMMUNITY</h4>
            <ul className="text-xs text-neutral-400 font-sans space-y-2">
              <li className="hover:text-white cursor-pointer transition-colors">VIT-AP Hub</li>
              <li className="hover:text-white cursor-pointer transition-colors">VIT Vellore Hub</li>
              <li className="hover:text-white cursor-pointer transition-colors">NxtWave Cohorts</li>
              <li className="hover:text-white cursor-pointer transition-colors">Partner Orgs</li>
            </ul>
          </div>
          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs uppercase tracking-wider text-[#b7c6c2]">RESOURCES</h4>
            <ul className="text-xs text-neutral-400 font-sans space-y-2">
              <li className="hover:text-white cursor-pointer transition-colors">Safety Guides</li>
              <li className="hover:text-white cursor-pointer transition-colors">Fare Divisions</li>
              <li className="hover:text-white cursor-pointer transition-colors">Platform Status</li>
              <li className="hover:text-white cursor-pointer transition-colors">Help Support</li>
            </ul>
          </div>
          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs uppercase tracking-wider text-[#b7c6c2]">LEGAL</h4>
            <ul className="text-xs text-neutral-400 font-sans space-y-2">
              <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              <li className="hover:text-white cursor-pointer transition-colors">Code of Conduct</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#272727] bg-[#121713] py-6 text-center text-xs text-neutral-500 font-sans flex flex-col sm:flex-row justify-between items-center max-w-6xl mx-auto px-4 sm:px-6">
          <span>© 2026 NXTPOOL · Campus Mobility. All rights reserved.</span>
          <span className="mt-2 sm:mt-0 text-[10px] text-neutral-600">Built in accordance with Neo-Brutalist design guidelines.</span>
        </div>
      </footer>
    </div>
  );
}

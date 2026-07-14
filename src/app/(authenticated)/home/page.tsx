"use client";

import Link from "next/link";
import { useSuspenseQuery, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { listMyRides, listMyGroups, listLiveRides, listCollegeClassmates, getMyProfile } from "@/lib/rides.queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, ArrowRight, Clock, Plus, Users, MessageCircle,
  Car, UserRound, Radio, LocateFixed, ShieldAlert, Star,
  CirclePlus, Search, GitCompare, Navigation, IndianRupee,
  Leaf, Route, Sparkles, Bus, TrendingUp, ChevronRight, Zap,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePreviewSheet } from "@/components/ProfilePreviewSheet";

/* ────────────── helpers ────────────── */

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });
}

function relTime(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const mins = Math.round(diff / 60_000);
  if (mins < -1) return `${-mins}m ago`;
  if (mins < 1) return "now";
  if (mins < 60) return `in ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `in ${h}h ${m}m` : `in ${h}h`;
}

/* ────────────── quick-action data ────────────── */

const quickActions = [
  { label: "Offer Ride", icon: CirclePlus, href: "/rides/new?role=driver", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-400" },
  { label: "Find Ride", icon: Search, href: "/rides/new?role=passenger", color: "from-sky-500/20 to-sky-500/5", iconColor: "text-sky-400" },
  { label: "Bus Routes", icon: Bus, href: "/bus-routes", color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-400" },
  { label: "Live Map", icon: Navigation, href: "/map", color: "from-violet-500/20 to-violet-500/5", iconColor: "text-violet-400" },
] as const;

/* ────────────── stat card config ────────────── */

const statsConfig = [
  { icon: IndianRupee, label: "Money saved", fallback: "₹0", gradient: "from-emerald-500/15 to-transparent", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400" },
  { icon: Leaf, label: "Carbon saved", fallback: "0 kg", gradient: "from-green-500/15 to-transparent", iconBg: "bg-green-500/15", iconColor: "text-green-400" },
  { icon: Car, label: "Trips this month", fallback: "0", gradient: "from-sky-500/15 to-transparent", iconBg: "bg-sky-500/15", iconColor: "text-sky-400" },
  { icon: Route, label: "Favorite route", fallback: "--", gradient: "from-violet-500/15 to-transparent", iconBg: "bg-violet-500/15", iconColor: "text-violet-400" },
] as const;


/* ────────────────────────────────────────────── */
/*                  AI BANNER                      */
/* ────────────────────────────────────────────── */

function AiBanner() {
  const { data: myRides } = useQuery({
    queryKey: ["my-rides"],
    queryFn: listMyRides,
  });

  const latestRide = myRides && myRides.length > 0 ? myRides[0] : null;
  const viewMatchesHref = latestRide ? `/rides/${latestRide.id}` : "/rides/new";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#1DB954]/25 bg-gradient-to-br from-[#1DB954]/10 via-[#1DB954]/5 to-transparent p-5 transition-all duration-300 hover:border-[#1DB954]/40 group">
      {/* Animated glow orb */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#1DB954]/8 blur-2xl transition-all duration-500 group-hover:bg-[#1DB954]/15 group-hover:scale-110" />
      <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-[#1DB954]/5 blur-xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1DB954]/20">
            <Sparkles className="h-3.5 w-3.5 text-[#1DB954]" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1DB954]">
            AI Smart Recommendation
          </span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed max-w-md">
          Find matches heading your direction. AI-powered suggestions available when you post a ride.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Link href={viewMatchesHref}>
            <Button size="sm" className="h-8 rounded-lg bg-[#1DB954] text-black font-bold hover:bg-[#1DB954]/90 text-xs px-4 shadow-lg shadow-[#1DB954]/20 transition-all hover:shadow-[#1DB954]/30 hover:scale-[1.02] active:scale-[0.98]">
              <Zap className="h-3 w-3 mr-1.5" />
              View matches
            </Button>
          </Link>
          <Link href="/map">
            <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs px-4 border-[#1DB954]/30 text-[#1DB954] hover:bg-[#1DB954]/10 transition-all">
              Compare all options
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────── */
/*                  PAGE ROOT                      */
/* ────────────────────────────────────────────── */

export default function HomePage() {
  const geo = useGeolocation();
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);

  return (
    <div className="space-y-7">
      {/* ── 1. Greeting + Quick Actions ── */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 animate-fade-in-up">
        {/* left */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hey there 👋</h1>
          <p className="mt-1.5 text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Your Campus
          </p>
        </div>

        {/* right – quick actions */}
        <div className="flex items-center gap-3">
          {quickActions.map((a, i) => (
            <Link
              key={a.label}
              href={a.href}
              className="group flex flex-col items-center gap-1.5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${a.color} border border-border/30 transition-all duration-200 group-hover:scale-105 group-hover:border-primary/25 group-hover:shadow-lg group-hover:shadow-black/20`}>
                <a.icon className={`h-5 w-5 ${a.iconColor} transition-colors`} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* optional geo banner */}
      <GeoBanner geo={geo} />

      {/* ── 2. AI Smart Recommendation Banner ── */}
      <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <AiBanner />
      </div>

      {/* ── 3. Stats Cards Row ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        {statsConfig.map((s, i) => (
          <div
            key={s.label}
            className={`relative overflow-hidden rounded-xl border border-border/30 bg-card p-4 transition-all duration-200 hover:border-border/60 hover:shadow-lg hover:shadow-black/10 group`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className="relative">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.iconBg} mb-3`}>
                <s.icon className={`h-4 w-4 ${s.iconColor}`} />
              </div>
              <div className="text-xl font-bold tracking-tight">{s.fallback}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">{s.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ── 4. Two-Column: Classmates + Student Rides ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
        {/* left – Registered Classmates */}
        <div>
          <Suspense fallback={<ClassmatesSkeleton />}>
            <ClassmatesSection onPreviewProfile={setPreviewUserId} />
          </Suspense>
        </div>

        {/* right – Student Rides Near You */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15">
                <Radio className="h-3 w-3 text-sky-400" />
              </div>
              <h2 className="text-sm font-bold">Student Rides Near You</h2>
            </div>
            <Link href="/map" className="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
            <Suspense fallback={<LiveRidesSkeleton />}>
              <LiveRides onPreviewProfile={setPreviewUserId} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── 5. Your Rides + Your Groups ── */}
      <div className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <Suspense fallback={<RidesSkeleton />}>
          <MyRides />
        </Suspense>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <Suspense fallback={<GroupsSkeleton />}>
          <MyGroups />
        </Suspense>
      </div>

      <ProfilePreviewSheet
        userId={previewUserId}
        open={!!previewUserId}
        onOpenChange={(open) => {
          if (!open) setPreviewUserId(null);
        }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*              SUB-COMPONENTS                     */
/* ────────────────────────────────────────────── */

function GeoBanner({ geo }: { geo: ReturnType<typeof useGeolocation> }) {
  if (geo.status === "granted") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-400 font-medium">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
          <LocateFixed className="h-3 w-3 text-emerald-400" />
        </div>
        Location on — we&apos;ll suggest nearby pickups.
      </div>
    );
  }
  if (geo.status === "denied" || geo.status === "error" || geo.status === "unsupported") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-border/30 bg-card px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
          <ShieldAlert className="h-3 w-3 text-primary" />
        </div>
        <span className="flex-1">Enable location for faster pickup matches.</span>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-primary hover:bg-primary/10" onClick={geo.request}>
          Turn on
        </Button>
      </div>
    );
  }
  return null;
}

/* ── Skeletons ── */

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-border/30 bg-card p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 rounded-lg shimmer" />
        <div className="h-5 w-12 rounded-lg shimmer" />
        <div className="ml-auto h-4 w-20 rounded-lg shimmer" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded-full shimmer" />
        <div className="h-4 flex-1 rounded-lg shimmer" />
        <div className="h-4 w-4 rounded shimmer" />
        <div className="h-4 flex-1 rounded-lg shimmer" />
      </div>
    </div>
  );
}

function LiveRidesSkeleton() {
  return (
    <div className="p-4 space-y-2">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

function RidesSkeleton() {
  return (
    <section className="rounded-xl border border-border/30 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 rounded-lg shimmer" />
        <div className="h-8 w-16 rounded-lg shimmer" />
      </div>
      <div className="mt-3 space-y-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  );
}

function GroupsSkeleton() {
  return (
    <section className="rounded-xl border border-border/30 bg-card p-5">
      <div className="h-6 w-36 rounded-lg shimmer" />
      <div className="mt-3 space-y-2">
        <SkeletonCard />
      </div>
    </section>
  );
}

/* ── Live Rides ── */

function LiveRides({ onPreviewProfile }: { onPreviewProfile: (id: string) => void }) {
  const qc = useQueryClient();
  const { data: rides } = useSuspenseQuery(
    queryOptions({ queryKey: ["live-rides"], queryFn: () => listLiveRides(), refetchInterval: 30_000 }),
  );

  useEffect(() => {
    const channel = supabase
      .channel("live-rides-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, () => {
        qc.invalidateQueries({ queryKey: ["live-rides"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  if (rides.length === 0) {
    return (
      <div className="flex flex-col items-center p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/15 to-transparent mb-3">
          <Car className="h-6 w-6 text-sky-400" />
        </div>
        <div className="text-sm font-semibold">No live rides right now</div>
        <p className="mt-1.5 text-xs text-muted-foreground max-w-[220px]">Post one and be first — matches ping instantly.</p>
        <Link href="/rides/new" className="mt-4">
          <Button size="sm" className="gap-1.5 rounded-lg font-bold h-8 px-4 shadow-lg shadow-primary/15">
            <Plus className="h-3.5 w-3.5" /> Post a ride
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/15">
      {rides.map((r) => {
        const name = r.profile?.full_name ?? "Student";
        const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

        return (
          <li key={r.id}>
            <Link
              href={`/rides/${r.id}`}
              className="flex items-center gap-3 px-4 py-3.5 transition-all duration-200 hover:bg-white/[0.03] group"
            >
              {/* avatar */}
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPreviewProfile(r.creator_id);
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 text-primary text-xs font-bold border border-primary/15 hover:border-primary/30 hover:scale-105 transition-all cursor-pointer"
              >
                {initials}
              </div>

              {/* middle */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <span 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onPreviewProfile(r.creator_id);
                    }}
                    className="truncate hover:underline hover:text-primary transition-colors cursor-pointer"
                  >
                    {name}
                  </span>
                  {r.profile && (r.profile.rating_count ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground font-normal">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {Number(r.profile.rating_avg).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary/60 shrink-0" />
                  <span className="truncate">{r.pickup_label}</span>
                  <ArrowRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground/50" />
                  <span className="truncate">{r.dest_label}</span>
                </div>
              </div>

              {/* right */}
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <Badge className={`text-[10px] font-bold px-2 py-0.5 ${r.role === "driver" ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15" : "bg-sky-500/15 text-sky-400 hover:bg-sky-500/15"}`}>
                  {r.role === "driver" ? "Driver" : "Rider"}
                </Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {relTime(r.depart_at)}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ── My Rides ── */

function MyRides() {
  const { data: rides } = useSuspenseQuery(
    queryOptions({ queryKey: ["my-rides"], queryFn: () => listMyRides() })
  );

  return (
    <section className="rounded-xl border border-border/30 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
            <Car className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-base font-bold">Your rides</h2>
          {rides.length > 0 && (
            <Badge variant="secondary" className="font-normal text-[10px] px-1.5 py-0">{rides.length}</Badge>
          )}
        </div>
        <Link href="/rides/new">
          <Button size="sm" variant="ghost" className="gap-1.5 h-8 text-xs font-semibold hover:bg-primary/10 hover:text-primary">
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </Link>
      </div>
      {rides.length === 0 ? (
        <div className="mt-4 flex flex-col items-center p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-transparent mb-3">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-sm font-semibold">No rides yet</div>
          <p className="mt-1.5 text-xs text-muted-foreground max-w-[260px]">Post your first ride and find classmates heading the same way.</p>
          <Link href="/rides/new" className="mt-4">
            <Button size="sm" variant="outline" className="gap-1.5 rounded-lg h-8 px-4">
              <Plus className="h-3.5 w-3.5" /> Create ride
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {rides.map((r) => {
            const isActive = r.status === "open" || r.status === "matched";
            return (
              <li key={r.id}>
                <Link
                  href={`/rides/${r.id}`}
                  className={`block rounded-xl border p-4 transition-all duration-200 group ${isActive ? "border-border/30 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5" : "border-border/20 opacity-70 hover:opacity-100"}`}
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge className={`font-semibold text-[10px] px-2 ${r.role === "driver" ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15" : "bg-sky-500/15 text-sky-400 hover:bg-sky-500/15"}`}>
                      {r.role === "driver" ? "Offering" : "Requesting"}
                    </Badge>
                    <Badge variant="outline" className={`font-medium capitalize text-[10px] ${isActive ? "border-emerald-500/30 text-emerald-400" : "border-border/40"}`}>
                      {r.status}
                    </Badge>
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px]" title={formatTime(r.depart_at)}>
                      <Clock className="h-3 w-3" /> {formatTime(r.depart_at)}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate font-medium">{r.pickup_label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <span className="truncate">{r.dest_label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ── My Groups ── */

function MyGroups() {
  const { data: groups } = useSuspenseQuery(
    queryOptions({ queryKey: ["my-groups"], queryFn: () => listMyGroups() }),
  );
  const [unread, setUnread] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!groups.length) return;
    try {
      const raw = localStorage.getItem("cp:unread");
      if (raw) setUnread(JSON.parse(raw));
    } catch { /* ignore */ }

    const channel = supabase
      .channel("home-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const gid = (payload.new as { group_id?: string }).group_id;
          if (!gid || !groups.some((g) => g.id === gid)) return;
          setUnread((prev) => {
            const next = { ...prev, [gid]: (prev[gid] ?? 0) + 1 };
            try { localStorage.setItem("cp:unread", JSON.stringify(next)); } catch { /* ignore */ }
            return next;
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groups]);

  function clearUnread(id: string) {
    setUnread((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      try { localStorage.setItem("cp:unread", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  if (!groups.length) return null;

  return (
    <section className="rounded-xl border border-border/30 bg-card p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15">
          <Users className="h-3.5 w-3.5 text-violet-400" />
        </div>
        <h2 className="text-base font-bold">Your ride groups</h2>
        <Badge variant="secondary" className="font-normal text-[10px] px-1.5 py-0">{groups.length}</Badge>
      </div>
      <ul className="mt-3 space-y-2">
        {groups.map((g) => {
          const hasUnread = !!unread[g.id];
          return (
            <li key={g.id}>
              <Link
                href={`/groups/${g.id}`}
                onClick={() => clearUnread(g.id)}
                className={`block rounded-xl border p-4 transition-all duration-200 group ${hasUnread ? "border-primary/30 bg-primary/[0.03]" : "border-border/30"} hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5`}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="capitalize text-[10px] font-medium border-border/40">{g.status}</Badge>
                  {hasUnread && (
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary text-[10px] font-bold animate-pulse">
                      {unread[g.id]} new
                    </Badge>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px]" title={formatTime(g.depart_at)}>
                    <Clock className="h-3 w-3" /> {formatTime(g.depart_at)}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate font-medium">{g.pickup_label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  <span className="truncate">{g.dest_label}</span>
                  <MessageCircle className="ml-auto h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ── Classmates Section ── */

function ClassmatesSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 w-6 rounded-md shimmer" />
        <div className="h-5 w-36 rounded-lg shimmer" />
      </div>
      <div className="rounded-xl border border-border/30 bg-card p-5 space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

function ClassmatesSection({ onPreviewProfile }: { onPreviewProfile: (id: string) => void }) {
  const { data: profile } = useSuspenseQuery(
    queryOptions({ queryKey: ["my-profile"], queryFn: () => getMyProfile() })
  );
  const { data: classmates } = useSuspenseQuery(
    queryOptions({ queryKey: ["college-classmates"], queryFn: () => listCollegeClassmates() })
  );

  const collegeName = profile?.college || "your college";

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15">
          <Users className="h-3 w-3 text-amber-400" />
        </div>
        <h2 className="text-sm font-bold truncate max-w-[260px]" title={`Classmates at ${collegeName}`}>
          Classmates at {collegeName}
        </h2>
        <Badge variant="secondary" className="ml-0.5 font-normal text-[10px] px-1.5 py-0">{classmates.length}</Badge>
      </div>
      <div className="rounded-xl border border-border/30 bg-card overflow-hidden max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
        {classmates.length === 0 ? (
          <div className="flex flex-col items-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/15 to-transparent mb-3">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <p className="text-xs text-muted-foreground">No other students registered from your college yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/10">
            {classmates.map((c) => {
              const initials = (c.full_name ?? "Student").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]">
                  <div 
                    onClick={() => c.id && onPreviewProfile(c.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/25 to-secondary/10 text-secondary text-[11px] font-bold border border-secondary/20 hover:scale-105 transition-all cursor-pointer"
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold flex items-center gap-1.5">
                      <span 
                        onClick={() => c.id && onPreviewProfile(c.id)}
                        className="truncate hover:underline hover:text-primary transition-colors cursor-pointer"
                      >
                        {c.full_name}
                      </span>
                      {c.verified && (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#1DB954]/15 text-[#1DB954] text-[8px] font-bold shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {c.department || "Student"}{c.year ? ` · ${c.year} Year` : ""}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

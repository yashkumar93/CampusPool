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
  Leaf, Route, Sparkles, Bus,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";

/* ────────────── helpers (unchanged) ────────────── */

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
  { label: "Offer Ride", icon: CirclePlus, href: "/rides/new?role=driver" },
  { label: "Find Ride", icon: Search, href: "/rides/new?role=passenger" },
  { label: "Bus Routes", icon: Bus, href: "/bus-routes" },
  { label: "Live Map", icon: Navigation, href: "/map" },
] as const;



/* ────────────────────────────────────────────── */
/*                  PAGE ROOT                     */
/* ────────────────────────────────────────────── */

function AiBanner() {
  const { data: myRides } = useQuery({
    queryKey: ["my-rides"],
    queryFn: listMyRides,
  });

  const latestRide = myRides && myRides.length > 0 ? myRides[0] : null;
  const viewMatchesHref = latestRide ? `/rides/${latestRide.id}` : "/rides/new";

  return (
    <section className="rounded-xl border-l-4 border-[#1DB954] bg-[#1DB954]/8 p-5">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-[#1DB954]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1DB954]">
          AI Smart Recommendation
        </span>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        Find matches heading your direction. AI-powered suggestions available when you post a ride.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Link href={viewMatchesHref}>
          <Button size="sm" className="h-7 rounded-lg bg-[#1DB954] text-white hover:bg-[#1DB954]/90 text-xs px-3">
            View matches
          </Button>
        </Link>
        <Link href="/map">
          <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs px-3 border-[#1DB954]/40 text-[#1DB954] hover:bg-[#1DB954]/10">
            Compare all options
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  const geo = useGeolocation();

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ── 1. Greeting + Quick Actions ── */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* left */}
        <div>
          <h1 className="text-2xl font-bold">Hey there 👋</h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            Your Campus
          </div>
        </div>

        {/* right – quick actions */}
        <div className="flex items-center gap-3">
          {quickActions.map((a) => (
            <Link key={a.label} href={a.href} className="group flex flex-col items-center gap-1.5">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border/40 bg-card transition hover:border-primary/30">
                <a.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[10px] text-muted-foreground">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* optional geo banner (preserved) */}
      <GeoBanner geo={geo} />

      {/* ── 2. AI Smart Recommendation Banner ── */}
      <AiBanner />

      {/* ── 3. Stats Cards Row ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: IndianRupee, value: "₹0", label: "Money saved" },
          { icon: Leaf, value: "0 kg", label: "Carbon saved" },
          { icon: Car, value: "0", label: "Trips this month" },
          { icon: Route, value: "--", label: "Favorite route" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/40 bg-card p-5">
            <s.icon className="h-5 w-5 text-muted-foreground mb-3" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── 4. Two-Column: Registered Classmates + Student Rides ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* left – Registered Classmates */}
        <div>
          <Suspense fallback={<ClassmatesSkeleton />}>
            <ClassmatesSection />
          </Suspense>
        </div>

        {/* right – Student Rides Near You */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Student Rides Near You</h2>
            <Link href="/rides" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="rounded-xl border border-border/40 bg-card">
            <Suspense fallback={<LiveRidesSkeleton />}>
              <LiveRides />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── 5. Your Rides + Your Groups ── */}
      <div className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
        <Suspense fallback={<RidesSkeleton />}>
          <MyRides />
        </Suspense>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <Suspense fallback={<GroupsSkeleton />}>
          <MyGroups />
        </Suspense>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*              SUB-COMPONENTS                    */
/* ────────────────────────────────────────────── */

function GeoBanner({ geo }: { geo: ReturnType<typeof useGeolocation> }) {
  if (geo.status === "granted") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success-foreground">
        <LocateFixed className="h-3.5 w-3.5 text-success" />
        Location on — we&apos;ll suggest nearby pickups.
      </div>
    );
  }
  if (geo.status === "denied" || geo.status === "error" || geo.status === "unsupported") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
        <ShieldAlert className="h-3.5 w-3.5 text-primary" />
        <span className="flex-1">Enable location for faster pickup matches.</span>
        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={geo.request}>
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
    <div className={`rounded-xl border border-border/40 bg-card p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 rounded shimmer" />
        <div className="h-5 w-12 rounded shimmer" />
        <div className="ml-auto h-4 w-20 rounded shimmer" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded-full shimmer" />
        <div className="h-4 flex-1 rounded shimmer" />
        <div className="h-4 w-4 rounded shimmer" />
        <div className="h-4 flex-1 rounded shimmer" />
      </div>
    </div>
  );
}

function LiveRidesSkeleton() {
  return (
    <div className="p-5 space-y-3">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

function RidesSkeleton() {
  return (
    <section className="rounded-xl border border-border/40 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 rounded shimmer" />
        <div className="h-8 w-16 rounded shimmer" />
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
    <section className="rounded-xl border border-border/40 bg-card p-5">
      <div className="h-6 w-36 rounded shimmer" />
      <div className="mt-3 space-y-2">
        <SkeletonCard />
      </div>
    </section>
  );
}

/* ── Live Rides (data-fetching preserved, new card layout) ── */

function LiveRides() {
  const qc = useQueryClient();
  const { data: rides } = useSuspenseQuery(
    queryOptions({ queryKey: ["live-rides"], queryFn: () => listLiveRides(), refetchInterval: 30_000 }),
  );

  // Realtime: refresh when any open ride changes.
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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
          <Car className="h-6 w-6 text-primary" />
        </div>
        <div className="text-sm font-medium">No live rides right now</div>
        <p className="mt-1 text-xs text-muted-foreground">Post one and be first — matches ping instantly.</p>
        <Link href="/rides/new" className="mt-3">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Post a ride
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/20">
      {rides.map((r) => {
        const name = r.profile?.full_name ?? "Student";
        const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

        return (
          <li key={r.id}>
            <Link
              href={`/rides/${r.id}`}
              className="flex items-center gap-3 px-5 py-4 transition hover:bg-muted/30"
            >
              {/* avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                {initials}
              </div>

              {/* middle */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <span className="truncate">{name}</span>
                  {r.profile && (r.profile.rating_count ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {Number(r.profile.rating_avg).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {r.pickup_label} → {r.dest_label}
                </div>
              </div>

              {/* right */}
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-primary">
                  {r.role === "driver" ? "Driver" : "Rider"}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  <Clock className="inline h-2.5 w-2.5 mr-0.5" />
                  {relTime(r.depart_at)}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ── My Rides (wrapped in themed card) ── */

function MyRides() {
  const { data: rides } = useSuspenseQuery(
    queryOptions({ queryKey: ["my-rides"], queryFn: () => listMyRides() })
  );

  return (
    <section className="rounded-xl border border-border/40 bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your rides</h2>
        <Link href="/rides/new">
          <Button size="sm" variant="ghost" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </Link>
      </div>
      {rides.length === 0 ? (
        <div className="mt-3 flex flex-col items-center p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <MapPin className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-sm font-medium">No rides yet</div>
          <p className="mt-1 text-xs text-muted-foreground">Post your first ride and find classmates heading the same way.</p>
          <Link href="/rides/new" className="mt-3">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Create ride
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {rides.map((r) => (
            <li key={r.id}>
              <Link
                href={`/rides/${r.id}`}
                className="block rounded-lg border border-border/30 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/20"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="font-normal">
                    {r.role === "driver" ? "Offering" : "Requesting"}
                  </Badge>
                  <Badge variant="outline" className="font-normal capitalize">{r.status}</Badge>
                  <span className="ml-auto inline-flex items-center gap-1" title={formatTime(r.depart_at)}>
                    <Clock className="h-3 w-3" /> {formatTime(r.depart_at)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="truncate">{r.pickup_label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{r.dest_label}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ── My Groups (wrapped in themed card) ── */

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
    <section className="rounded-xl border border-border/40 bg-card p-5">
      <h2 className="text-lg font-semibold">Your ride groups</h2>
      <ul className="mt-3 space-y-2">
        {groups.map((g) => (
          <li key={g.id}>
            <Link
              href={`/groups/${g.id}`}
              onClick={() => clearUnread(g.id)}
              className="block rounded-lg border border-border/30 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/20"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="capitalize">{g.status}</span>
                {unread[g.id] ? (
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                    {unread[g.id]} new
                  </Badge>
                ) : null}
                <span className="ml-auto inline-flex items-center gap-1" title={formatTime(g.depart_at)}>
                  <Clock className="h-3 w-3" /> {formatTime(g.depart_at)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="truncate">{g.pickup_label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{g.dest_label}</span>
                <MessageCircle className="ml-auto h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClassmatesSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="h-5 w-36 rounded shimmer" />
      </div>
      <div className="rounded-xl border border-border/40 bg-card p-5 space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

function ClassmatesSection() {
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
        <Users className="h-4 w-4 text-[#ffe17c]" />
        <h2 className="text-base font-bold truncate max-w-[280px]" title={`Classmates at ${collegeName}`}>
          Classmates at {collegeName}
        </h2>
        <Badge variant="secondary" className="ml-1 font-normal">{classmates.length}</Badge>
      </div>
      <div className="rounded-xl border border-border/40 bg-card p-5 max-h-[340px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
        {classmates.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No other students registered from your college yet.
          </div>
        ) : (
          <ul className="divide-y divide-border/20">
            {classmates.map((c) => {
              const initials = (c.full_name ?? "Student").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-[#b7c6c2] text-xs font-bold border border-secondary/30">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium flex items-center gap-1.5">
                      <span className="truncate text-white">{c.full_name}</span>
                      {c.verified && (
                        <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#1DB954]/15 text-[#1DB954] text-[8px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
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

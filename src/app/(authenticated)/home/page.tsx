"use client";

import Link from "next/link";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { listMyRides, listMyGroups, listLiveRides } from "@/lib/rides.queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, ArrowRight, Clock, Plus, Users, MessageCircle,
  Car, UserRound, Radio, LocateFixed, ShieldAlert, Star,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";

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

export default function HomePage() {
  const geo = useGeolocation();
  return (
    <div className="space-y-8 animate-fade-in-up">
      <section className="surface-card overflow-hidden p-0 relative">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#4f772d]/10 via-transparent to-[#ecf39e]/5" />
        <div className="relative isolate flex flex-col gap-5 p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">CampusPool</div>
            <h1 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl leading-[1.1]">
              Where to <span className="italic">today</span>?
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Get a seat with a verified classmate in seconds.
            </p>
          </div>
          <GeoBanner geo={geo} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href={{ pathname: "/rides/new", query: { role: "passenger" } }} className="group">
              <div className="relative flex items-center gap-4 rounded-xl border border-border bg-background/60 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-background/80 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">Book a ride</div>
                  <p className="text-xs text-muted-foreground">Find a driver going your way</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
            <Link href={{ pathname: "/rides/new", query: { role: "driver" } }} className="group">
              <div className="relative flex items-center gap-4 rounded-xl border border-border bg-background/60 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-background/80 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <Car className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">Offer a ride</div>
                  <p className="text-xs text-muted-foreground">Fill empty seats, split fuel</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
        <Suspense fallback={<LiveRidesSkeleton />}>
          <LiveRides />
        </Suspense>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <Suspense fallback={<RidesSkeleton />}>
          <MyRides />
        </Suspense>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '450ms' }}>
        <Suspense fallback={<GroupsSkeleton />}>
          <MyGroups />
        </Suspense>
      </div>
    </div>
  );
}

function GeoBanner({ geo }: { geo: ReturnType<typeof useGeolocation> }) {
  if (geo.status === "granted") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success-foreground">
        <LocateFixed className="h-3.5 w-3.5 text-success" />
        Location on — we'll suggest nearby pickups.
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

function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`surface-card p-4 ${className}`}>
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
    <section>
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-primary animate-pulse" />
        <h2 className="text-lg font-semibold">Rides happening now</h2>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </section>
  );
}

// Fixed spelling/export to match Suspense fallback call
function RidesSkeleton() {
  return (
    <section>
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
    <section>
      <div className="h-6 w-36 rounded shimmer" />
      <div className="mt-3 space-y-2">
        <SkeletonCard />
      </div>
    </section>
  );
}

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

  return (
    <section>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <h2 className="text-lg font-semibold">Rides happening now</h2>
        <Badge variant="secondary" className="ml-1 font-normal">{rides.length}</Badge>
      </div>
      {rides.length === 0 ? (
        <div className="surface-card mt-3 flex flex-col items-center p-8 text-center">
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
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {rides.map((r) => (
            <li key={r.id}>
              <Link
                href={`/rides/${r.id}`}
                className="surface-card group block h-full p-4 transition-all duration-200 hover:border-primary/50 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-2 text-xs">
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/15 gap-1">
                    {r.role === "driver" ? <Car className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
                    {r.role === "driver" ? "Driver" : "Passenger"}
                  </Badge>
                  <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground" title={formatTime(r.depart_at)}>
                    <Clock className="h-3 w-3" /> {relTime(r.depart_at)}
                  </span>
                </div>
                <div className="mt-2 flex items-start gap-2 text-sm">
                  <div className="mt-0.5 flex flex-col items-center gap-0.5">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span className="h-4 w-px bg-border" />
                    <span className="h-2 w-2 rounded-sm border border-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="truncate">{r.pickup_label}</div>
                    <div className="truncate text-muted-foreground">{r.dest_label}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">
                    {r.profile?.full_name ?? "Student"}
                    {r.profile?.department ? ` · ${r.profile.department}` : ""}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    {r.profile && (r.profile.rating_count ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        {Number(r.profile.rating_avg).toFixed(1)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {r.seats}
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MyRides() {
  const { data: rides } = useSuspenseQuery(
    queryOptions({ queryKey: ["my-rides"], queryFn: () => listMyRides() })
  );

  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your rides</h2>
        <Link href="/rides/new">
          <Button size="sm" variant="ghost" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </Link>
      </div>
      {rides.length === 0 ? (
        <div className="surface-card mt-3 flex flex-col items-center p-8 text-center">
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
                className="surface-card block p-4 transition-all duration-200 hover:border-primary/50 hover:scale-[1.005] hover:shadow-md hover:shadow-primary/5"
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
    <section>
      <h2 className="text-lg font-semibold">Your ride groups</h2>
      <ul className="mt-3 space-y-2">
        {groups.map((g) => (
          <li key={g.id}>
            <Link
              href={`/groups/${g.id}`}
              onClick={() => clearUnread(g.id)}
              className="surface-card block p-4 transition-all duration-200 hover:border-primary/50 hover:scale-[1.005] hover:shadow-md hover:shadow-primary/5"
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

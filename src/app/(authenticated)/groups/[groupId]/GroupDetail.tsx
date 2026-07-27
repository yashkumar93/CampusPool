"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  submitRating,
  completeRide,
  startTrip,
  postTripLocation,
} from "@/lib/rides.actions";
import { getGroup, getLatestTripLocation } from "@/lib/rides.queries";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MapPin,
  Star,
  Users,
  Phone,
  CheckCircle2,
  Play,
  IndianRupee,
  Radio,
  ArrowLeft,
  MessageCircle,
  LayoutList,
  AlertTriangle,
} from "lucide-react";
import { TripMap } from "@/components/TripMap";
import { TripTimeline } from "@/components/TripTimeline";
import { ChatPanel } from "@/components/ChatPanel";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ── Helpers ── */

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

type LatLng = { lat: number; lng: number };

function getDistance(p1: LatLng, p2: LatLng) {
  const rad = (x: number) => (x * Math.PI) / 180;
  const R = 6378137;
  const dLat = rad(p2.lat - p1.lat);
  const dLong = rad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat)) *
      Math.cos(rad(p2.lat)) *
      Math.sin(dLong / 2) *
      Math.sin(dLong / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-emerald-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-pink-600",
  "bg-indigo-600",
  "bg-teal-600",
];

function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++)
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ── Skeleton ── */

function GroupSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="h-8 w-20 rounded-lg shimmer" />
        <div className="h-6 w-40 rounded-lg shimmer" />
        <div className="h-5 w-16 rounded-full shimmer ml-auto" />
      </div>
      <div className="flex gap-2 border-b border-border/30 pb-0">
        <div className="h-9 w-24 rounded-t-lg shimmer" />
        <div className="h-9 w-24 rounded-t-lg shimmer" />
      </div>
      <div className="rounded-xl border border-border/30 bg-card h-[520px] shimmer" />
    </div>
  );
}

/* ── Error state ── */

function GroupError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <h2 className="font-semibold">Couldn't load this group</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          {message.includes("not found") || message.includes("Not found")
            ? "This group doesn't exist, or you're not a member."
            : message}
        </p>
      </div>
      <Link href="/home">
        <Button variant="outline" size="sm" className="rounded-full gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Button>
      </Link>
    </div>
  );
}

/* ── Main component ── */

export function GroupDetail({ groupId }: { groupId: string }) {
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroup({ groupId }),
    retry: 1,
  });

  // Active tab: "chat" | "details"
  const [tab, setTab] = useState<"chat" | "details">("chat");

  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [hoverStar, setHoverStar] = useState<Record<string, number>>({});
  const watchIdRef = useRef<number | null>(null);
  const completingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (
        watchIdRef.current != null &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`group-status-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_locations",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const row = payload.new as { lat: number; lng: number };
          setDriverLoc({ lat: row.lat, lng: row.lng });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ride_groups",
          filter: `id=eq.${groupId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["group", groupId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, qc]);

  const members = data?.members ?? [];

  useEffect(() => {
    getLatestTripLocation({ groupId })
      .then((row) => {
        if (row) setDriverLoc({ lat: row.lat, lng: row.lng });
      })
      .catch(() => {});
  }, [groupId]);

  const rateMut = useMutation({
    mutationFn: (input: { rateeId: string; stars: number }) =>
      submitRating({ groupId, rateeId: input.rateeId, stars: input.stars }),
    onSuccess: () => {
      toast.success("Rating submitted");
      qc.invalidateQueries({ queryKey: ["group", groupId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const completeMut = useMutation({
    mutationFn: () => completeRide({ groupId }),
    onSuccess: () => {
      toast.success("Ride marked complete");
      qc.invalidateQueries({ queryKey: ["group", groupId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) return <GroupSkeleton />;

  if (isError || !data || !data.group) {
    const msg =
      error instanceof Error ? error.message : "Group not found";
    return <GroupError message={msg} />;
  }

  const { group, messages, currentUserId, ratedUserIds } = data;
  const isCreator = group.created_by === currentUserId;
  const isDriver = group.driver_id === currentUserId;
  const isCompleted = group.status === "completed";
  const isInProgress = group.status === "in_progress";
  const others = members.filter((m) => m.user_id !== currentUserId);

  const driverMember =
    members.find((m) => m.user_id === group.driver_id) ?? members[0];
  const pickup =
    driverMember?.pickup_lat != null && driverMember?.pickup_lng != null
      ? { lat: driverMember.pickup_lat, lng: driverMember.pickup_lng }
      : null;
  const destination =
    driverMember?.dest_lat != null && driverMember?.dest_lng != null
      ? { lat: driverMember.dest_lat, lng: driverMember.dest_lng }
      : null;
  const passengerStops = members
    .filter((m) => m.user_id !== driverMember?.user_id)
    .map((m) =>
      m.pickup_lat != null && m.pickup_lng != null
        ? { lat: m.pickup_lat, lng: m.pickup_lng }
        : null
    )
    .filter((p): p is { lat: number; lng: number } => !!p);

  function stopBroadcast() {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setBroadcasting(false);
  }

  function startBroadcast() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation not available");
      return;
    }
    setBroadcasting(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setDriverLoc(loc);
        void postTripLocation({
          groupId,
          lat: loc.lat,
          lng: loc.lng,
          heading: pos.coords.heading ?? null,
          speed: pos.coords.speed ?? null,
          accuracy: pos.coords.accuracy ?? null,
        }).catch(() => {});

        if (destination) {
          const dist = getDistance(loc, destination);
          if (dist < 30 && !completingRef.current && !isCompleted) {
            completingRef.current = true;
            stopBroadcast();
            completeMut.mutate();
          }
        }
      },
      (err) => {
        toast.error(err.message);
        stopBroadcast();
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  const startMut = useMutation({
    mutationFn: () => startTrip({ groupId }),
    onSuccess: () => {
      toast.success("Trip started — sharing your location");
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      startBroadcast();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-0 animate-fade-in-up">
      {/* ── Page header ── */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/home">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-semibold truncate">
              {group.name ?? "Ride Group"}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "capitalize text-[10px] font-medium rounded-full",
                isInProgress &&
                  "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
              )}
            >
              {isInProgress && <Radio className="h-2.5 w-2.5 mr-1 animate-pulse" />}
              {group.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {group.pickup_label} → {group.dest_label}
            </span>
            <span className="shrink-0">· {fmt(group.depart_at)}</span>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex border-b border-border/40 mb-4 gap-0">
        <button
          onClick={() => setTab("chat")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            tab === "chat"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Chat
          {messages.length > 0 && (
            <span className="ml-1 text-[10px] px-1.5 py-0 rounded-full bg-primary/15 text-primary font-bold">
              {messages.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("details")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            tab === "details"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutList className="h-3.5 w-3.5" />
          Details
        </button>
      </div>

      {/* ── CHAT TAB ── */}
      {tab === "chat" && (
        <div className="space-y-3">
          {/* Completed/in-progress banner */}
          {isCompleted && (
            <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-card px-4 py-2.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              This ride is complete. Chat history is read-only.
            </div>
          )}
          {isInProgress && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-400">
              <Radio className="h-3.5 w-3.5 animate-pulse shrink-0" />
              Trip is live — driver is sharing location
            </div>
          )}

          {/* Chat panel */}
          <ChatPanel
            groupId={groupId}
            currentUserId={currentUserId}
            members={members}
            messages={messages}
            isCompleted={isCompleted}
          />

          {/* Member chips row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground">Members:</span>
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center gap-1.5 rounded-full border border-border/30 bg-card px-2.5 py-1"
              >
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white",
                    avatarColor(m.user_id)
                  )}
                >
                  {getInitials(m.profile?.full_name ?? "??")}
                </div>
                <span className="text-xs font-medium">
                  {m.profile?.full_name?.split(" ")[0] ?? "Student"}
                  {m.user_id === currentUserId && (
                    <span className="text-muted-foreground"> (you)</span>
                  )}
                </span>
                {m.profile?.phone && m.user_id !== currentUserId && (
                  <a
                    href={`tel:${m.profile.phone}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="Call"
                  >
                    <Phone className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DETAILS TAB ── */}
      {tab === "details" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Left col */}
          <div className="space-y-4">
            <TripMap
              pickup={pickup}
              destination={destination}
              waypoints={passengerStops}
              polyline={group.route_polyline ?? null}
              driver={isInProgress ? driverLoc : null}
              onDestinationReached={() => {
                if (isDriver && !isCompleted && !completingRef.current) {
                  completingRef.current = true;
                  stopBroadcast();
                  completeMut.mutate();
                }
              }}
            />

            <TripTimeline
              status={group.status}
              createdAt={group.created_at}
              departAt={group.depart_at}
              startedAt={group.started_at}
              completedAt={group.completed_at}
            />

            {/* Driver controls */}
            {isDriver && !isCompleted && (
              <div className="flex flex-wrap gap-2">
                {!isInProgress ? (
                  <Button
                    className="gap-1.5 glow-primary"
                    onClick={() => startMut.mutate()}
                    disabled={startMut.isPending}
                  >
                    <Play className="h-4 w-4" /> Start trip & share location
                  </Button>
                ) : broadcasting ? (
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={stopBroadcast}
                  >
                    <Radio className="h-4 w-4 animate-pulse text-emerald-500" />{" "}
                    Stop broadcasting
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={startBroadcast}
                  >
                    <Radio className="h-4 w-4" /> Resume broadcasting
                  </Button>
                )}
              </div>
            )}

            {isCreator && !isCompleted && (
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => completeMut.mutate()}
                disabled={completeMut.isPending}
              >
                <CheckCircle2 className="h-4 w-4" /> Mark ride complete
              </Button>
            )}
          </div>

          {/* Right col — sidebar panels */}
          <aside className="space-y-4">
            {group.total_fare_estimate != null && (
              <div className="surface-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <IndianRupee className="h-4 w-4 text-primary" /> Fare split
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Total ~₹{Number(group.total_fare_estimate).toFixed(0)}
                  {group.total_distance_km
                    ? ` · ${Number(group.total_distance_km).toFixed(1)} km`
                    : ""}
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {members.map((m) => {
                    const sharePercent =
                      group.total_fare_estimate && m.share_amount
                        ? (Number(m.share_amount) /
                            Number(group.total_fare_estimate)) *
                          100
                        : 0;
                    return (
                      <li key={m.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="truncate">
                            {m.profile?.full_name ?? "Student"}
                          </span>
                          <span className="font-medium">
                            {m.share_amount != null
                              ? `₹${Number(m.share_amount).toFixed(0)}`
                              : "—"}
                          </span>
                        </div>
                        {sharePercent > 0 && (
                          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/60 transition-all duration-500"
                              style={{ width: `${sharePercent}%` }}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="surface-card p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" /> Members ({members.length})
              </div>
              <ul className="mt-3 space-y-3">
                {members.map((m) => (
                  <li key={m.id} className="text-sm">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                          avatarColor(m.user_id)
                        )}
                      >
                        {getInitials(m.profile?.full_name ?? "??")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">
                          {m.profile?.full_name ?? "Student"}
                          {m.user_id === currentUserId && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.profile?.department ?? "—"} ·{" "}
                          <span className="capitalize">{m.role}</span>
                        </div>
                      </div>
                      {m.profile?.phone && m.user_id !== currentUserId && (
                        <a
                          href={`tel:${m.profile.phone}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {m.ride && (
                      <div className="mt-1 ml-11 text-xs text-muted-foreground">
                        {m.ride.pickup_label} → {m.ride.dest_label}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {isCompleted && others.length > 0 && (
              <div className="surface-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Star className="h-4 w-4 text-primary" /> Rate co-riders
                </div>
                <ul className="mt-3 space-y-3">
                  {others.map((m) => {
                    const already = ratedUserIds.includes(m.user_id);
                    const hoveredStar = hoverStar[m.user_id] ?? 0;
                    return (
                      <li key={m.id}>
                        <div className="text-sm font-medium">
                          {m.profile?.full_name ?? "Student"}
                        </div>
                        {already ? (
                          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-primary" />{" "}
                            Rating submitted
                          </div>
                        ) : (
                          <div
                            className="mt-1 flex gap-0.5"
                            onMouseLeave={() =>
                              setHoverStar((prev) => ({
                                ...prev,
                                [m.user_id]: 0,
                              }))
                            }
                          >
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                className="transition-colors p-0.5"
                                onMouseEnter={() =>
                                  setHoverStar((prev) => ({
                                    ...prev,
                                    [m.user_id]: s,
                                  }))
                                }
                                onClick={() =>
                                  rateMut.mutate({
                                    rateeId: m.user_id,
                                    stars: s,
                                  })
                                }
                                disabled={rateMut.isPending}
                                aria-label={`Rate ${s} stars`}
                              >
                                <Star
                                  className={cn(
                                    "h-5 w-5 transition-colors",
                                    s <= hoveredStar
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground"
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

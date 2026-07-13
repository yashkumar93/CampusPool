"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  sendMessage,
  submitRating,
  completeRide,
  startTrip,
  postTripLocation,
} from "@/lib/rides.actions";
import {
  getGroup,
  getLatestTripLocation,
} from "@/lib/rides.queries";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Send, Star, Users, Phone, CheckCircle2, Play, IndianRupee, Radio, ArrowDown, ArrowLeft } from "lucide-react";
import { TripMap } from "@/components/TripMap";
import { TripTimeline } from "@/components/TripTimeline";
import Link from "next/link";
import { cn } from "@/lib/utils";

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });
}

type LatLng = { lat: number; lng: number };

function getDistance(p1: LatLng, p2: LatLng) {
  const rad = (x: number) => (x * Math.PI) / 180;
  const R = 6378137; // Earth’s mean radius in meters
  const dLat = rad(p2.lat - p1.lat);
  const dLong = rad(p2.lng - p1.lng);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function msgTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m ago`;
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-emerald-600", "bg-violet-600", "bg-amber-600", "bg-rose-600",
  "bg-cyan-600", "bg-pink-600", "bg-indigo-600", "bg-teal-600",
];

function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function GroupDetail({ groupId }: { groupId: string }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroup({ groupId }),
  });

  const [body, setBody] = useState("");
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hoverStar, setHoverStar] = useState<Record<string, number>>({});
  const watchIdRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSentRef = useRef(0);
  const completingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
        () => qc.invalidateQueries({ queryKey: ["group", groupId] }),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "trip_locations", filter: `group_id=eq.${groupId}` },
        (payload) => {
          const row = payload.new as { lat: number; lng: number };
          setDriverLoc({ lat: row.lat, lng: row.lng });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ride_groups", filter: `id=eq.${groupId}` },
        () => qc.invalidateQueries({ queryKey: ["group", groupId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, qc]);

  useEffect(() => {
    const ch = supabase.channel(`typing-${groupId}`, { config: { broadcast: { self: false } } });
    ch.on("broadcast", { event: "typing" }, ({ payload }) => {
      const uid = (payload as { userId?: string; name?: string })?.userId;
      const name = (payload as { userId?: string; name?: string })?.name ?? "Someone";
      if (!uid) return;
      setTypingUsers((prev) => ({ ...prev, [uid]: Date.now() }));
      setTimeout(() => {
        setTypingUsers((prev) => {
          const now = Date.now();
          const next: Record<string, number> = {};
          for (const [k, t] of Object.entries(prev)) if (now - t < 2500) next[k] = t;
          return next;
        });
        void name;
      }, 3000);
    }).subscribe();
    typingChannelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      typingChannelRef.current = null;
    };
  }, [groupId]);

  const members = data?.members ?? [];

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    const ch = typingChannelRef.current;
    if (!ch || !data) return;
    void ch.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: data.currentUserId, name: members.find((m) => m.user_id === data.currentUserId)?.profile?.full_name ?? "Someone" },
    });
  }, [data, members]);

  useEffect(() => {
    getLatestTripLocation({ groupId })
      .then((row) => {
        if (row) setDriverLoc({ lat: row.lat, lng: row.lng });
      })
      .catch(() => {});
  }, [groupId]);

  useEffect(() => {
    if (!showScrollBtn) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [data?.messages.length, showScrollBtn]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setShowScrollBtn(!atBottom);
  }, []);

  function scrollToBottom() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setShowScrollBtn(false);
  }

  const sendMut = useMutation({
    mutationFn: () => sendMessage({ groupId, body: body.trim() }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["group", groupId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to send"),
  });

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

  if (isLoading || !data || !data.group) return <div className="text-sm text-muted-foreground">Loading group…</div>;

  const { group, messages, currentUserId, ratedUserIds } = data;
  const typingNames = Object.keys(typingUsers)
    .filter((uid) => uid !== currentUserId)
    .map((uid) => members.find((m) => m.user_id === uid)?.profile?.full_name ?? "Someone");
  const isCreator = group.created_by === currentUserId;
  const isDriver = group.driver_id === currentUserId;
  const isCompleted = group.status === "completed";
  const isInProgress = group.status === "in_progress";
  const others = members.filter((m) => m.user_id !== currentUserId);

  const driverMember = members.find((m) => m.user_id === group.driver_id) ?? members[0];
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
    .map((m) => (m.pickup_lat != null && m.pickup_lng != null ? { lat: m.pickup_lat, lng: m.pickup_lng } : null))
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
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverLoc(loc);
        void postTripLocation({
          groupId,
          lat: loc.lat,
          lng: loc.lng,
          heading: pos.coords.heading ?? null,
          speed: pos.coords.speed ?? null,
          accuracy: pos.coords.accuracy ?? null,
        }).catch(() => {});

        // Automatically complete the trip if the driver reaches the destination
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
      { enableHighAccuracy: true, maximumAge: 5000 },
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

  // Group consecutive messages from same sender
  const groupedMessages = messages.map((m, i) => {
    const prev = i > 0 ? messages[i - 1] : null;
    const isFirst = !prev || prev.user_id !== m.user_id;
    return { ...m, isFirstInGroup: isFirst };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/home">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary">Ride group</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{group.name ?? "Ride"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="capitalize">{group.status}</Badge>
            {isInProgress && (
              <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15">
                <Radio className="h-3 w-3 animate-pulse" /> Live
              </Badge>
            )}
            <span>{fmt(group.depart_at)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {group.pickup_label} → {group.dest_label}</span>
          </div>
        </div>

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

        {isDriver && !isCompleted && (
          <div className="flex flex-wrap gap-2">
            {!isInProgress ? (
              <Button className="gap-1.5 glow-primary" onClick={() => startMut.mutate()} disabled={startMut.isPending}>
                <Play className="h-4 w-4" /> Start trip & share location
              </Button>
            ) : broadcasting ? (
              <Button variant="outline" className="gap-1.5" onClick={stopBroadcast}>
                <Radio className="h-4 w-4 animate-pulse text-emerald-500" /> Stop broadcasting
              </Button>
            ) : (
              <Button variant="outline" className="gap-1.5" onClick={startBroadcast}>
                <Radio className="h-4 w-4" /> Resume broadcasting
              </Button>
            )}
          </div>
        )}

        <div className="surface-card flex h-[520px] flex-col relative">
          <div ref={scrollRef} onScroll={handleScroll} className="relative flex-1 space-y-0.5 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Say hi 👋</div>
            ) : (
              groupedMessages.map((m) => {
                const mine = m.user_id === currentUserId;
                const author = members.find((x) => x.user_id === m.user_id)?.profile;
                return (
                  <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start", m.isFirstInGroup ? "pt-3" : "pt-0.5")}>
                    <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      {!mine && author && m.isFirstInGroup && (
                        <div className="text-xs font-medium opacity-70 mb-0.5">{author.full_name}</div>
                      )}
                      <div>{m.body}</div>
                      <div className={cn("text-[10px] mt-0.5", mine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                        {msgTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
              <Button
                size="sm"
                variant="secondary"
                className="rounded-full shadow-lg gap-1 h-7 px-3 text-xs"
                onClick={scrollToBottom}
              >
                <ArrowDown className="h-3 w-3" /> New messages
              </Button>
            </div>
          )}
          {typingNames.length > 0 && (
            <div className="border-t border-border/60 px-4 py-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="flex gap-0.5">
                  <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
                  <span className="h-1 w-1 animate-bounce rounded-full bg-primary" />
                </span>
                {typingNames.slice(0, 2).join(", ")}
                {typingNames.length > 2 ? ` +${typingNames.length - 2}` : ""} typing…
              </span>
            </div>
          )}
          <form
            className="flex gap-2 border-t border-border/60 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!body.trim() || isCompleted) return;
              sendMut.mutate();
            }}
          >
            <Input
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (e.target.value.trim()) notifyTyping();
              }}
              placeholder={isCompleted ? "Ride completed" : "Type a message"}
              disabled={isCompleted}
            />
            <Button type="submit" size="icon" disabled={!body.trim() || sendMut.isPending || isCompleted}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {isCreator && !isCompleted && (
          <Button variant="outline" className="gap-1.5" onClick={() => completeMut.mutate()}>
            <CheckCircle2 className="h-4 w-4" /> Mark ride complete
          </Button>
        )}
      </div>

      <aside className="space-y-4 order-last">
        {group.total_fare_estimate != null && (
          <div className="surface-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <IndianRupee className="h-4 w-4 text-primary" /> Fare split
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Total ~₹{Number(group.total_fare_estimate).toFixed(0)}
              {group.total_distance_km ? ` · ${Number(group.total_distance_km).toFixed(1)} km` : ""}
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {members.map((m) => {
                const sharePercent = group.total_fare_estimate && m.share_amount
                  ? (Number(m.share_amount) / Number(group.total_fare_estimate)) * 100
                  : 0;
                return (
                  <li key={m.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="truncate">{m.profile?.full_name ?? "Student"}</span>
                      <span className="font-medium">
                        {m.share_amount != null ? `₹${Number(m.share_amount).toFixed(0)}` : "—"}
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
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                    avatarColor(m.user_id),
                  )}>
                    {getInitials(m.profile?.full_name ?? "??")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {m.profile?.full_name ?? "Student"}
                      {m.user_id === currentUserId && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.profile?.department ?? "—"} · <span className="capitalize">{m.role}</span>
                    </div>
                  </div>
                  {m.profile?.phone && m.user_id !== currentUserId && (
                    <a href={`tel:${m.profile.phone}`} className="text-muted-foreground hover:text-primary transition-colors">
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
                    <div className="text-sm font-medium">{m.profile?.full_name ?? "Student"}</div>
                    {already ? (
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-success" /> Rating submitted
                      </div>
                    ) : (
                      <div
                        className="mt-1 flex gap-0.5"
                        onMouseLeave={() => setHoverStar((prev) => ({ ...prev, [m.user_id]: 0 }))}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            className="transition-colors p-0.5"
                            onMouseEnter={() => setHoverStar((prev) => ({ ...prev, [m.user_id]: s }))}
                            onClick={() => rateMut.mutate({ rateeId: m.user_id, stars: s })}
                            disabled={rateMut.isPending}
                            aria-label={`Rate ${s} stars`}
                          >
                            <Star
                              className={cn(
                                "h-5 w-5 transition-colors",
                                s <= hoveredStar
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground",
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
  </div>
  );
}

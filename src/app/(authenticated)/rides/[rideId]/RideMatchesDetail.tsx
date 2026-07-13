"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requestJoin, respondJoinRequest, cancelRide, closeRide } from "@/lib/rides.actions";
import { findMatches, listIncomingRequests, getMyProfile } from "@/lib/rides.queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight, ArrowLeft, Star, Users, Clock, Sparkles, Inbox, Check, X, Navigation2, Car, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TripMap } from "@/components/TripMap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit", month: "short", day: "numeric" });
}

function matchQuality(score: number): { label: string; className: string } {
  if (score >= 80) return { label: "Excellent", className: "bg-success/15 text-success" };
  if (score >= 60) return { label: "Good", className: "bg-yellow-500/15 text-yellow-500" };
  return { label: "Fair", className: "bg-muted text-muted-foreground" };
}

function RideMatchesSkeleton() {
  return (
    <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6">
      <div className="h-[45vh] shimmer" />
      <div className="relative z-10 -mt-6 rounded-t-3xl border-t border-border bg-background px-4 pb-24 pt-4 md:px-6">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" />
        <div className="surface-card mb-4 p-3 space-y-3">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded shimmer" />
              <div className="h-3 w-1/2 rounded shimmer" />
            </div>
          </div>
        </div>
        <div className="mb-3 h-6 w-40 rounded shimmer" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="surface-card p-4">
              <div className="flex justify-between mb-2">
                <div className="flex gap-2">
                  <div className="h-5 w-20 rounded shimmer" />
                  <div className="h-5 w-16 rounded shimmer" />
                </div>
                <div className="h-8 w-24 rounded shimmer" />
              </div>
              <div className="h-4 w-full rounded shimmer mt-2" />
              <div className="h-3 w-2/3 rounded shimmer mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RideMatchesDetail({ rideId }: { rideId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<"cancel" | "close" | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["matches", rideId],
    queryFn: () => findMatches({ rideId }),
  });

  const requestMut = useMutation({
    mutationFn: (targetRideId: string) => requestJoin({ targetRideId }),
    onSuccess: () => {
      toast.success("Request sent — waiting for driver");
      qc.invalidateQueries({ queryKey: ["matches", rideId] });
      qc.invalidateQueries({ queryKey: ["my-requests"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to request"),
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });
  const currentUserId = profile?.id;

  const isMine = !!data && !!currentUserId && data.mine.creator_id === currentUserId;
  const { data: incoming } = useQuery({
    queryKey: ["incoming-requests", rideId],
    queryFn: () => listIncomingRequests({ rideId }),
    enabled: !!data && isMine,
  });

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const respondMut = useMutation({
    mutationFn: (v: { requestId: string; accept: boolean }) => {
      setRespondingId(v.requestId);
      return respondJoinRequest(v);
    },
    onSuccess: (res) => {
      setRespondingId(null);
      toast.success(res.groupId ? "Passenger accepted" : "Request updated");
      qc.invalidateQueries({ queryKey: ["incoming-requests", rideId] });
      qc.invalidateQueries({ queryKey: ["my-groups"] });
      if (res.groupId) router.push(`/groups/${res.groupId}`);
    },
    onError: (e) => {
      setRespondingId(null);
      toast.error(e instanceof Error ? e.message : "Failed");
    },
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelRide({ rideId }),
    onSuccess: () => {
      toast.success("Ride cancelled successfully");
      qc.invalidateQueries({ queryKey: ["matches", rideId] });
      qc.invalidateQueries({ queryKey: ["my-rides"] });
      router.push("/home");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to cancel"),
  });

  const closeMut = useMutation({
    mutationFn: () => closeRide({ rideId }),
    onSuccess: () => {
      toast.success("Ride completed (closed) successfully");
      qc.invalidateQueries({ queryKey: ["matches", rideId] });
      qc.invalidateQueries({ queryKey: ["my-rides"] });
      router.push("/home");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to close"),
  });

  useEffect(() => {
    if (!data) return;
    const isDriver = data.mine.role === "driver";
    const channel = supabase
      .channel(`ride-${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "join_requests",
          filter: isDriver ? `target_ride_id=eq.${rideId}` : undefined,
        },
        (payload) => {
          if (isDriver) {
            qc.invalidateQueries({ queryKey: ["incoming-requests", rideId] });
            if (payload.eventType === "INSERT") {
              toast.message("New join request", { description: "Someone wants to share your ride" });
            }
          } else {
            const row = (payload.new ?? payload.old) as { target_ride_id?: string; status?: string; group_id?: string | null };
            if (row?.target_ride_id === rideId && payload.eventType === "UPDATE") {
              if (row.status === "accepted") {
                toast.success("Driver accepted! Opening trip…");
                qc.invalidateQueries({ queryKey: ["my-groups"] });
              } else if (row.status === "declined") {
                toast.error("Request declined");
              }
              qc.invalidateQueries({ queryKey: ["matches", rideId] });
            }
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
        () => qc.invalidateQueries({ queryKey: ["matches", rideId] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [data, rideId, qc]);

  if (isLoading || !data || !data.mine) return <RideMatchesSkeleton />;

  const mine = data.mine;
  const isDriverOffer = mine.role === "driver";
  const pickup = mine.pickup_lat != null && mine.pickup_lng != null ? { lat: mine.pickup_lat, lng: mine.pickup_lng } : null;
  const destination = mine.dest_lat != null && mine.dest_lng != null ? { lat: mine.dest_lat, lng: mine.dest_lng } : null;
  const matchWaypoints = data.matches
    .map((m) => (m.ride.pickup_lat != null && m.ride.pickup_lng != null ? { lat: m.ride.pickup_lat, lng: m.ride.pickup_lng } : null))
    .filter((p): p is { lat: number; lng: number } => p !== null);

  return (
    <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6">
      {/* Uber-style map hero */}
      <div className="relative">
        <TripMap
          pickup={pickup}
          destination={destination}
          waypoints={matchWaypoints}
          polyline={(mine as { route_polyline?: string | null }).route_polyline ?? null}
          className="!h-[45vh] !rounded-none !border-0"
          onDestinationReached={() => {
            if (mine.status === "open" || mine.status === "matched") {
              toast.success("Destination reached! Automatically completing your ride...");
              closeMut.mutate();
            }
          }}
        />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/home" className="pointer-events-auto">
              <Button size="icon" variant="secondary" className="shadow-lg h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="surface-card pointer-events-auto flex max-w-[65%] items-center gap-2 px-3 py-2 shadow-lg backdrop-blur">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                {isDriverOffer ? <Car className="h-4 w-4" /> : <Navigation2 className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-primary">
                  {isDriverOffer ? "Offering ride" : "Requesting ride"}
                </div>
                <div className="truncate text-sm font-medium">{mine.pickup_label} → {mine.dest_label}</div>
              </div>
            </div>
          </div>
          <Button
            size="icon"
            variant="secondary"
            className="pointer-events-auto shadow-lg"
            onClick={() => refetch()}
            disabled={isRefetching}
            aria-label="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="relative z-10 -mt-6 rounded-t-3xl border-t border-border bg-background px-4 pb-24 pt-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] md:px-6">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" />

        {/* Trip summary strip */}
        <div className="surface-card mb-4 p-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex flex-col items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="h-6 w-px bg-border" />
              <div className="h-2.5 w-2.5 rounded-sm bg-foreground" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5 text-sm">
              <div className="truncate font-medium">{mine.pickup_label}</div>
              <div className="truncate font-medium">{mine.dest_label}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {fmt(mine.depart_at)} · ±{mine.flex_minutes}m</span>
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {mine.seats} seat{mine.seats > 1 ? "s" : ""}</span>
            <Badge variant="outline" className="ml-auto capitalize">{mine.status}</Badge>
          </div>
        </div>

        {/* Ride management actions */}
        {isMine && (mine.status === "open" || mine.status === "matched") && (
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/20 gap-1.5"
              onClick={() => setConfirmAction("cancel")}
              disabled={cancelMut.isPending || closeMut.isPending}
            >
              Cancel Ride
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setConfirmAction("close")}
              disabled={cancelMut.isPending || closeMut.isPending}
            >
              Complete (Close)
            </Button>
          </div>
        )}

        {isDriverOffer && incoming && incoming.length > 0 && (
          <section className="mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" /> Join requests
            </h2>
            <ul className="mt-3 space-y-3">
              {incoming.map((r) => (
                <li key={r.id} className="surface-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{r.profile?.full_name ?? "Student"}</span>
                        {r.profile?.department && (
                          <span className="text-xs text-muted-foreground">· {r.profile.department}</span>
                        )}
                        <Badge variant="outline" className="ml-auto capitalize">{r.status}</Badge>
                      </div>
                      {r.pickup_label && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Pickup: <span className="text-foreground">{r.pickup_label}</span>
                        </div>
                      )}
                      {r.message && (
                        <div className="mt-1 text-sm italic text-muted-foreground">"{r.message}"</div>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => respondMut.mutate({ requestId: r.id, accept: true })}
                          disabled={respondMut.isPending && respondingId === r.id}
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => respondMut.mutate({ requestId: r.id, accept: false })}
                          disabled={respondMut.isPending && respondingId === r.id}
                        >
                          <X className="h-3.5 w-3.5" /> Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!isMine ? (
          <section className="mt-6">
            <h2 className="text-lg font-bold text-white mb-3">Host Information</h2>
            <div className="bg-[#1a221b] border-2 border-border/40 rounded-xl p-5 space-y-4">
              {(mine as any).creator_profile ? (
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-[#b7c6c2] text-sm font-bold border border-secondary/30">
                    {((mine as any).creator_profile.full_name ?? "Student").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold flex items-center gap-1.5 text-white">
                      <span>{(mine as any).creator_profile.full_name}</span>
                      {(mine as any).creator_profile.verified && (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#1DB954]/15 text-[#1DB954] text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {(mine as any).creator_profile.department || "Student"}{(mine as any).creator_profile.year ? ` · ${(mine as any).creator_profile.year} Year` : ""}
                    </div>
                  </div>
                  {((mine as any).creator_profile.rating_count ?? 0) > 0 && (
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded text-xs font-bold text-[#ffe17c]">
                      <Star className="h-3.5 w-3.5 fill-[#ffe17c]" /> {Number((mine as any).creator_profile.rating_avg).toFixed(1)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Host profile details loading...</div>
              )}

              <div className="border-t border-border/20 pt-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-bold">ESTIMATED COST SPLIT</span>
                  <span className="font-bold text-white text-sm">
                    {mine.estimated_cost ? `₹${mine.estimated_cost}` : "Auto Split"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-bold">VEHICLE TYPE</span>
                  <span className="font-bold text-white capitalize">{mine.vehicle_type}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-bold">AVAILABLE SEATS</span>
                  <span className="font-bold text-[#ffe17c]">{mine.seats} seats</span>
                </div>
              </div>

              <div className="pt-2">
                {(mine as any).my_request ? (
                  <div className="text-center">
                    {(mine as any).my_request.status === "pending" && (
                      <Button className="w-full h-11 btn-neo-secondary font-bold" disabled>
                        Request Pending Approval
                      </Button>
                    )}
                    {(mine as any).my_request.status === "accepted" && (
                      <Button 
                        className="w-full h-11 btn-neo-primary font-bold" 
                        onClick={() => router.push(`/groups/${(mine as any).my_request.group_id}`)}
                      >
                        Request Accepted! Open Group Chat
                      </Button>
                    )}
                    {(mine as any).my_request.status === "declined" && (
                      <Button className="w-full h-11 bg-red-900/30 border border-red-500/20 text-red-400 font-bold" disabled>
                        Request Declined
                      </Button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => requestMut.mutate(mine.id)}
                    disabled={requestMut.isPending}
                    className="w-full h-11 btn-neo-primary font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {requestMut.isPending ? "Sending Request..." : isDriverOffer ? "Request to Join Ride" : "Offer to Team Up"}
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> {data.matches.length} nearby {data.matches.length === 1 ? "match" : "matches"}
              </h2>
            </div>

            {data.matches.length === 0 ? (
              <div className="surface-card flex flex-col items-center p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="text-sm font-medium">No compatible riders yet</div>
                <p className="mt-2 text-xs text-muted-foreground max-w-xs">
                  Try widening your flex window or check back — we'll match you as new rides come in.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {data.matches.map((m) => {
                  const quality = matchQuality(m.score);
                  return (
                    <li key={m.ride.id} className="surface-card p-4 transition hover:border-primary/40 hover:shadow-md">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <Badge className="bg-primary/15 text-primary hover:bg-primary/15">{m.score}% match</Badge>
                            <Badge className={quality.className}>{quality.label}</Badge>
                            <Badge variant="secondary" className="font-normal">
                              {m.ride.role === "driver" ? "Driver" : "Passenger"}
                            </Badge>
                            <span className="ml-1">±{Math.round(m.timeDiffMin)}m · pickup {m.pickupKm.toFixed(1)}km</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="truncate">{m.ride.pickup_label}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate">{m.ride.dest_label}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {fmt(m.ride.depart_at)}</span>
                            {m.profile && (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-medium text-foreground">{m.profile.full_name}</span>
                                {m.profile.department && <span>· {m.profile.department}</span>}
                                {(m.profile.rating_count ?? 0) > 0 && (
                                  <span className="inline-flex items-center gap-0.5">
                                    · <Star className="h-3 w-3 fill-primary text-primary" /> {Number(m.profile.rating_avg).toFixed(1)}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => requestMut.mutate(m.ride.id)}
                          disabled={requestMut.isPending}
                        >
                          {m.ride.role === "driver" ? "Request seat" : "Ask to team up"}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      <Dialog open={confirmAction !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <DialogContent className="sm:max-w-md bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {confirmAction === "cancel" ? "Cancel Ride Request?" : "Complete & Close Ride?"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-2">
              {confirmAction === "cancel"
                ? "Are you sure you want to cancel this ride request? If you have matches or are part of a group, other members will be adjusted."
                : "Are you sure you want to complete and close this ride? This will remove it from the active search matches."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmAction(null)}
              disabled={cancelMut.isPending || closeMut.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction === "cancel" ? "destructive" : "default"}
              size="sm"
              onClick={() => {
                if (confirmAction === "cancel") {
                  cancelMut.mutate(undefined, {
                    onSuccess: () => setConfirmAction(null),
                  });
                } else if (confirmAction === "close") {
                  closeMut.mutate(undefined, {
                    onSuccess: () => setConfirmAction(null),
                  });
                }
              }}
              disabled={cancelMut.isPending || closeMut.isPending}
            >
              {cancelMut.isPending || closeMut.isPending ? "Confirming..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

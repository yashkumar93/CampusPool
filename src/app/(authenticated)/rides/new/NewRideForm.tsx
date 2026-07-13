"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createRide } from "@/lib/rides.actions";
import { LocationInput, type LocationValue } from "@/components/LocationInput";
import { TripMap } from "@/components/TripMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  MapPin, Navigation, ArrowLeft, ArrowRight, Car, UserRound,
  Bike, Users, Clock, IndianRupee, Sparkles, Check, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getActiveCampus } from "@/lib/campuses";
import { getMyProfile } from "@/lib/rides.queries";

type Vehicle = "any" | "bike" | "car" | "auto" | "cab";

const VEHICLE_OPTIONS: { value: Vehicle; label: string; icon: typeof Car; hint: string }[] = [
  { value: "any", label: "Any", icon: Sparkles, hint: "Best match" },
  { value: "car", label: "Car", icon: Car, hint: "4 seats" },
  { value: "auto", label: "Auto", icon: Car, hint: "3 seats" },
  { value: "bike", label: "Bike", icon: Bike, hint: "1 pillion" },
  { value: "cab", label: "Cab", icon: Car, hint: "Book split" },
];

function defaultDepartLocal() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function makeDepartLocal(offsetMinutes: number) {
  const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// Rough Haversine estimate for confirm-step preview only.
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const c = s1 * s1 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * s2 * s2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(c)));
}

function fmtDepart(local: string) {
  try {
    return new Date(local).toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
  } catch { return local; }
}

export function NewRideForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const initialRole = roleParam === "driver" || roleParam === "passenger" ? roleParam : "passenger";

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  const activeCampus = useMemo(() => {
    return getActiveCampus(profile?.college);
  }, [profile?.college]);

  const quickLandmarks = useMemo(() => {
    return activeCampus.landmarks.filter((l) => l.category === "campus" || l.category === "transit");
  }, [activeCampus]);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [role, setRole] = useState<"passenger" | "driver">(initialRole);
  const [pickup, setPickup] = useState<LocationValue | null>(null);
  const [dest, setDest] = useState<LocationValue | null>(null);
  const [departAt, setDepartAt] = useState(defaultDepartLocal());
  const [flex, setFlex] = useState(20);
  const [seats, setSeats] = useState(1);
  const [vehicle, setVehicle] = useState<Vehicle>("any");
  const [cost, setCost] = useState<string>("");
  const [notes, setNotes] = useState("");

  const sameLocation = pickup && dest && pickup.lat === dest.lat && pickup.lng === dest.lng;

  const distanceKm = useMemo(() => {
    if (!pickup || !dest) return 0;
    return haversineKm({ lat: pickup.lat, lng: pickup.lng }, { lat: dest.lat, lng: dest.lng });
  }, [pickup, dest]);

  const estFare = useMemo(() => {
    if (!distanceKm) return 0;
    const perKm = vehicle === "bike" ? 6 : vehicle === "auto" ? 10 : 12;
    return Math.round(distanceKm * perKm);
  }, [distanceKm, vehicle]);

  const perHead = useMemo(() => {
    if (!estFare) return 0;
    return Math.round(estFare / Math.max(seats + 1, 2));
  }, [estFare, seats]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!pickup || !dest) throw new Error("Please pick both pickup and destination");
      if (pickup.lat === dest.lat && pickup.lng === dest.lng)
        throw new Error("Pickup and destination must differ");
      const iso = new Date(departAt).toISOString();
      return createRide({
        role, pickup_label: pickup.label, pickup_lat: pickup.lat, pickup_lng: pickup.lng,
        dest_label: dest.label, dest_lat: dest.lat, dest_lng: dest.lng,
        depart_at: iso, flex_minutes: flex, seats, vehicle_type: vehicle,
        estimated_cost: cost ? Number(cost) : null,
        notes: notes || null,
      });
    },
    onSuccess: (ride) => {
      toast.success("Ride posted");
      router.push(`/rides/${ride.id}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Something went wrong"),
  });

  const canNext0 = !!pickup && !!dest && !sameLocation;
  const canNext1 = !!departAt && seats >= 1;

  const steps = ["Where", "When", "Confirm"] as const;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Role toggle */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(["passenger", "driver"] as const).map((r) => {
          const Icon = r === "driver" ? Car : UserRound;
          const active = role === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "surface-card flex items-center gap-3 p-3 text-left transition",
                active ? "border-primary ring-1 ring-primary/40" : "hover:border-primary/50",
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">{r === "driver" ? "Offering seats" : "Requesting a ride"}</div>
                <div className="text-xs text-muted-foreground">{r === "driver" ? "I'm driving" : "I need a seat"}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stepper */}
      <ol className="mb-5 flex items-center gap-2">
        {steps.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition",
                done ? "bg-primary text-primary-foreground" :
                active ? "bg-primary/15 text-primary ring-1 ring-primary/40" :
                "bg-muted text-muted-foreground",
              )}>
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              {i < steps.length - 1 && <span className={cn("h-px flex-1", done ? "bg-primary/60" : "bg-border")} />}
            </li>
          );
        })}
      </ol>

      <div className="surface-card p-5">
        {/* Step transitions */}
        <div className={cn("transition-opacity duration-300", step === 0 ? "opacity-100" : "hidden opacity-0")}>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Where are you going?</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> Pickup</Label>
                <LocationInput value={pickup} onChange={setPickup} placeholder="Search or use current location" biasLat={activeCampus.defaultCoordinates.lat} biasLng={activeCampus.defaultCoordinates.lng} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Navigation className="h-3.5 w-3.5 text-primary" /> Destination</Label>
                <LocationInput value={dest} onChange={setDest} placeholder="Where to?" biasLat={activeCampus.defaultCoordinates.lat} biasLng={activeCampus.defaultCoordinates.lng} />
                {sameLocation && (
                  <p className="text-xs text-destructive mt-1">Pickup and destination can't be the same</p>
                )}
              </div>
            </div>
            {pickup && dest && !sameLocation && (
              <div className="overflow-hidden rounded-lg border border-border">
                <TripMap
                  pickup={{ lat: pickup.lat, lng: pickup.lng }}
                  destination={{ lat: dest.lat, lng: dest.lng }}
                  waypoints={[]}
                  polyline={null}
                  driver={null}
                />
              </div>
            )}
          </div>
        </div>

        <div className={cn("transition-opacity duration-300", step === 1 ? "opacity-100" : "hidden opacity-0")}>
          <div className="space-y-5">
            <h2 className="text-lg font-semibold">When and how?</h2>

            {/* Time presets */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> Departure</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  { label: "Now", offset: 5 },
                  { label: "+30m", offset: 30 },
                  { label: "+1h", offset: 60 },
                  { label: "+2h", offset: 120 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDepartAt(makeDepartLocal(preset.offset))}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    <Zap className="h-2.5 w-2.5" /> {preset.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Input id="depart" type="datetime-local" value={departAt} onChange={(e) => setDepartAt(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="flex">Flex (min)</Label>
                  <Input id="flex" type="number" min={0} max={120} value={flex} onChange={(e) => setFlex(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> {role === "driver" ? "Seats offered" : "Passengers"}</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n} type="button" onClick={() => setSeats(n)}
                    className={cn(
                      "h-10 w-10 rounded-lg border text-sm font-semibold transition",
                      seats === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50",
                    )}
                  >{n}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vehicle</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {VEHICLE_OPTIONS.map(({ value, label, icon: Icon, hint }) => {
                  const active = vehicle === value;
                  return (
                    <button
                      key={value} type="button" onClick={() => setVehicle(value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition",
                        active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                      )}
                    >
                      <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                      <span className="font-medium">{label}</span>
                      <span className="text-[10px] text-muted-foreground">{hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fare estimation card */}
            {distanceKm > 0 && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  Estimated fare
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-muted-foreground">Distance</div>
                    <div className="text-sm font-semibold">{distanceKm.toFixed(1)} km</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="text-sm font-semibold">₹{estFare}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Per head</div>
                    <div className="text-sm font-semibold text-primary">~₹{perHead}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="cost" className="flex items-center gap-1.5"><IndianRupee className="h-3.5 w-3.5 text-primary" /> Fare cap per head (optional)</Label>
              <Input id="cost" type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} placeholder={estFare ? `Suggested ~₹${perHead}` : "Leave blank for auto split"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Prefer silent ride, ok with detour" rows={2} />
            </div>
          </div>
        </div>

        {step === 2 && pickup && dest && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Confirm your ride</h2>
            <div className="overflow-hidden rounded-lg border border-border">
              <TripMap
                pickup={{ lat: pickup.lat, lng: pickup.lng }}
                destination={{ lat: dest.lat, lng: dest.lng }}
                waypoints={[]}
                polyline={null}
                driver={null}
              />
            </div>
            <div className="space-y-2 rounded-lg border border-border bg-background/60 p-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="mt-1 flex flex-col items-center gap-0.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="h-4 w-px bg-border" />
                  <span className="h-2 w-2 rounded-sm border border-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="truncate">{pickup.label}</div>
                  <div className="truncate text-muted-foreground">{dest.label}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-2 text-xs">
                <div><span className="text-muted-foreground">Depart</span><div className="font-medium">{fmtDepart(departAt)}</div></div>
                <div><span className="text-muted-foreground">Flex</span><div className="font-medium">±{flex} min</div></div>
                <div><span className="text-muted-foreground">Seats</span><div className="font-medium">{seats}</div></div>
                <div><span className="text-muted-foreground">Vehicle</span><div className="font-medium capitalize">{vehicle}</div></div>
                {distanceKm > 0 && (
                  <>
                    <div><span className="text-muted-foreground">Distance</span><div className="font-medium">{distanceKm.toFixed(1)} km</div></div>
                    <div>
                      <span className="text-muted-foreground">Est. fare / head</span>
                      <div className="font-medium text-primary">
                        {cost ? `₹${Number(cost).toFixed(0)}` : `~₹${perHead}`}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {notes && <div className="border-t border-border/60 pt-2 text-xs text-muted-foreground">Note: {notes}</div>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep((s) => (s - 1) as typeof step)} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        ) : (
          <Link href="/home">
            <Button variant="outline" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        )}
        <div className="ml-auto flex items-center gap-2">
          {step < 2 && (
            <Button
              disabled={(step === 0 && !canNext0) || (step === 1 && !canNext1)}
              onClick={() => setStep((s) => (s + 1) as typeof step)}
              className="gap-1.5"
              size="lg"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {step === 2 && (
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} size="lg" className="gap-1.5 glow-primary">
              {mutation.isPending ? "Posting…" : "Post ride & find matches"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

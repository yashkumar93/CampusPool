"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getMyProfile } from "@/lib/rides.queries";
import { createRide } from "@/lib/rides.actions";
import { toast } from "sonner";
import {
  MapPin, Navigation, ArrowLeft, ArrowRight, Car, UserRound,
  Clock, Zap, Users, ShieldCheck, Check, Info, IndianRupee, Leaf, GitCompare, Route, Bike, HelpCircle
} from "lucide-react";
import Link from "next/link";
import { LocationInput, type LocationValue } from "@/components/LocationInput";
import { getActiveCampus } from "@/lib/campuses";
import { TripMap } from "@/components/TripMap";
import { cn } from "@/lib/utils";

type Vehicle = "any" | "bike" | "auto" | "cab" | "eco";

const VEHICLE_OPTIONS: { value: Vehicle; label: string; icon: any; hint: string }[] = [
  { value: "any", label: "Any", icon: HelpCircle, hint: "Fastest match" },
  { value: "bike", label: "Bike", icon: Bike, hint: "1 rider" },
  { value: "auto", label: "Auto", icon: Car, hint: "Up to 3" },
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
  const role: "passenger" | "driver" = roleParam === "driver" ? "driver" : "passenger";

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });

  const activeCampus = useMemo(() => {
    return getActiveCampus(profile?.college);
  }, [profile?.college]);

  const [step, setStep] = useState<0 | 1 | 2>(0);
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
    <div className="mx-auto max-w-2xl font-sans">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-extrabold tracking-tighter text-white">
          {role === "driver" ? "Offer a Ride" : "Find a Ride"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {role === "driver" 
            ? "Fill empty seats on your commute to split fuel charges with verified peers."
            : "Search and request seats from classmate matches traveling the same route."}
        </p>
      </div>

      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border-2 transition-all",
                done ? "bg-[#b7c6c2] border-black text-black" :
                active ? "bg-[#ffe17c] border-black text-black shadow-neo-sm" :
                "bg-[#1a221b] border-border/40 text-muted-foreground",
              )}>
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("text-xs font-bold", active ? "text-[#ffe17c]" : "text-muted-foreground")}>{label}</span>
              {i < steps.length - 1 && <span className={cn("h-0.5 flex-1", done ? "bg-[#b7c6c2]" : "bg-border/20")} />}
            </li>
          );
        })}
      </ol>

      <div className="bg-card border-2 border-border/40 rounded-xl p-6 shadow-neo-lg text-white">
        {/* Step 0: Locations */}
        <div className={cn("transition-opacity duration-300", step === 0 ? "opacity-100" : "hidden opacity-0")}>
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#ffe17c]" /> Route Details
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-white font-bold flex items-center gap-1.5">Pickup Point</Label>
                <LocationInput 
                  value={pickup} 
                  onChange={setPickup} 
                  placeholder="Search campus building or landmark..." 
                  biasLat={activeCampus.defaultCoordinates.lat} 
                  biasLng={activeCampus.defaultCoordinates.lng} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white font-bold flex items-center gap-1.5">Destination</Label>
                <LocationInput 
                  value={dest} 
                  onChange={setDest} 
                  placeholder="Where to?" 
                  biasLat={activeCampus.defaultCoordinates.lat} 
                  biasLng={activeCampus.defaultCoordinates.lng} 
                />
                {sameLocation && (
                  <p className="text-xs text-[#F15E6C] font-bold mt-1.5">Pickup and destination cannot be the same point</p>
                )}
              </div>
            </div>
            {pickup && dest && !sameLocation && (
              <div className="overflow-hidden rounded-lg border-2 border-black mt-4">
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

        {/* Step 1: Time and preferences */}
        <div className={cn("transition-opacity duration-300", step === 1 ? "opacity-100" : "hidden opacity-0")}>
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#ffe17c]" /> Depart Window & Vehicle details
            </h2>

            {/* Time presets */}
            <div className="space-y-1.5">
              <Label className="text-white font-bold">Departure Time</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { label: "Now", offset: 5 },
                  { label: "+30 mins", offset: 30 },
                  { label: "+1 hour", offset: 60 },
                  { label: "+2 hours", offset: 120 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDepartAt(makeDepartLocal(preset.offset))}
                    className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-white text-black px-3.5 py-1.5 text-xs font-bold hover:bg-[#ffe17c] transition-all cursor-pointer"
                  >
                    <Zap className="h-3 w-3 fill-current" /> {preset.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Input 
                    id="depart" 
                    type="datetime-local" 
                    value={departAt} 
                    onChange={(e) => setDepartAt(e.target.value)} 
                    required 
                    className="bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="flex" className="text-white font-bold">Flex window (mins)</Label>
                  <Input 
                    id="flex" 
                    type="number" 
                    min={0} 
                    max={120} 
                    value={flex} 
                    onChange={(e) => setFlex(Number(e.target.value))} 
                    className="bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black h-11"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white font-bold">
                {role === "driver" ? "Seats offered" : "Passengers count"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n} 
                    type="button" 
                    onClick={() => setSeats(n)}
                    className={cn(
                      "h-11 w-11 rounded-lg border-2 border-black text-sm font-bold transition-all cursor-pointer",
                      seats === n ? "bg-[#ffe17c] text-black shadow-neo-sm" : "bg-white text-black hover:bg-neutral-100",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white font-bold">Vehicle Type Preference</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {VEHICLE_OPTIONS.map(({ value, label, icon: Icon, hint }) => {
                  const active = vehicle === value;
                  return (
                    <button
                      key={value} 
                      type="button" 
                      onClick={() => setVehicle(value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border-2 border-black p-3 text-xs font-bold transition-all bg-white text-black cursor-pointer",
                        active ? "bg-[#ffe17c] shadow-neo-sm" : "hover:bg-neutral-100",
                      )}
                    >
                      <Icon className={cn("h-5 w-5", active ? "text-black" : "text-neutral-500")} />
                      <span className="font-bold">{label}</span>
                      <span className="text-[10px] text-neutral-500 font-medium">{hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fare estimation card */}
            {distanceKm > 0 && (
              <div className="rounded-lg border-2 border-black bg-[#b7c6c2]/10 p-4 text-white">
                <div className="flex items-center gap-2 text-sm font-bold text-[#ffe17c]">
                  <IndianRupee className="h-4 w-4" />
                  Estimated Split Fare Info
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-muted-foreground font-bold">Distance</div>
                    <div className="text-sm font-extrabold text-white mt-0.5">{distanceKm.toFixed(1)} km</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-bold">Total Est.</div>
                    <div className="text-sm font-extrabold text-white mt-0.5">₹{estFare}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground font-bold">Per head</div>
                    <div className="text-sm font-extrabold text-[#ffe17c] mt-0.5">~₹{perHead}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="cost" className="text-white font-bold">
                {role === "driver" ? "Suggested fuel split charge per head (optional)" : "Maximum fare split budget (optional)"}
              </Label>
              <Input 
                id="cost" 
                type="number" 
                min={0} 
                value={cost} 
                onChange={(e) => setCost(e.target.value)} 
                placeholder={estFare ? `Suggested ~₹${perHead}` : "Leave blank for auto split"} 
                className="bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-white font-bold">Additional Notes (optional)</Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="e.g. Carrying one backpack. Female-only match preferred." 
                rows={2} 
                className="bg-white border-2 border-black text-black placeholder:text-neutral-400 focus-visible:ring-black"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Confirm */}
        {step === 2 && pickup && dest && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#ffe17c]" /> Confirm your ride details
            </h2>
            <div className="overflow-hidden rounded-lg border-2 border-black">
              <TripMap
                pickup={{ lat: pickup.lat, lng: pickup.lng }}
                destination={{ lat: dest.lat, lng: dest.lng }}
                waypoints={[]}
                polyline={null}
                driver={null}
              />
            </div>
            <div className="space-y-3 rounded-lg border-2 border-black bg-white/5 p-4 text-sm">
              <div className="flex items-start gap-2">
                <div className="mt-1 flex flex-col items-center gap-0.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffe17c]" />
                  <span className="h-5 w-0.5 bg-neutral-600" />
                  <span className="h-2.5 w-2.5 rounded bg-[#b7c6c2]" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="truncate font-bold text-white">{pickup.label}</div>
                  <div className="truncate text-muted-foreground">{dest.label}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-border/40 pt-3 text-xs">
                <div>
                  <span className="text-muted-foreground font-bold block">DEPARTURE</span>
                  <div className="font-bold text-white mt-0.5">{fmtDepart(departAt)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold block">FLEXIBILITY</span>
                  <div className="font-bold text-white mt-0.5">±{flex} mins</div>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold block">SEATS / CAPACITY</span>
                  <div className="font-bold text-white mt-0.5">{seats} seats</div>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold block">VEHICLE CLASS</span>
                  <div className="font-bold text-white mt-0.5 capitalize">{vehicle}</div>
                </div>
                {distanceKm > 0 && (
                  <>
                    <div>
                      <span className="text-muted-foreground font-bold block">TOTAL DISTANCE</span>
                      <div className="font-bold text-white mt-0.5">{distanceKm.toFixed(1)} km</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-bold block">FAREsplit ESTIMATE</span>
                      <div className="font-bold text-[#ffe17c] mt-0.5">
                        {cost ? `₹${Number(cost).toFixed(0)}` : `~₹${perHead}`}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {notes && (
                <div className="border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                  <span className="font-bold block text-white mb-0.5">Note:</span> {notes}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Buttons bar */}
      <div className="mt-6 flex items-center gap-3">
        {step > 0 ? (
          <button 
            type="button" 
            onClick={() => setStep((s) => (s - 1) as typeof step)} 
            className="btn-neo-secondary px-5 h-11 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <Link href="/home">
            <button 
              type="button" 
              className="btn-neo-secondary px-5 h-11 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </button>
          </Link>
        )}
        <div className="ml-auto flex items-center gap-3">
          {step < 2 && (
            <button
              type="button"
              disabled={(step === 0 && !canNext0) || (step === 1 && !canNext1)}
              onClick={() => setStep((s) => (s + 1) as typeof step)}
              className="btn-neo-primary px-6 h-11 flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              Next step <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {step === 2 && (
            <button 
              type="button"
              onClick={() => mutation.mutate()} 
              disabled={mutation.isPending} 
              className="btn-neo-primary px-6 h-11 flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {mutation.isPending ? "Posting…" : "Confirm & Post"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

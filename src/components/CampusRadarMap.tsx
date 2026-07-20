"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { loadMapsScript } from "@/lib/maps-loader";
import { type MapRadarRide, type MapRadarTrip } from "@/lib/rides.queries";
import {
  Car,
  User,
  Navigation,
  MapPin,
  Clock,
  Star,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Filter,
  Users,
  LocateFixed,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0d110e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8e9a8f" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d110e" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1f2a21" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#19221b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#222f25" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#202d23" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#2a3b2e" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1f2a21" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#060806" }] },
];

type FilterType = "all" | "drivers" | "passengers" | "live";

type Props = {
  rides: MapRadarRide[];
  activeTrips: MapRadarTrip[];
  currentUserId?: string;
};

export function CampusRadarMap({ rides = [], activeTrips = [], currentUserId }: Props) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedRide, setSelectedRide] = useState<MapRadarRide | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<MapRadarTrip | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);

  // Filtered lists
  const filteredRides = useMemo(() => {
    if (filter === "live") return [];
    if (filter === "drivers") return rides.filter((r) => r.role === "driver");
    if (filter === "passengers") return rides.filter((r) => r.role === "passenger");
    return rides;
  }, [rides, filter]);

  const filteredTrips = useMemo(() => {
    if (filter === "drivers" || filter === "passengers") return [];
    return activeTrips;
  }, [activeTrips, filter]);

  // Load Google Maps script and initialize map
  useEffect(() => {
    let mounted = true;
    loadMapsScript()
      .then(() => {
        if (!mounted || !mapContainerRef.current) return;
        const defaultCenter = { lat: 16.4936, lng: 80.5006 }; // VIT AP Campus default
        mapRef.current = new window.google!.maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          scrollwheel: true,
          gestureHandling: "cooperative",
          styles: MAP_STYLES,
        });
        setReady(true);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load maps");
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Track User GPS location
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        if (ready && mapRef.current && !userMarkerRef.current && window.google?.maps) {
          userMarkerRef.current = new window.google.maps.Marker({
            position: loc,
            map: mapRef.current,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2.5,
            },
            title: "Your Location",
            zIndex: 999,
          });
        } else if (userMarkerRef.current) {
          userMarkerRef.current.setPosition(loc);
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [ready]);

  // Update markers when filtered lists change
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    // 1. Add markers for Open Rides
    filteredRides.forEach((ride) => {
      const lat = ride.pickup_lat;
      const lng = ride.pickup_lng;
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const isDriver = ride.role === "driver";
      const isMine = ride.creator_id === currentUserId;

      // Create distinct marker SVG icons
      const markerColor = isMine ? "#eab308" : isDriver ? "#c1fbd4" : "#06b6d4";
      const markerSize = isMine ? 11 : 9;

      const marker = new window.google!.maps.Marker({
        position: { lat, lng },
        map: mapRef.current,
        icon: {
          path: window.google!.maps.SymbolPath.CIRCLE,
          scale: markerSize,
          fillColor: markerColor,
          fillOpacity: 0.95,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: `${ride.profile?.full_name ?? "Classmate"} (${isDriver ? "Driver" : "Passenger"})`,
        zIndex: isMine ? 100 : 50,
      });

      marker.addListener("click", () => {
        setSelectedTrip(null);
        setSelectedRide(ride);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat, lng });
      hasCoords = true;
    });

    // 2. Add markers for Live Active Trips
    filteredTrips.forEach((trip) => {
      const lat = trip.lat;
      const lng = trip.lng;
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const marker = new window.google!.maps.Marker({
        position: { lat, lng },
        map: mapRef.current,
        icon: {
          path: window.google!.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        title: `Live Trip: ${trip.name ?? "In Progress"}`,
        zIndex: 200,
      });

      marker.addListener("click", () => {
        setSelectedRide(null);
        setSelectedTrip(trip);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat, lng });
      hasCoords = true;
    });

    // Fit map bounds if we have multiple points
    if (hasCoords && markersRef.current.length > 1) {
      mapRef.current.fitBounds(bounds, 80);
    } else if (hasCoords && markersRef.current.length === 1) {
      const pos = markersRef.current[0].getPosition();
      if (pos) {
        mapRef.current.setCenter(pos);
        mapRef.current.setZoom(15);
      }
    }
  }, [ready, filteredRides, filteredTrips, currentUserId]);

  const centerOnUser = () => {
    if (userLoc && mapRef.current) {
      mapRef.current.setCenter(userLoc);
      mapRef.current.setZoom(16);
    } else {
      // Default center
      if (mapRef.current) {
        mapRef.current.setCenter({ lat: 16.4936, lng: 80.5006 });
        mapRef.current.setZoom(15);
      }
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name || !name.trim()) return "?";
    const p = name.trim().split(/\s+/);
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0][0].toUpperCase();
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  };

  if (error) {
    return (
      <div className="flex h-[600px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center">
        <MapPin className="mb-3 h-10 w-10 text-destructive" />
        <h3 className="text-lg font-bold text-foreground">Unable to Load Map</h3>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100vh-8.5rem)] w-full flex-col overflow-hidden rounded-2xl border border-border bg-[#0d110e] shadow-2xl">
      {/* Top Floating Filter Bar */}
      <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/90 p-2 backdrop-blur-md shadow-lg">
        <button
          onClick={() => setFilter("all")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            filter === "all"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" /> All Radar ({rides.length + activeTrips.length})
        </button>

        <button
          onClick={() => setFilter("drivers")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            filter === "drivers"
              ? "bg-[#c1fbd4] text-black shadow-sm shadow-[#c1fbd4]/30"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
        >
          <Car className="h-3.5 w-3.5 text-aloe-text" /> Drivers ({rides.filter((r) => r.role === "driver").length})
        </button>

        <button
          onClick={() => setFilter("passengers")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            filter === "passengers"
              ? "bg-cyan-500 text-black shadow-sm shadow-cyan-500/30"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
        >
          <User className="h-3.5 w-3.5 text-cyan-400" /> Passengers ({rides.filter((r) => r.role === "passenger").length})
        </button>

        <button
          onClick={() => setFilter("live")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            filter === "live"
              ? "bg-red-500 text-foreground shadow-sm shadow-red-500/30 animate-pulse"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-red-400" /> Live Trips ({activeTrips.length})
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <button
          onClick={centerOnUser}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/10 transition-colors"
          title="Center on My Location"
        >
          <LocateFixed className="h-3.5 w-3.5 text-aloe-text" /> Center
        </button>
      </div>

      {/* Map Legend Overlay (Top Right) */}
      <div className="absolute right-4 top-4 z-10 hidden sm:flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/90 p-3 backdrop-blur-md text-[11px] font-medium text-muted-foreground shadow-lg">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#c1fbd4] inline-block shadow-sm shadow-[#c1fbd4]" />
          <span>Driver Offering Seat</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400" />
          <span>Passenger Looking</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500 animate-pulse" />
          <span>Live Trip in Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500 inline-block shadow-sm shadow-yellow-500" />
          <span>Your Ride Post</span>
        </div>
      </div>

      {/* Google Maps Canvas */}
      <div ref={mapContainerRef} className="h-full w-full bg-[#0d110e]" />

      {/* Floating Info Card for Selected Ride */}
      {selectedRide && (
        <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-96 z-20 overflow-hidden rounded-2xl border border-border/60 bg-[#0f1611]/95 p-5 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary border border-primary/30">
                {getInitials(selectedRide.profile?.full_name)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground text-sm">
                    {selectedRide.profile?.full_name ?? "Classmate"}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-aloe-text border border-emerald-500/20">
                    <ShieldCheck className="h-2.5 w-2.5" /> VIT AP
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {selectedRide.profile?.department ?? "Student"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedRide(null)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-black/40 p-3 border border-white/5">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${
                  selectedRide.role === "driver"
                    ? "border-[#c1fbd4]/40 bg-[#c1fbd4]/10 text-aloe-text"
                    : "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                }`}
              >
                {selectedRide.role === "driver" ? "🚗 Offering Seat" : "🧍 Looking for Ride"}
              </Badge>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-primary">
                {selectedRide.estimated_cost ? `₹${selectedRide.estimated_cost}` : "Free / Split"}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-2 text-xs text-foreground/90">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-aloe-text font-bold">From:</span>
              <span className="font-medium truncate">{selectedRide.pickup_label}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-cyan-400 font-bold">To:</span>
              <span className="font-medium truncate">{selectedRide.dest_label}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Departing at <strong className="text-foreground">{formatTime(selectedRide.depart_at)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{selectedRide.seats} seat{selectedRide.seats > 1 ? "s" : ""}</span>
            </div>
          </div>

          <Button
            onClick={() => router.push(`/rides/${selectedRide.id}`)}
            className="mt-4 w-full gap-2 font-bold bg-[#c1fbd4] text-black hover:bg-[#c1fbd4]/90 shadow-lg shadow-[#c1fbd4]/20"
          >
            {selectedRide.creator_id === currentUserId
              ? "Manage Your Ride Post →"
              : selectedRide.role === "driver"
              ? "Request Seat on this Ride →"
              : "Offer to Team Up →"}
          </Button>
        </div>
      )}

      {/* Floating Info Card for Selected Live Trip */}
      {selectedTrip && (
        <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-96 z-20 overflow-hidden rounded-2xl border border-red-500/40 bg-[#160f10]/95 p-5 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400 border border-red-500/40 animate-pulse">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground text-sm">
                    {selectedTrip.driver_profile?.full_name ?? "Verified Student"}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/20">
                    LIVE TRIP
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {selectedTrip.name ?? `${selectedTrip.pickup_label} → ${selectedTrip.dest_label}`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedTrip(null)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs text-foreground/90">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-aloe-text font-bold">Pickup:</span>
              <span className="font-medium truncate">{selectedTrip.pickup_label}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-cyan-400 font-bold">Dest:</span>
              <span className="font-medium truncate">{selectedTrip.dest_label}</span>
            </div>
            {selectedTrip.speed !== null && (
              <div className="flex items-center gap-2 pt-1 text-muted-foreground">
                <Navigation className="h-3.5 w-3.5 text-red-400" />
                <span>Speed: ~{Math.round((selectedTrip.speed ?? 0) * 3.6)} km/h</span>
              </div>
            )}
          </div>

          <Button
            onClick={() => router.push(`/groups/${selectedTrip.group_id}`)}
            className="mt-4 w-full gap-2 font-bold bg-red-500 text-foreground hover:bg-red-600 shadow-lg shadow-red-500/20"
          >
            Join Live Group Chat & Navigation →
          </Button>
        </div>
      )}
    </div>
  );
}

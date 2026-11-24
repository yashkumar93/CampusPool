/// <reference types="google.maps" />
import { useEffect, useRef, useState, useMemo } from "react";
import { decodePolyline } from "@/lib/polyline";
import { loadMapsScript } from "@/lib/maps-loader";
import { Car, Bus, Footprints, Bike, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

type LatLng = { lat: number; lng: number };

type Props = {
  pickup?: LatLng | null;
  destination?: LatLng | null;
  waypoints?: LatLng[];
  polyline?: string | null;
  driver?: LatLng | null;
  className?: string;
  onDestinationReached?: () => void;
};

declare global {
  interface Window {
    google?: typeof google;
    __nxtpoolMapsCb?: () => void;
    __nxtpoolMapsLoading?: Promise<void>;
  }
}

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#111213" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#747474" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#111213" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#282828" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1b1c1e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#222325" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#28292c" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#303236" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#222325" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#090a0b" }] },
];

// Helper to compute GPS distance in meters
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

export function TripMap({ pickup, destination, waypoints, polyline, driver, className, onDestinationReached }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Travel Mode state for Directions Service
  type TMode = "DRIVING" | "TRANSIT" | "WALKING" | "BICYCLING";
  const [travelMode, setTravelMode] = useState<TMode>("DRIVING");
  const [estDuration, setEstDuration] = useState<string>("");
  const [textDirections, setTextDirections] = useState<Array<{ instructions: string; distance: string; duration: string; lat?: number; lng?: number }>>([]);

  // Live GPS Navigation States
  const [navigating, setNavigating] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const hasTriggeredArrivalRef = useRef(false);

  useEffect(() => {
    if (!navigating) {
      hasTriggeredArrivalRef.current = false;
    }
  }, [navigating]);

  useEffect(() => {
    let mounted = true;
    loadMapsScript()
      .then(() => {
        if (!mounted || !ref.current) return;
        const center = pickup ?? destination ?? { lat: 16.4936, lng: 80.5006 };
        mapRef.current = new window.google!.maps.Map(ref.current, {
          center,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: false,
          scrollwheel: false,
          disableDoubleClickZoom: true,
          gestureHandling: "cooperative",
          styles: MAP_STYLES,
        });
        setReady(true);
      })
      .catch((e) => setError(e.message));
    return () => {
      mounted = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Update markers + polyline + directions
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google || navigating) return;
    const map = mapRef.current;
    
    // Clear static markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const bounds = new window.google.maps.LatLngBounds();
    
    // Pickup symbol
    if (pickup) {
      const m = new window.google.maps.Marker({
        map,
        position: pickup,
        title: "Pickup",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: "#ffffff",
          fillOpacity: 1,
          strokeColor: "#000000",
          strokeWeight: 4,
        },
      });
      markersRef.current.push(m);
      bounds.extend(pickup);
    }

    // Destination symbol
    if (destination) {
      const m = new window.google.maps.Marker({
        map,
        position: destination,
        title: "Destination",
        icon: {
          path: "M -5 -5 L 5 -5 L 5 5 L -5 5 Z",
          scale: 1,
          fillColor: "#000000",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      markersRef.current.push(m);
      bounds.extend(destination);
    }

    // Stops
    (waypoints ?? []).forEach((w, i) => {
      const m = new window.google!.maps.Marker({
        map,
        position: w,
        title: `Stop ${i + 1}`,
        icon: {
          path: window.google!.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: "#000000",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      markersRef.current.push(m);
      bounds.extend(w);
    });

    if (polyline) {
      const path = decodePolyline(polyline);
      polylineRef.current = new window.google.maps.Polyline({
        map,
        path,
        strokeColor: "#276EF1",
        strokeOpacity: 0.95,
        strokeWeight: 5,
      });
      path.forEach((p) => bounds.extend(p));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 60);
      }
      
      window.google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        const z = map.getZoom() ?? 13;
        map.setOptions({ minZoom: z, maxZoom: z });
      });
    } else if (pickup && destination) {
      const ds = new window.google.maps.DirectionsService();
      ds.route(
        {
          origin: pickup,
          destination,
          waypoints: (waypoints ?? []).map((w) => ({ location: w, stopover: true })),
          travelMode: window.google.maps.TravelMode[travelMode],
        },
        (result, status) => {
          if (status === "OK" && result?.routes?.[0]) {
            const route = result.routes[0];
            const path = route.overview_path;
            
            polylineRef.current = new window.google.maps.Polyline({
              map,
              path,
              strokeColor: "#276EF1",
              strokeOpacity: 0.95,
              strokeWeight: 5,
            });

            // Extract text directions steps with coordinates
            const steps = route.legs.flatMap((leg) =>
              leg.steps.map((step) => ({
                instructions: step.instructions,
                distance: step.distance?.text ?? "",
                duration: step.duration?.text ?? "",
                lat: step.start_location.lat(),
                lng: step.start_location.lng(),
              }))
            );
            setTextDirections(steps);

            const totalDurationSec = route.legs.reduce((acc, leg) => acc + (leg.duration?.value ?? 0), 0);
            const minutes = Math.round(totalDurationSec / 60);
            setEstDuration(minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} mins`);

            const routeBounds = new window.google.maps.LatLngBounds();
            path.forEach((p) => routeBounds.extend(p));
            map.fitBounds(routeBounds, 60);

            window.google.maps.event.addListenerOnce(map, "bounds_changed", () => {
              const z = map.getZoom() ?? 13;
              map.setOptions({ minZoom: z, maxZoom: z });
            });
          } else {
            console.error("Directions service failed:", status);
            setTextDirections([]);
            setEstDuration("");
            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, 60);
            }
          }
        }
      );
    } else {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 60);
      }
    }
  }, [ready, pickup, destination, waypoints, polyline, travelMode, navigating]);

  // Synchronize Live User GPS location marker
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    if (!userLocation || !navigating) {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      return;
    }
    if (!userMarkerRef.current) {
      userMarkerRef.current = new window.google.maps.Marker({
        map: mapRef.current,
        position: userLocation,
        title: "Your Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#2196F3", // Pulsing GPS Blue
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
    } else {
      userMarkerRef.current.setPosition(userLocation);
    }
  }, [ready, userLocation, navigating]);

  // Sync driver marker
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    if (!driver) {
      driverMarkerRef.current?.setMap(null);
      driverMarkerRef.current = null;
      return;
    }
    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new window.google.maps.Marker({
        map: mapRef.current,
        position: driver,
        title: "Driver",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#22c55e",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
    } else {
      driverMarkerRef.current.setPosition(driver);
    }
  }, [ready, driver]);

  // Navigation handlers
  const startNavigation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setNavigating(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(loc);
        if (mapRef.current) {
          mapRef.current.panTo(loc);
          mapRef.current.setOptions({
            zoom: 17,
            minZoom: 17,
            maxZoom: 17
          });
        }

        // Trigger arrival when user is within 30 meters of destination
        if (destination && !hasTriggeredArrivalRef.current) {
          const dist = getDistance(loc, destination);
          if (dist < 30) {
            hasTriggeredArrivalRef.current = true;
            if (onDestinationReached) {
              onDestinationReached();
            }
            stopNavigation();
          }
        }
      },
      (err) => {
        console.error("GPS tracking error:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000
      }
    );
  };

  const stopNavigation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setNavigating(false);
    setUserLocation(null);
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
  };

  // Compute upcoming turn details based on user GPS location relative to route steps
  const upcomingStep = useMemo(() => {
    if (!userLocation || textDirections.length === 0) return null;
    
    let closestStepIdx = 0;
    let minDistance = Infinity;

    textDirections.forEach((step, idx) => {
      if (step.lat !== undefined && step.lng !== undefined) {
        const dist = getDistance(userLocation, { lat: step.lat, lng: step.lng });
        if (dist < minDistance) {
          minDistance = dist;
          closestStepIdx = idx;
        }
      }
    });

    const step = textDirections[closestStepIdx];
    return {
      instructions: step.instructions,
      distanceTo: Math.round(minDistance),
      stepIndex: closestStepIdx,
    };
  }, [userLocation, textDirections]);

  if (error) {
    return (
      <div className={`surface-card flex flex-col items-center justify-center gap-2 p-6 text-sm text-muted-foreground ${className ?? ""}`}>
        <div className="text-xs">Map unavailable: {error}</div>
      </div>
    );
  }

  const showTravelModeSelector = !polyline && pickup && destination;

  return (
    <div className="space-y-4">
      {/* Map box container */}
      <div className={`relative w-full overflow-hidden rounded-lg border border-border h-72 ${className ?? ""}`}>
        {!ready && (
          <div className="absolute inset-0 z-10 shimmer" />
        )}
        
        {/* Floating Navigation HUD */}
        {ready && navigating && upcomingStep && (
          <div className="absolute inset-x-3 top-3 z-30 rounded-lg bg-black/90 p-3 shadow-2xl border border-primary/20 backdrop-blur animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/25 text-primary animate-pulse">
                <Navigation className="h-4.5 w-4.5 fill-current" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] uppercase tracking-widest text-primary font-semibold">
                  LIVE NAVIGATION
                </div>
                <div
                  dangerouslySetInnerHTML={{ __html: upcomingStep.instructions }}
                  className="text-xs font-medium text-foreground truncate [&>b]:font-semibold"
                />
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {upcomingStep.distanceTo > 1000
                    ? `In ${(upcomingStep.distanceTo / 1000).toFixed(1)} km`
                    : `In ${upcomingStep.distanceTo} meters`}
                </div>
              </div>
              <button
                type="button"
                onClick={stopNavigation}
                className="text-[10px] font-semibold text-destructive hover:bg-destructive/20 transition-colors uppercase bg-destructive/10 border border-destructive/20 rounded px-2 py-1 shrink-0"
              >
                Exit
              </button>
            </div>
          </div>
        )}

        {/* Floating Travel Mode Selector */}
        {ready && showTravelModeSelector && !navigating && (
          <div className="absolute left-3 top-3 z-20 flex gap-1 rounded-lg bg-background/90 p-1 shadow-lg backdrop-blur border border-border/80">
            {(
              [
                { mode: "DRIVING", icon: Car },
                { mode: "TRANSIT", icon: Bus },
                { mode: "WALKING", icon: Footprints },
                { mode: "BICYCLING", icon: Bike },
              ] as const
            ).map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTravelMode(mode)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                  travelMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={mode.toLowerCase()}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}

        {/* Start Navigation Overlay Button */}
        {ready && showTravelModeSelector && !navigating && (
          <button
            type="button"
            onClick={startNavigation}
            className="absolute right-3 bottom-3 z-20 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95 hover:bg-primary/95"
          >
            <Navigation className="h-3.5 w-3.5 fill-current" /> Start Navigation
          </button>
        )}

        <div ref={ref} className="w-full h-full" />
      </div>

      {/* Text Directions Panel */}
      {ready && textDirections.length > 0 && !navigating && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold flex items-center justify-between border-b border-border/60 pb-2 mb-3">
            <span className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              Directions ({travelMode.toLowerCase()})
            </span>
            <span className="text-xs text-primary font-medium">{estDuration}</span>
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-muted">
            {textDirections.map((step, idx) => (
              <div key={idx} className="flex gap-3 text-xs border-b border-border pb-2.5 last:border-0 last:pb-0">
                <span className="text-muted-foreground font-semibold min-w-[20px]">{idx + 1}.</span>
                <div className="flex-1">
                  <div
                    dangerouslySetInnerHTML={{ __html: step.instructions }}
                    className="text-foreground [&>b]:font-semibold"
                  />
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {step.distance} • {step.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
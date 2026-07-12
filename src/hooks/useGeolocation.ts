import { useEffect, useState, useCallback } from "react";

export type GeoState = {
  status: "idle" | "prompting" | "granted" | "denied" | "unsupported" | "error";
  coords: { lat: number; lng: number } | null;
  error?: string;
};

const KEY = "cp:geo:prompted";

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: "idle", coords: null });

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unsupported", coords: null });
      return;
    }
    setState((s) => ({ ...s, status: "prompting" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
        setState({
          status: "granted",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        });
      },
      (err) => {
        try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
        setState({
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
          coords: null,
          error: err.message,
        });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  // Prompt once per browser after login.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let prompted = false;
    try { prompted = localStorage.getItem(KEY) === "1"; } catch { /* ignore */ }
    if (prompted) return;
    // Check current permission before firing prompt to avoid double asks.
    const anyNav = navigator as Navigator & { permissions?: { query: (d: { name: PermissionName }) => Promise<PermissionStatus> } };
    if (anyNav.permissions?.query) {
      anyNav.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((res) => {
          if (res.state === "granted" || res.state === "prompt") request();
          else setState({ status: "denied", coords: null });
        })
        .catch(() => request());
    } else {
      request();
    }
  }, [request]);

  return { ...state, request };
}
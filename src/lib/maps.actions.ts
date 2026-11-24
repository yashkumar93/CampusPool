"use server";

import { z } from "zod";
import { createClient } from "@/integrations/supabase/server";

function getGoogleMapsConfig() {
  const lovableApiKey = process.env.LOVABLE_API_KEY;
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  const browserKey = process.env.NEXT_PUBLIC_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;

  if (lovableApiKey && googleMapsApiKey) {
    return {
      useGateway: true,
      baseUrl: "https://connector-gateway.lovable.dev/google_maps",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "X-Connection-Api-Key": googleMapsApiKey,
      } as Record<string, string>,
    };
  } else if (browserKey) {
    return {
      useGateway: false,
      baseUrl: "",
      apiKey: browserKey,
      headers: {
        "X-Goog-Api-Key": browserKey,
      } as Record<string, string>,
    };
  } else {
    throw new Error("Google Maps credentials missing");
  }
}

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

// Places API (New) — Autocomplete
export async function placesAutocomplete(rawInput: unknown) {
  await requireAuth();
  const data = z
    .object({
      input: z.string().min(1).max(120),
      sessionToken: z.string().min(1).max(64).optional(),
      biasLat: z.number().optional(),
      biasLng: z.number().optional(),
    })
    .parse(rawInput);

  const config = getGoogleMapsConfig();
  const body: Record<string, unknown> = {
    input: data.input,
    regionCode: "IN",
  };
  if (data.sessionToken) body.sessionToken = data.sessionToken;
  if (data.biasLat != null && data.biasLng != null) {
    body.locationBias = {
      circle: { center: { latitude: data.biasLat, longitude: data.biasLng }, radius: 50000 },
    };
  }

  const url = config.useGateway
    ? `${config.baseUrl}/places/v1/places:autocomplete`
    : `https://places.googleapis.com/v1/places:autocomplete`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...config.headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Places autocomplete failed [${res.status}]: ${t}`);
  }
  const json = (await res.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId: string;
        text?: { text: string };
        structuredFormat?: {
          mainText?: { text: string };
          secondaryText?: { text: string };
        };
      };
    }>;
  };
  return (json.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      placeId: p.placeId,
      main: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondary: p.structuredFormat?.secondaryText?.text ?? "",
    }));
}

export async function placeDetails(rawInput: unknown) {
  await requireAuth();
  const data = z
    .object({ placeId: z.string().min(1).max(300), sessionToken: z.string().optional() })
    .parse(rawInput);

  const config = getGoogleMapsConfig();
  const url = config.useGateway
    ? new URL(`${config.baseUrl}/places/v1/places/${encodeURIComponent(data.placeId)}`)
    : new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(data.placeId)}`);
  if (data.sessionToken) url.searchParams.set("sessionToken", data.sessionToken);

  const res = await fetch(url.toString(), {
    headers: {
      ...config.headers,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
    },
  });
  if (!res.ok) throw new Error(`Place details failed [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    location?: { latitude: number; longitude: number };
  };
  if (!json.location) throw new Error("Place has no location");
  return {
    placeId: json.id,
    label: json.displayName?.text ?? json.formattedAddress ?? "Location",
    address: json.formattedAddress ?? "",
    lat: json.location.latitude,
    lng: json.location.longitude,
  };
}

export async function reverseGeocode(rawInput: unknown) {
  await requireAuth();
  const data = z.object({ lat: z.number(), lng: z.number() }).parse(rawInput);

  const config = getGoogleMapsConfig();
  const url = config.useGateway
    ? `${config.baseUrl}/maps/api/geocode/json?latlng=${data.lat},${data.lng}`
    : `https://maps.googleapis.com/maps/api/geocode/json?latlng=${data.lat},${data.lng}&key=${config.apiKey}`;

  const res = await fetch(url, { headers: config.useGateway ? config.headers : {} });
  if (!res.ok) throw new Error(`Reverse geocode failed [${res.status}]`);
  const json = (await res.json()) as {
    results?: Array<{ formatted_address: string; place_id: string }>;
  };
  const first = json.results?.[0];
  return {
    placeId: first?.place_id ?? "",
    label: first?.formatted_address ?? `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`,
    lat: data.lat,
    lng: data.lng,
  };
}

const PointSchema = z.object({ lat: z.number(), lng: z.number() });

export async function computeRoute(rawInput: unknown) {
  await requireAuth();
  const data = z
    .object({
      origin: PointSchema,
      destination: PointSchema,
      waypoints: z.array(PointSchema).max(8).optional(),
    })
    .parse(rawInput);

  const config = getGoogleMapsConfig();
  const body: Record<string, unknown> = {
    origin: { location: { latLng: { latitude: data.origin.lat, longitude: data.origin.lng } } },
    destination: {
      location: { latLng: { latitude: data.destination.lat, longitude: data.destination.lng } },
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
  };
  if (data.waypoints?.length) {
    body.intermediates = data.waypoints.map((w) => ({
      location: { latLng: { latitude: w.lat, longitude: w.lng } },
    }));
  }

  const url = config.useGateway
    ? `${config.baseUrl}/routes/directions/v2:computeRoutes`
    : `https://routes.googleapis.com/v1/directions:computeRoutes`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...config.headers,
      "Content-Type": "application/json",
      "X-Goog-FieldMask":
        "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Routes failed [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as {
    routes?: Array<{
      distanceMeters?: number;
      duration?: string;
      polyline?: { encodedPolyline?: string };
      legs?: Array<{ distanceMeters?: number; duration?: string }>;
    }>;
  };
  const r = json.routes?.[0];
  if (!r) throw new Error("No route found");
  return {
    distanceKm: (r.distanceMeters ?? 0) / 1000,
    durationMin: parseSecondsFromDuration(r.duration) / 60,
    polyline: r.polyline?.encodedPolyline ?? "",
    legs: (r.legs ?? []).map((l) => ({
      distanceKm: (l.distanceMeters ?? 0) / 1000,
      durationMin: parseSecondsFromDuration(l.duration) / 60,
    })),
  };
}

function parseSecondsFromDuration(d?: string): number {
  if (!d) return 0;
  const m = d.match(/^(\d+(?:\.\d+)?)s$/);
  return m ? Number(m[1]) : 0;
}

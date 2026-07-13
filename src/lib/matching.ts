// Pure geometry helpers used by matching.

const R = 6371; // km

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Distance (km) from point P to segment A->B, projected on a local flat plane.
// Good enough over city scales.
export function pointToSegmentKm(
  p: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const kmPerDegLat = 111;
  const kmPerDegLng = 111 * Math.cos((a.lat * Math.PI) / 180);
  const ax = 0;
  const ay = 0;
  const bx = (b.lng - a.lng) * kmPerDegLng;
  const by = (b.lat - a.lat) * kmPerDegLat;
  const px = (p.lng - a.lng) * kmPerDegLng;
  const py = (p.lat - a.lat) * kmPerDegLat;
  const abx = bx - ax;
  const aby = by - ay;
  const denom = abx * abx + aby * aby;
  const t = denom === 0 ? 0 : Math.max(0, Math.min(1, (px * abx + py * aby) / denom));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

export interface RideForMatch {
  id: string;
  creator_id: string;
  role: "passenger" | "driver";
  pickup_lat: number;
  pickup_lng: number;
  dest_lat: number;
  dest_lng: number;
  depart_at: string; // ISO
  flex_minutes: number;
  status: string;
}

export interface MatchScore {
  score: number; // 0-100
  pickupKm: number;
  destKm: number;
  detourKm: number;
  timeDiffMin: number;
  matchReason?: string;
  isAiTopPick?: boolean;
}

export function scoreRides(
  a: RideForMatch,
  b: RideForMatch,
  myProfile?: any,
  candidateProfile?: any
): MatchScore | null {
  // Time window overlap
  const aT = new Date(a.depart_at).getTime();
  const bT = new Date(b.depart_at).getTime();
  const diffMin = Math.abs(aT - bT) / 60000;
  const combinedFlex = a.flex_minutes + b.flex_minutes;
  if (diffMin > combinedFlex) return null;

  const aP = { lat: a.pickup_lat, lng: a.pickup_lng };
  const aD = { lat: a.dest_lat, lng: a.dest_lng };
  const bP = { lat: b.pickup_lat, lng: b.pickup_lng };
  const bD = { lat: b.dest_lat, lng: b.dest_lng };

  const pickupKm = haversineKm(aP, bP);
  const destKm = haversineKm(aD, bD);

  // Route corridor: how far is B's destination from A's straight line?
  const detourKm = Math.min(
    pointToSegmentKm(bD, aP, aD),
    pointToSegmentKm(aD, bP, bD),
  );

  // Filters
  if (pickupKm > 5) return null;
  if (detourKm > 8) return null;

  // Scoring weights: Route (40%), Time (30%), Affinity (20%), Extra (10%)
  const pickupScore = Math.max(0, 1 - pickupKm / 5) * 20;
  const detourScore = Math.max(0, 1 - detourKm / 8) * 20;
  const timeScore = Math.max(0, 1 - diffMin / combinedFlex) * 30;
  
  let affinityScore = 0;
  let matchReasons = [];

  if (myProfile && candidateProfile) {
    if (myProfile.department === candidateProfile.department && myProfile.department) {
      affinityScore += 10;
      matchReasons.push("Same department");
    }
    if (myProfile.year === candidateProfile.year && myProfile.year) {
      affinityScore += 5;
    }
    if (candidateProfile.rating_avg && candidateProfile.rating_avg >= 4.5) {
      affinityScore += 5;
      matchReasons.push("Highly rated");
    }
  }

  // Base AI reasoning
  if (diffMin <= 5) matchReasons.push("Perfect time alignment");
  if (detourKm <= 1) matchReasons.push("Minimal detour");

  const score = Math.round(pickupScore + detourScore + timeScore + affinityScore + 10 /* base padding for generic */);
  
  let matchReason = undefined;
  let isAiTopPick = false;
  
  if (score >= 85) {
    isAiTopPick = true;
    matchReason = "✨ " + score + "% Match: " + (matchReasons.length > 0 ? matchReasons.slice(0, 2).join(" & ") : "Excellent route match");
  }

  return { score: Math.min(100, score), pickupKm, destKm, detourKm, timeDiffMin: diffMin, matchReason, isAiTopPick };
}
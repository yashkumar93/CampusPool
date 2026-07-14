import { supabase } from "@/integrations/supabase/client";
import { scoreRides, type RideForMatch, haversineKm } from "./matching";

async function requireAuth() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { userId: user.id };
}

export async function listLiveRides() {
  if (typeof window === "undefined") return [];

  const { userId } = await requireAuth();
  
  // Clean up expired rides on-demand
  try {
    await supabase.rpc("close_expired_rides" as never);
  } catch (err) {
    console.error("Failed to run close_expired_rides:", err);
  }

  const myProfile = await getMyProfile();
  if (!myProfile || !myProfile.college) return [];

  // Fetch classmates' profiles (same college)
  const { data: classmateProfiles } = await supabase
    .from("profiles_public")
    .select("id, full_name, department, rating_avg, rating_count, avatar_url, driving_license")
    .eq("college", myProfile.college);

  const classmateIds = (classmateProfiles ?? [])
    .map((p) => p.id)
    .filter((id): id is string => !!id);
  if (!classmateIds.length) return [];

  const now = new Date();
  const hi = new Date(now.getTime() + 6 * 60 * 60_000).toISOString();
  const lo = new Date(now.getTime() - 15 * 60_000).toISOString();

  const { data: rides, error } = await supabase
    .from("rides")
    .select(
      "id, role, pickup_label, dest_label, pickup_lat, pickup_lng, dest_lat, dest_lng, depart_at, seats, vehicle_type, estimated_cost, creator_id, status"
    )
    .eq("status", "open")
    .neq("creator_id", userId)
    .in("creator_id", classmateIds)
    .gte("depart_at", lo)
    .lte("depart_at", hi)
    .order("depart_at", { ascending: true })
    .limit(30);
  if (error) throw new Error(error.message);

  const map = new Map((classmateProfiles ?? []).map((p) => [p.id, p]));
  return (rides ?? []).map((r) => ({ ...r, profile: map.get(r.creator_id) ?? null }));
}

export async function listMyRides() {
  if (typeof window === "undefined") return [];

  const { userId } = await requireAuth();

  // Clean up expired rides on-demand
  try {
    await supabase.rpc("close_expired_rides" as any);
  } catch (err) {
    console.error("Failed to run close_expired_rides:", err);
  }

  const { data, error } = await supabase
    .from("rides")
    .select("*")
    .eq("creator_id", userId)
    .order("depart_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getRide({ rideId }: { rideId: string }) {
  if (typeof window === "undefined") return null;

  await requireAuth();
  const { data: ride, error } = await supabase
    .from("rides")
    .select("*")
    .eq("id", rideId)
    .single();
  if (error) throw new Error(error.message);
  return ride;
}

export async function findMatches({ rideId }: { rideId: string }) {
  if (typeof window === "undefined") return { mine: null, matches: [] };

  const { userId } = await requireAuth();

  const { data: mine, error: e1 } = await supabase
    .from("rides")
    .select("*")
    .eq("id", rideId)
    .single();
  if (e1 || !mine) throw new Error(e1?.message ?? "Ride not found");
  
  if (mine.creator_id !== userId) {
    const { data: creatorProfile } = await supabase
      .from("profiles_public")
      .select("id, full_name, department, year, rating_avg, rating_count, avatar_url")
      .eq("id", mine.creator_id)
      .maybeSingle();

    const { data: myRequest } = await supabase
      .from("join_requests")
      .select("*")
      .eq("target_ride_id", rideId)
      .eq("requester_id", userId)
      .maybeSingle();

    return {
      mine: {
        ...mine,
        creator_profile: creatorProfile ?? null,
        my_request: myRequest ?? null,
      },
      matches: [],
    };
  }

  const departTs = new Date(mine.depart_at).getTime();
  const windowMs = ((mine.flex_minutes ?? 15) + 60) * 60_000;
  const lo = new Date(departTs - windowMs).toISOString();
  const hi = new Date(departTs + windowMs).toISOString();

  const { data: candidates, error: e2 } = await supabase
    .from("rides")
    .select("*")
    .neq("creator_id", userId)
    .eq("status", "open")
    .gte("depart_at", lo)
    .lte("depart_at", hi)
    .limit(200);
  if (e2) throw new Error(e2.message);

  const allCandidateCreatorIds = Array.from(new Set((candidates ?? []).map(c => c.creator_id)));
  allCandidateCreatorIds.push(userId); // ensure my profile is fetched

  const { data: allProfiles } = await supabase
    .from("profiles_public")
    .select("id, full_name, department, year, rating_avg, rating_count, avatar_url, driving_license")
    .in("id", allCandidateCreatorIds);

  const profileMap = new Map((allProfiles ?? []).map((p) => [p.id, p]));
  const myProfile = profileMap.get(userId) || null;

  const mineForMatch = mine as unknown as RideForMatch;
  const scored = (candidates ?? [])
    .map((c) => {
      const candidateProfile = profileMap.get(c.creator_id) || null;
      const s = scoreRides(mineForMatch, c as unknown as RideForMatch, myProfile, candidateProfile);
      return s ? { ride: c, ...s, profile: candidateProfile } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return {
    mine,
    matches: scored,
  };
}

export async function listIncomingRequests({ rideId }: { rideId: string }) {
  if (typeof window === "undefined") return [];

  const { userId } = await requireAuth();
  const { data: ride } = await supabase
    .from("rides")
    .select("creator_id")
    .eq("id", rideId)
    .single();
  if (!ride || ride.creator_id !== userId) throw new Error("Not your ride");

  const { data: reqs } = await supabase
    .from("join_requests")
    .select("*")
    .eq("target_ride_id", rideId)
    .order("created_at", { ascending: false });

  const ids = Array.from(new Set((reqs ?? []).map((r) => r.requester_id)));
  const { data: profiles } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, department, year, rating_avg, rating_count, avatar_url, phone")
        .in("id", ids)
    : { data: [] };

  const map = new Map((profiles ?? []).map((p) => [p.id, p]));
  return (reqs ?? []).map((r) => ({ ...r, profile: map.get(r.requester_id) ?? null }));
}

export async function listMyNotifications() {
  if (typeof window === "undefined") return [];

  const { userId } = await requireAuth();

  // Get all my open/matched rides
  const { data: myRides } = await supabase
    .from("rides")
    .select("id, pickup_label, dest_label")
    .eq("creator_id", userId)
    .in("status", ["open", "matched"]);

  if (!myRides || myRides.length === 0) return [];

  const rideIds = myRides.map(r => r.id);
  const rideMap = new Map(myRides.map(r => [r.id, r]));

  // Get pending join requests for my rides
  const { data: reqs } = await supabase
    .from("join_requests")
    .select("*")
    .in("target_ride_id", rideIds)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!reqs || reqs.length === 0) return [];

  // Get requester profiles
  const requesterIds = Array.from(new Set(reqs.map(r => r.requester_id)));
  const { data: profiles } = await supabase
    .from("profiles_public")
    .select("id, full_name, avatar_url")
    .in("id", requesterIds);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  return reqs.map(r => ({
    ...r,
    ride: rideMap.get(r.target_ride_id) ?? null,
    profile: profileMap.get(r.requester_id) ?? null
  }));
}

export async function getGroup({ groupId }: { groupId: string }) {
  if (typeof window === "undefined") {
    return {
      group: null,
      members: [],
      messages: [],
      currentUserId: "",
      ratedUserIds: [],
    };
  }

  const { userId } = await requireAuth();

  const { data: group, error: eg } = await supabase
    .from("ride_groups")
    .select("*")
    .eq("id", groupId)
    .single();
  if (eg || !group) throw new Error(eg?.message ?? "Group not found");

  const { data: members, error: em } = await supabase
    .from("ride_group_members")
    .select("*")
    .eq("group_id", groupId);
  if (em) throw new Error(em.message);

  const memberIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, department, year, rating_avg, avatar_url, phone")
        .in("id", memberIds)
    : { data: [] };

  const rideIds = (members ?? []).map((m) => m.ride_id).filter(Boolean) as string[];
  const { data: rides } = rideIds.length
    ? await supabase
        .from("rides")
        .select("id, pickup_label, dest_label, seats, estimated_cost, vehicle_type")
        .in("id", rideIds)
    : { data: [] };

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(200);

  const { data: myRatings } = await supabase
    .from("ratings")
    .select("ratee_id")
    .eq("group_id", groupId)
    .eq("rater_id", userId);

  return {
    group,
    members: (members ?? []).map((m) => ({
      ...m,
      profile: (profiles ?? []).find((p) => p.id === m.user_id) ?? null,
      ride: (rides ?? []).find((r) => r.id === m.ride_id) ?? null,
    })),
    messages: messages ?? [],
    currentUserId: userId,
    ratedUserIds: (myRatings ?? []).map((r) => r.ratee_id),
  };
}

export async function getLatestTripLocation({ groupId }: { groupId: string }) {
  if (typeof window === "undefined") return null;

  await requireAuth();
  const { data: row } = await supabase
    .from("trip_locations")
    .select("lat, lng, heading, speed, recorded_at")
    .eq("group_id", groupId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return row;
}

export async function getMyProfile() {
  if (typeof window === "undefined") return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return profile;
}

export async function getPublicProfile({ userId }: { userId: string }) {
  if (typeof window === "undefined") return null;

  await requireAuth();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, college, department, year, gender, phone, hostel, avatar_url, verified, bio, rating_avg, rating_count, driving_license")
    .eq("id", userId)
    .single();
  if (error) throw new Error(error.message);
  return profile;
}

export async function listMyGroups() {
  if (typeof window === "undefined") return [];

  const { userId } = await requireAuth();
  const { data: members } = await supabase
    .from("ride_group_members")
    .select("group_id")
    .eq("user_id", userId);
  const ids = (members ?? []).map((m) => m.group_id);
  if (!ids.length) return [];
  const { data: groups } = await supabase
    .from("ride_groups")
    .select("*")
    .in("id", ids)
    .order("depart_at", { ascending: false });
  return groups ?? [];
}

export async function listCollegeClassmates() {
  if (typeof window === "undefined") return [];

  const profile = await getMyProfile();
  if (!profile || !profile.college) return [];

  const { data: classmates, error } = await supabase
    .from("profiles_public")
    .select("id, full_name, department, year, rating_avg, rating_count, avatar_url, college, verified")
    .eq("college", profile.college)
    .neq("id", profile.id)
    .order("full_name", { ascending: true })
    .limit(50);

  if (error) throw new Error(error.message);
  return classmates ?? [];
}

export type MapRadarRide = {
  id: string;
  role: "passenger" | "driver";
  pickup_label: string;
  dest_label: string;
  pickup_lat: number;
  pickup_lng: number;
  dest_lat: number;
  dest_lng: number;
  depart_at: string;
  seats: number;
  vehicle_type: string;
  estimated_cost: number | null;
  creator_id: string;
  profile: {
    id: string;
    full_name: string | null;
    department: string | null;
    rating_avg: number | null;
    rating_count: number | null;
    avatar_url: string | null;
    college: string | null;
  } | null;
};

export type MapRadarTrip = {
  group_id: string;
  name: string | null;
  status: string;
  driver_id: string | null;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  recorded_at: string;
  pickup_label: string;
  dest_label: string;
  driver_profile: {
    id: string;
    full_name: string | null;
    department: string | null;
    rating_avg: number | null;
  } | null;
};

export async function listMapRadarData(): Promise<{
  rides: MapRadarRide[];
  activeTrips: MapRadarTrip[];
}> {
  if (typeof window === "undefined") return { rides: [], activeTrips: [] };

  const { userId } = await requireAuth();
  const myProfile = await getMyProfile();
  if (!myProfile || !myProfile.college) return { rides: [], activeTrips: [] };

  const { data: profiles } = await supabase
    .from("profiles_public")
    .select("id, full_name, department, rating_avg, rating_count, avatar_url, college")
    .eq("college", myProfile.college);

  const classmateIds = (profiles ?? [])
    .map((p) => p.id)
    .filter((id): id is string => !!id);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const now = new Date();
  const hi = new Date(now.getTime() + 12 * 60 * 60_000).toISOString();
  const lo = new Date(now.getTime() - 30 * 60_000).toISOString();

  const { data: rawRides } = await supabase
    .from("rides")
    .select(
      "id, role, pickup_label, dest_label, pickup_lat, pickup_lng, dest_lat, dest_lng, depart_at, seats, vehicle_type, estimated_cost, creator_id, status"
    )
    .eq("status", "open")
    .in("creator_id", classmateIds)
    .gte("depart_at", lo)
    .lte("depart_at", hi)
    .order("depart_at", { ascending: true })
    .limit(100);

  const rides: MapRadarRide[] = (rawRides ?? []).map((r) => ({
    ...(r as any),
    profile: profileMap.get(r.creator_id) ?? null,
  }));

  const { data: inProgressGroups } = await supabase
    .from("ride_groups")
    .select("id, name, status, driver_id, pickup_label, dest_label")
    .eq("status", "in_progress")
    .limit(50);

  const activeTrips: MapRadarTrip[] = [];
  if (inProgressGroups && inProgressGroups.length > 0) {
    for (const g of inProgressGroups) {
      if (!g.driver_id || !classmateIds.includes(g.driver_id)) continue;
      const { data: loc } = await supabase
        .from("trip_locations")
        .select("lat, lng, heading, speed, recorded_at")
        .eq("group_id", g.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (loc) {
        activeTrips.push({
          group_id: g.id,
          name: g.name,
          status: g.status,
          driver_id: g.driver_id,
          lat: loc.lat,
          lng: loc.lng,
          heading: loc.heading,
          speed: loc.speed,
          recorded_at: loc.recorded_at,
          pickup_label: g.pickup_label,
          dest_label: g.dest_label,
          driver_profile: (profileMap.get(g.driver_id) as any) ?? null,
        });
      }
    }
  }

  return { rides, activeTrips };
}

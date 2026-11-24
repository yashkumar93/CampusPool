"use server";

import { z } from "zod";
import { createClient } from "@/integrations/supabase/server";
import { haversineKm } from "./matching";

const CreateRideInput = z.object({
  role: z.enum(["passenger", "driver"]),
  pickup_label: z.string().min(1).max(120),
  pickup_lat: z.number(),
  pickup_lng: z.number(),
  dest_label: z.string().min(1).max(120),
  dest_lat: z.number(),
  dest_lng: z.number(),
  depart_at: z.string(),
  flex_minutes: z.number().int().min(0).max(120),
  seats: z.number().int().min(1).max(6),
  vehicle_type: z.enum(["any", "bike", "car", "auto", "cab"]),
  estimated_cost: z.number().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { supabase, userId: user.id };
}

export async function createRide(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const data = CreateRideInput.parse(rawInput);
  const { data: ride, error } = await supabase
    .from("rides")
    .insert({ ...data, creator_id: userId })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return ride;
}

export async function joinMatch(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const { myRideId, otherRideId } = z
    .object({ myRideId: z.string().uuid(), otherRideId: z.string().uuid() })
    .parse(rawInput);

  const { data: rides, error: e1 } = await supabase
    .from("rides")
    .select("*")
    .in("id", [myRideId, otherRideId]);
  if (e1) throw new Error(e1.message);
  const mine = rides?.find((r) => r.id === myRideId);
  const other = rides?.find((r) => r.id === otherRideId);
  if (!mine || !other) throw new Error("Ride not found");
  if (mine.creator_id !== userId) throw new Error("Not your ride");

  let groupId = other.group_id;
  if (!groupId) {
    const { data: group, error: eg } = await supabase
      .from("ride_groups")
      .insert({
        created_by: userId,
        depart_at: mine.depart_at,
        pickup_label: mine.pickup_label,
        dest_label: other.dest_label,
        name: `${mine.pickup_label} → ${other.dest_label}`,
        status: "matched",
      })
      .select("id")
      .single();
    if (eg || !group) throw new Error(eg?.message ?? "Failed to create group");
    groupId = group.id;

    await supabase.from("ride_group_members").insert({
      group_id: groupId,
      user_id: other.creator_id,
      ride_id: other.id,
      role: other.role,
    });
    await supabase
      .from("rides")
      .update({ group_id: groupId, status: "matched" })
      .eq("id", other.id);
  }

  await supabase.from("ride_group_members").insert({
    group_id: groupId!,
    user_id: userId,
    ride_id: mine.id,
    role: mine.role,
  });
  await supabase
    .from("rides")
    .update({ group_id: groupId, status: "matched" })
    .eq("id", mine.id);

  return { groupId };
}

export async function sendMessage(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const { groupId, body, reply_to } = z
    .object({
      groupId: z.string().uuid(),
      body: z.string().min(1).max(1000),
      reply_to: z.string().uuid().optional(),
    })
    .parse(rawInput);

  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      group_id: groupId,
      user_id: userId,
      body: body.trim(),
      ...(reply_to ? { reply_to } : {}),
    } as Record<string, unknown>)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return msg;
}

export async function completeRide(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const { groupId } = z.object({ groupId: z.string().uuid() }).parse(rawInput);

  const { data: group } = await supabase
    .from("ride_groups")
    .select("*")
    .eq("id", groupId)
    .single();
  if (!group) throw new Error("Group not found");
  if (group.created_by !== userId) throw new Error("Only creator can complete");

  await supabase
    .from("ride_groups")
    .update({ status: "completed" })
    .eq("id", groupId);
  return { ok: true };
}

export async function submitRating(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const { groupId, rateeId, stars, comment } = z
    .object({
      groupId: z.string().uuid(),
      rateeId: z.string().uuid(),
      stars: z.number().int().min(1).max(5),
      comment: z.string().max(500).optional().nullable(),
    })
    .parse(rawInput);

  const { error } = await supabase.from("ratings").insert({
    group_id: groupId,
    rater_id: userId,
    ratee_id: rateeId,
    stars: stars,
    comment: comment ?? null,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

const FARE_PER_KM = 12;

async function recomputeGroupSharesInternal(supabase: any, groupId: string) {
  const [{ data: group }, { data: members }] = await Promise.all([
    supabase.from("ride_groups").select("*").eq("id", groupId).single(),
    supabase.from("ride_group_members").select("*").eq("group_id", groupId),
  ]);
  if (!group || !members?.length) return;

  const driver = members.find((m: any) => m.user_id === group.driver_id) ?? members[0];

  const origin =
    driver.pickup_lat != null && driver.pickup_lng != null
      ? { lat: driver.pickup_lat, lng: driver.pickup_lng }
      : { lat: group.pickup_lat ?? 0, lng: group.pickup_lng ?? 0 };
  const dest =
    driver.dest_lat != null && driver.dest_lng != null
      ? { lat: driver.dest_lat, lng: driver.dest_lng }
      : { lat: group.dest_lat ?? 0, lng: group.dest_lng ?? 0 };

  const legs = members.map((m: any) => {
    const pPickup =
      m.pickup_lat != null && m.pickup_lng != null
        ? { lat: m.pickup_lat, lng: m.pickup_lng }
        : origin;
    const pDest =
      m.dest_lat != null && m.dest_lng != null
        ? { lat: m.dest_lat, lng: m.dest_lng }
        : dest;
    return { memberId: m.id, leg: haversineKm(pPickup, pDest) };
  });
  const totalLegSum = legs.reduce((s: number, l: any) => s + l.leg, 0) || 1;

  const totalTripKm = haversineKm(origin, dest);
  const totalFare =
    group.total_fare_estimate ?? Math.max(30, Math.round(totalTripKm * FARE_PER_KM));

  await Promise.all(
    legs.map(({ memberId, leg }: any) =>
      supabase
        .from("ride_group_members")
        .update({
          leg_distance_km: Number(leg.toFixed(2)),
          share_amount: Number(((leg / totalLegSum) * totalFare).toFixed(2)),
        })
        .eq("id", memberId)
    ),
  );

  await supabase
    .from("ride_groups")
    .update({
      total_distance_km: Number(totalTripKm.toFixed(2)),
      total_fare_estimate: totalFare,
    })
    .eq("id", groupId);
}

const JoinRequestInput = z.object({
  targetRideId: z.string().uuid(),
  seats: z.number().int().min(1).max(6).default(1),
  message: z.string().max(300).optional(),
  pickup: z.object({ label: z.string(), lat: z.number(), lng: z.number() }).optional(),
  dest: z.object({ label: z.string(), lat: z.number(), lng: z.number() }).optional(),
});

export async function requestJoin(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const data = JoinRequestInput.parse(rawInput);

  const { data: target, error } = await supabase
    .from("rides")
    .select("*")
    .eq("id", data.targetRideId)
    .single();
  if (error || !target) throw new Error("Ride not found");
  if (target.creator_id === userId) throw new Error("Can't request your own ride");

  const { data: existing } = await supabase
    .from("join_requests")
    .select("status")
    .eq("target_ride_id", data.targetRideId)
    .eq("requester_id", userId)
    .maybeSingle();
  if (existing?.status === "declined") {
    throw new Error("This join request was declined by the driver");
  }

  const { data: req, error: e2 } = await supabase
    .from("join_requests")
    .upsert(
      {
        target_ride_id: data.targetRideId,
        requester_id: userId,
        seats_requested: data.seats,
        message: data.message ?? null,
        pickup_label: data.pickup?.label ?? null,
        pickup_lat: data.pickup?.lat ?? null,
        pickup_lng: data.pickup?.lng ?? null,
        dest_label: data.dest?.label ?? null,
        dest_lat: data.dest?.lat ?? null,
        dest_lng: data.dest?.lng ?? null,
        status: "pending",
      },
      { onConflict: "target_ride_id,requester_id" }
    )
    .select("*")
    .single();
  if (e2) throw new Error(e2.message);
  return req;
}

export async function respondJoinRequest(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const { requestId, accept } = z
    .object({ requestId: z.string().uuid(), accept: z.boolean() })
    .parse(rawInput);

  const { data: req, error } = await supabase
    .from("join_requests")
    .select("*")
    .eq("id", requestId)
    .single();
  if (error || !req) throw new Error("Request not found");

  const { data: target, error: tErr } = await supabase
    .from("rides")
    .select("*")
    .eq("id", req.target_ride_id)
    .single();
  if (tErr || !target || target.creator_id !== userId) throw new Error("Not your ride");

  if (!accept) {
    const { error: decErr } = await supabase.from("join_requests").update({ status: "declined" }).eq("id", req.id);
    if (decErr) throw new Error(decErr.message);
    return { ok: true };
  }

  let groupId = target.group_id;
  if (!groupId) {
    const { data: group, error: eg } = await supabase
      .from("ride_groups")
      .insert({
        created_by: userId,
        driver_id: target.role === "driver" ? userId : null,
        depart_at: target.depart_at,
        pickup_label: target.pickup_label,
        dest_label: target.dest_label,
        name: `${target.pickup_label} → ${target.dest_label}`,
        status: "matched",
      })
      .select("id")
      .single();
    if (eg || !group) throw new Error(eg?.message ?? "Failed to create group");
    groupId = group.id;

    const { data: creatorMember } = await supabase
      .from("ride_group_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", target.creator_id)
      .maybeSingle();
    if (!creatorMember) {
      const { error: insErr } = await supabase.from("ride_group_members").insert({
        group_id: groupId,
        user_id: target.creator_id,
        ride_id: target.id,
        role: target.role,
        pickup_lat: target.pickup_lat,
        pickup_lng: target.pickup_lng,
        pickup_label: target.pickup_label,
        dest_lat: target.dest_lat,
        dest_lng: target.dest_lng,
        dest_label: target.dest_label,
        member_status: "accepted",
      });
      if (insErr && !insErr.message.includes("duplicate key")) throw new Error(insErr.message);
    }

    const { error: upErr } = await supabase
      .from("rides")
      .update({ group_id: groupId, status: "matched" })
      .eq("id", target.id);
    if (upErr) throw new Error(upErr.message);

    if (target.estimated_cost) {
      await supabase
        .from("ride_groups")
        .update({ total_fare_estimate: target.estimated_cost })
        .eq("id", groupId);
    }
  }

  let requesterRole: "passenger" | "driver" = "passenger";
  if (req.requester_ride_id) {
    const { data: reqRide } = await supabase
      .from("rides")
      .select("role")
      .eq("id", req.requester_ride_id)
      .maybeSingle();
    if (reqRide?.role === "driver") requesterRole = "driver";
  }

  const { data: reqMember } = await supabase
    .from("ride_group_members")
    .select("id")
    .eq("group_id", groupId!)
    .eq("user_id", req.requester_id)
    .maybeSingle();
  if (!reqMember) {
    const pickupLat = req.pickup_lat ?? target.pickup_lat;
    const pickupLng = req.pickup_lng ?? target.pickup_lng;
    const destLat = req.dest_lat ?? target.dest_lat;
    const destLng = req.dest_lng ?? target.dest_lng;
    const { error: rmErr } = await supabase.from("ride_group_members").insert({
      group_id: groupId!,
      user_id: req.requester_id,
      ride_id: req.requester_ride_id,
      role: requesterRole,
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      pickup_label: req.pickup_label ?? target.pickup_label,
      dest_lat: destLat,
      dest_lng: destLng,
      dest_label: req.dest_label ?? target.dest_label,
      member_status: "accepted",
    });
    if (rmErr && !rmErr.message.includes("duplicate key")) throw new Error(rmErr.message);
  }

  if (req.requester_ride_id) {
    await supabase
      .from("rides")
      .update({ group_id: groupId!, status: "matched" })
      .eq("id", req.requester_ride_id);
  }

  const { error: jrErr } = await supabase
    .from("join_requests")
    .update({ status: "accepted" })
    .eq("id", req.id);
  if (jrErr) throw new Error(jrErr.message);

  await recomputeGroupSharesInternal(supabase, groupId!);
  return { ok: true, groupId };
}

export async function startTrip(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const { groupId } = z.object({ groupId: z.string().uuid() }).parse(rawInput);

  const { data: g } = await supabase
    .from("ride_groups")
    .select("*")
    .eq("id", groupId)
    .single();
  if (!g) throw new Error("Group not found");

  if (g.driver_id && g.driver_id !== userId) {
    throw new Error("Only the assigned driver can start the trip");
  }
  if (!g.driver_id) {
    const { data: membership } = await supabase
      .from("ride_group_members")
      .select("id")
      .eq("group_id", g.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!membership) throw new Error("You are not a member of this group");
    await supabase.from("ride_groups").update({ driver_id: userId }).eq("id", g.id);
  }

  const { error } = await supabase
    .from("ride_groups")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", groupId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function postTripLocation(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const data = z
    .object({
      groupId: z.string().uuid(),
      lat: z.number(),
      lng: z.number(),
      heading: z.number().nullable().optional(),
      speed: z.number().nullable().optional(),
      accuracy: z.number().nullable().optional(),
    })
    .parse(rawInput);

  const { error } = await supabase.from("trip_locations").insert({
    group_id: data.groupId,
    user_id: userId,
    lat: data.lat,
    lng: data.lng,
    heading: data.heading ?? null,
    speed: data.speed ?? null,
    accuracy: data.accuracy ?? null,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function setGroupRoute(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const data = z
    .object({
      groupId: z.string().uuid(),
      polyline: z.string(),
      distanceKm: z.number(),
      durationMin: z.number(),
    })
    .parse(rawInput);

  const { data: g } = await supabase
    .from("ride_groups")
    .select("driver_id, created_by")
    .eq("id", data.groupId)
    .single();
  if (!g) throw new Error("Group not found");
  if (g.driver_id !== userId && g.created_by !== userId) throw new Error("Not allowed");

  await supabase
    .from("ride_groups")
    .update({
      route_polyline: data.polyline,
      total_distance_km: data.distanceKm,
      total_duration_min: data.durationMin,
    })
    .eq("id", data.groupId);
  await recomputeGroupSharesInternal(supabase, data.groupId);
  return { ok: true };
}

const UpdateProfileInput = z.object({
  full_name: z.string().min(1).max(80),
  department: z.string().max(80).nullable().optional(),
  year: z.string().max(20).nullable().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  hostel: z.string().max(80).nullable().optional(),
  bio: z.string().max(300).nullable().optional(),
  driving_license: z.string().max(50).nullable().optional(),
});

export async function updateMyProfile(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const data = UpdateProfileInput.parse(rawInput);

  const { error } = await supabase.from("profiles").update(data).eq("id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function cancelRide(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const { rideId } = z.object({ rideId: z.string().uuid() }).parse(rawInput);

  const { data: ride, error: e1 } = await supabase
    .from("rides")
    .select("*")
    .eq("id", rideId)
    .single();
  if (e1 || !ride) throw new Error("Ride not found");
  if (ride.creator_id !== userId) throw new Error("Not authorized");

  const { error: e2 } = await supabase
    .from("rides")
    .update({ status: "cancelled" })
    .eq("id", rideId);
  if (e2) throw new Error(e2.message);

  if (ride.group_id) {
    await supabase
      .from("ride_group_members")
      .delete()
      .eq("group_id", ride.group_id)
      .eq("user_id", userId);
    
    await recomputeGroupSharesInternal(supabase, ride.group_id);
  }

  return { ok: true };
}

export async function closeRide(rawInput: unknown) {
  const { supabase, userId } = await requireAuth();
  const { rideId } = z.object({ rideId: z.string().uuid() }).parse(rawInput);

  const { data: ride, error: e1 } = await supabase
    .from("rides")
    .select("*")
    .eq("id", rideId)
    .single();
  if (e1 || !ride) throw new Error("Ride not found");
  if (ride.creator_id !== userId) throw new Error("Not authorized");

  const { error: e2 } = await supabase
    .from("rides")
    .update({ status: "completed" })
    .eq("id", rideId);
  if (e2) throw new Error(e2.message);

  return { ok: true };
}

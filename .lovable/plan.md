
# CampusPool — Phase 1 MVP Plan

Clean, minimal, map-forward UI (Uber/Rapido feel). Mobile-first. Built on TanStack Start + Lovable Cloud.

## Scope (Phase 1 only)
- VIT-AP verified signup (email domain gate)
- Create ride requests (passenger) & ride offers (driver)
- Route/time matching → matched groups
- Group chat per ride
- Ratings after ride
- Basic fare split display

Explicitly deferred: live GPS tracking, Uber/Ola price comparison, gamification, AI recommendations, multi-college, payments, SOS, women-only mode.

## Tech
- **Frontend**: TanStack Start (already scaffolded), Tailwind v4, shadcn
- **Backend**: Lovable Cloud (Postgres + Auth + Realtime)
- **Auth**: Email + password, restricted to `@vitap.ac.in` and `@vitstudent.ac.in`
- **Matching**: PostGIS-lite via lat/lng bounding boxes + Haversine + time-window overlap (pure SQL, no Google Maps in Phase 1). Cheap and works without paid APIs.
- **Realtime chat**: Supabase Realtime on `messages` table

## Design System
Uber/Rapido-inspired: near-black surfaces, single warm accent (amber/lime), lots of whitespace, sharp corners with subtle radius, Inter/Geist typography, dense info cards, map-forward hero. Tokens defined in `src/styles.css`.

## Data Model
```text
profiles           id → auth.users, full_name, department, year, gender, phone, hostel, avatar_url, verified
user_roles         user_id, role (student/admin) — separate table
rides              id, creator_id, role (passenger|driver), pickup_label, pickup_lat, pickup_lng,
                   dest_label, dest_lat, dest_lng, depart_at, flex_minutes, seats, vehicle_type,
                   notes, status (open|matched|completed|cancelled)
ride_matches       id, ride_a, ride_b, score
ride_groups        id, name, status, created_at
ride_group_members group_id, user_id, ride_id, role, joined_at
messages           id, group_id, user_id, body, created_at
ratings            id, ride_group_id, rater_id, ratee_id, stars, comment
```
RLS everywhere; grants for `authenticated` + `service_role`. `has_role()` security-definer function.

## Routes
```text
/                       Landing (public)
/auth                   Sign in / sign up (public)
/_authenticated/
  home                  Dashboard: my rides + quick actions
  rides/new             Create request or offer (toggle)
  rides/search          Matches list for a request
  rides/$id             Ride detail
  groups/$id            Ride group + chat
  profile               Profile & ratings
```

## Matching Algorithm (Phase 1, no external maps)
Server function `findMatches(rideId)`:
1. Filter rides where `depart_at` within ±flex window
2. Pickup within ~2 km (bounding box + Haversine)
3. Destination bearing similar OR destination within corridor of the other's route (approx: dest B lies within X km of the A→dest line segment)
4. Score = weighted sum (pickup proximity, dest overlap, time diff, same hostel/department bonus)
5. Return top matches with score ≥ threshold

Location entry: text label + lat/lng via a curated list of VIT-AP + Vijayawada landmarks (Amaravati, Benz Circle, Railway Station, Airport, MG Road, Guntur, etc.) — dropdown, no map API needed for MVP.

## Chat
- Server fn to post message
- Client subscribes to `messages` filtered by `group_id` via Supabase Realtime

## Build Order
1. Enable Lovable Cloud
2. Design tokens in `src/styles.css`
3. Migration: profiles, roles, rides, groups, messages, ratings + RLS + grants + trigger to auto-create profile
4. Auth pages with VIT email gate
5. Landing page
6. Authenticated shell + dashboard
7. Create ride form (with landmark picker)
8. Matching server fn + search results UI
9. Ride group + chat with realtime
10. Ratings flow
11. Sitemap/robots, root head metadata

Rough size: ~25–35 files. I'll ship it in one focused build.

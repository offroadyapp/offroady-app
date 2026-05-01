# Offroady Project Overview

## What Offroady Is

Offroady is a local off-road community website built for BC (British Columbia) off-roaders. Its core purpose is to help people **decide where to go and who to go with**.

The product is simple: find a trail, find some good people, and go have fun. It is not a generic social network — it's a focused tool for off-roaders who actually want to get outside and drive.

**Tagline:** *Find a trail. Find some good people. Go have fun.*

## Core Product Goal

Help BC off-roaders discover trails, plan trips, and meet others for the ride, with minimal friction.

## Main User Flows

### Browse Trails
Users can browse a catalog of BC off-road trails. Trails are grouped by region, filterable by difficulty, and displayed as cards on the Trails listing page. Each trail has a detail page with photos, route info, vehicle recommendations, and planned trips.

### Plan a Trip
Logged-in members can create a new trip plan for any trail. Required fields: date, meetup area, departure time, share name. Trip plans appear on the trail detail page and in the "Join a Trip" listing.

### Join a Trip
Members can browse upcoming trips and join them. Once joined, they gain access to the Trip Chat for that trip and appear in the participant list.

### Trip Chat
Each trip has a scoped chat room available to the trip planner and joined participants. Used for coordinating timing, meeting point, trail conditions, and last-minute updates.

### Weekly Digest
A curated weekly email / web page featuring a "Trail of the Week", upcoming trips, and external community events. Users can subscribe via email.

### Community Features
Members can:
- Have a public profile (display name, rig info, bio, photo)
- Favourite trails, trips, crew members
- Send direct messages to other members (with daily limit: 5 new people per day)
- Send and receive trip invites
- Propose new trails
- Leave comments on trails

## Supported Features (Phase Summary)

| Feature | Status |
|---------|--------|
| Trail catalog + detail pages | ✅ Live |
| Trail cards + images + map | ✅ Live |
| Trail proposals | ✅ Live |
| Auth (email + OAuth) | ✅ Live (social OAuth removed) |
| Trip planning + joining | ✅ Live |
| Trip Chat MVP | ✅ Live |
| Favourites (trails, trips, crews, members) | ✅ Live |
| Email sharing (trail + trip) | ✅ Live (Resend) |
| Weekly digest pipeline | ✅ Live |
| External community events | ✅ Live |
| Community direct messages | ✅ Live |
| Site notifications | ✅ Live |
| Email preferences + unsubscribe | ✅ Live |
| Crews | ✅ Live |

## Target Audience

BC off-roaders — people with 4x4s, trucks, SUVs, or off-road vehicles who want to explore BC's forest service roads, scenic routes, and tougher trails. The product is designed for English-speaking users in British Columbia, Canada.

## Key Boundaries

- BC trails only (not a global platform)
- Not a replacement for professional trail databases
- Not a social media platform — conversations should lead to real trips

-- Offroady sample profile seed
-- Safe to re-run. Updates an existing account if the email is already present.

update public.users
set
  display_name = 'TrailScout',
  profile_slug = 'trailscout',
  bio = 'I like off-roading, scenic routes, and trips that are just unpredictable enough to be memorable. I drive a 2022 Wrangler Rubicon 4xe with a WARN winch and onboard air, and I''ve been wheeling since 2021 around Mission, Squamish, and other BC spots, with a few runs around Toronto too. I''ve done recoveries, needed recoveries, and picked up a few lessons the hard way. Back home, I''ve got a golden British Shorthair named Kiwi who is a lot cleaner than my Jeep. Always up for good trails, good people, and trips beyond BC.',
  avatar_image = '/images/TrailScout.jpg',
  rig_name = '2022 Jeep Wrangler Rubicon 4xe',
  rig_photo = '/images/4xe-rock.jpg',
  rig_mods = ARRAY['WARN winch', 'onboard air pump'],
  experience_since = 2021,
  areas_driven = ARRAY['Mission', 'Squamish', 'Greater Vancouver area', 'Toronto area'],
  pet_name = 'Kiwi',
  pet_note = 'Golden British Shorthair. Much cleaner than the Jeep.',
  share_vibe = 'Friendly, adventurous, and always up for a good trail story.',
  updated_at = now()
where lower(email) = lower('cheng108@me.com');

insert into public.users (
  email,
  display_name,
  profile_slug,
  bio,
  avatar_image,
  rig_name,
  rig_photo,
  rig_mods,
  experience_since,
  areas_driven,
  pet_name,
  pet_note,
  share_vibe
)
select
  'cheng108@me.com',
  'TrailScout',
  'trailscout',
  'I like off-roading, scenic routes, and trips that are just unpredictable enough to be memorable. I drive a 2022 Wrangler Rubicon 4xe with a WARN winch and onboard air, and I''ve been wheeling since 2021 around Mission, Squamish, and other BC spots, with a few runs around Toronto too. I''ve done recoveries, needed recoveries, and picked up a few lessons the hard way. Back home, I''ve got a golden British Shorthair named Kiwi who is a lot cleaner than my Jeep. Always up for good trails, good people, and trips beyond BC.',
  '/images/TrailScout.jpg',
  '2022 Jeep Wrangler Rubicon 4xe',
  '/images/4xe-rock.jpg',
  ARRAY['WARN winch', 'onboard air pump'],
  2021,
  ARRAY['Mission', 'Squamish', 'Greater Vancouver area', 'Toronto area'],
  'Kiwi',
  'Golden British Shorthair. Much cleaner than the Jeep.',
  'Friendly, adventurous, and always up for a good trail story.'
where not exists (
  select 1 from public.users where lower(email) = lower('cheng108@me.com')
);

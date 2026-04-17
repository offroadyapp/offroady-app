export type SampleProfile = {
  displayName: string;
  profileSlug: string;
  email: string;
  bio: string;
  avatarImage: string;
  rigName: string;
  rigPhoto: string;
  rigMods: string[];
  experienceSince: number;
  areasDriven: string[];
  petName: string;
  petNote: string;
  shareVibe: string;
};

export const trailScoutProfile: SampleProfile = {
  displayName: 'TrailScout',
  profileSlug: 'trailscout',
  email: 'cheng108@me.com',
  bio: "I like off-roading, scenic routes, and trips that are just unpredictable enough to be memorable. I drive a 2022 Wrangler Rubicon 4xe with a WARN winch and onboard air, and I've been wheeling since 2021 around Mission, Squamish, and other BC spots, with a few runs around Toronto too. I've done recoveries, needed recoveries, and picked up a few lessons the hard way. Back home, I've got a golden British Shorthair named Kiwi who is a lot cleaner than my Jeep. Always up for good trails, good people, and trips beyond BC.",
  avatarImage: '/images/TrailScout.jpg',
  rigName: '2022 Jeep Wrangler Rubicon 4xe',
  rigPhoto: '/images/4xe-rock.jpg',
  rigMods: ['WARN winch', 'onboard air pump'],
  experienceSince: 2021,
  areasDriven: ['Mission', 'Squamish', 'Greater Vancouver area', 'Toronto area'],
  petName: 'Kiwi',
  petNote: 'Golden British Shorthair. Much cleaner than the Jeep.',
  shareVibe: 'Friendly, adventurous, and always up for a good trail story.',
};

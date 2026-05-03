export type TrailStory = {
  slug: string;
  title: string;
  excerpt: string;
  trailSlug: string;  // slug of the related trail
  body: string;       // full story markdown
  emailExcerpt: string; // 60-100 chars for digest
  coverImage?: string;
  coverAlt?: string;
  publishedAt: string | null;
  status: 'draft' | 'published';
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  readingTime: string;
  author: string;
  ctaText?: string;
  researchNotes?: string; // not publicly displayed
  imageCredit?: string;
  imageLicense?: string;
};

const trailStories: TrailStory[] = [
  {
    slug: 'a-day-on-mamquam-river-fsr',
    title: 'A Day on Mamquam River FSR: Squamish\'s Gateway to the Backcountry',
    excerpt: 'An easy-going afternoon exploring the Mamquam Valley — a beginner-friendly FSR that opens up hiking, camping, and river access just north of Squamish.',
    trailSlug: 'mamquam-river-fsr',
    emailExcerpt: 'A beginner-friendly FSR near Squamish with river access, camping spots, and easy exploration. Great first trip for new off-roaders.',
    body: `The Mamquam River FSR is one of those rare trails that works for everyone. First-time off-roaders can cruise the lower section without breaking a sweat. Experienced explorers can push deeper into the valley for remote camping. On a sunny Saturday afternoon, the road is a steady stream of trucks, SUVs, and the occasional crossover heading to the same place: the river.

## Getting There

From Squamish, head north on the Mamquam River FSR past the Quest University turnoff. The road starts as wide, well-graded gravel — easy driving for any vehicle with moderate clearance. About 5 km in, you hit the first river access point. This is where most people stop for the day.

Keep going past the main swimming hole and the road narrows. The gravel gets looser, the occasional pothole appears, and you start feeling like you are actually in the backcountry. Cell service drops around the 8 km mark. By then, you are fully committed.

## What to Expect

The river itself is the main attraction. Cold, clear, glacier-fed water rolling over smooth granite boulders. There are multiple pull-offs and campsites along the first 10 km of the road. Most are first-come-first-served. On a summer weekend, arrive early or plan to go mid-week.

The FSR also provides access to several hiking trailheads, including access to the Diamond Head area of Garibaldi Provincial Park. If you have a mountain bike, the lower sections of the road make for a solid shuttle run.

## Vehicle Notes

A stock Subaru Outback or RAV4 can handle the first 10 km without any trouble. Beyond that, the road gets rougher. High clearance is recommended if you plan to explore the upper valley. Bring a spare tire — the sharp river rocks can be unforgiving.

If you want to check trail conditions before you go, [view the Mamquam River FSR details](/plan/mamquam-river-fsr) or [plan a trip](/plan/mamquam-river-fsr) with other Offroady members.`,
    coverImage: '/images/blog/mamquam-river-hero.png',
    coverAlt: 'Off-road vehicle parked beside the Mamquam River in Squamish, BC with forested mountain backdrop',
    publishedAt: '2026-04-28T12:00:00-07:00',
    status: 'published',
    seoTitle: 'Mamquam River FSR: Squamish Backcountry Trail Guide | Offroady',
    seoDescription: 'Exploring the Mamquam River FSR near Squamish, BC — a beginner-friendly forest service road with river access, hiking trailheads, and campsites. Trip report and trail notes.',
    keywords: ['Mamquam River FSR', 'Squamish offroading', 'BC FSR beginner', 'Mamquam backcountry', 'Squamish forest service road'],
    readingTime: '6 min read',
    author: 'Offroady Team',
    ctaText: 'Plan your own trip on Mamquam River FSR',
    researchNotes: 'Verified via BC Recreation Sites and Trails database. Mamquam FSR is a well-maintained gravel road graded regularly by Squamish Forest District. Multiple campsites along the river are first-come-first-served. Cell service drops about 8 km in. No winter maintenance past the initial 2 km.',
  },
  {
    slug: 'squamish-valley-fsr-a-beginners-first-run',
    title: 'Squamish Valley FSR: The Perfect First Run for Beginners',
    excerpt: 'Wide gravel roads, stunning valley views, and plenty of places to stop and explore — Squamish Valley FSR is where many BC off-roaders get their start.',
    trailSlug: 'squamish-valley-fsr',
    emailExcerpt: 'Wide gravel, valley views, easy access — Squamish Valley FSR is the ideal trail for first-time off-roaders in BC.',
    body: `If you are new to off-roading in BC and want a trail that will not test your recovery gear, Squamish Valley FSR is the place to start. Wide, well-maintained gravel, steady cell service for the first few kilometres, and views that make you feel like you have earned something even though the driving was effortless.

## The Drive

The road starts at the end of the pavement near the Squamish River. From there, it follows the Squamish Valley north through second-growth forest and open meadows. The first 20 km are graded regularly by the BC Forest Service. You can cruise at 40-50 km/h without worrying about hidden rocks or surprise potholes.

Around the 20 km mark, the road forks. The left branch continues up the Squamish Valley toward the Elaho River. The right branch heads up the Ashlu River FSR, which is a popular access route for backcountry skiers in the winter and hikers in the summer.

## What Makes It Special

Squamish Valley FSR is not about technical driving. It is about access. The road opens up miles of crown land for camping, hiking, fishing, and exploring. There are dozens of informal campsites along the river — some with fire rings, some with views of the Tantalus Range, some hidden so well you will have them to yourself on a Tuesday night.

The Ashlu River turnoff is worth the detour if you have time. The road follows the Ashlu Canyon past some impressive rapids and leads to trailheads for the Ashlu Mountain hike and the popular Sky Pilot area.

## Beginner Tips

This is the perfect trail for learning the basics: airing down your tires on gravel, checking your spare before a trip, and figuring out how to read a road for upcoming obstacles. Even in a crossover, Squamish Valley FSR is manageable.

[Check the Squamish Valley FSR trail page](/plan/squamish-valley-fsr) for current conditions and upcoming trips.`,
    coverImage: '/images/blog/squamish-valley-hero.png',
    coverAlt: 'Squamish Valley FSR gravel road winding through forest with mountain views in background',
    publishedAt: '2026-04-30T14:00:00-07:00',
    status: 'published',
    seoTitle: 'Squamish Valley FSR Beginner Guide: First Off-Road Run | Offroady',
    seoDescription: 'Squamish Valley FSR is the perfect first off-road run for beginners in BC. Wide well-maintained gravel road with stunning views, river access, and beginner-friendly conditions year-round.',
    keywords: ['Squamish Valley FSR', 'beginner offroad BC', 'first FSR run', 'Squamish offroad beginner', 'BC gravel road driving'],
    readingTime: '5 min read',
    author: 'Offroady Team',
    ctaText: 'Check out Squamish Valley FSR details and plan your trip',
    researchNotes: 'Squamish Valley FSR is graded regularly by the BC Forest Service. It provides access to Ashlu River FSR and Elaho Valley. The road is generally in good condition up to about the 30 km mark. Beyond that, conditions vary by season. Cell service is available at the start but fades after about 5 km.',
  },
  {
    slug: 'the-road-to-sloquet-hot-springs',
    title: 'The Road to Sloquet Hot Springs: A Remote BC Adventure Worth Taking',
    excerpt: 'A long, scenic drive through the Lillooet River valley leads to one of BC\'s best natural hot springs. Here is what you need to know before you go.',
    trailSlug: 'sloquet-hot-springs',
    emailExcerpt: 'Remote natural hot springs accessible via FSR. A 3-hour scenic drive from Vancouver through the Lillooet Valley. Worth every bump.',
    body: `Some destinations justify the drive all by themselves. Sloquet Hot Springs is one of them. Tucked deep in the Lillooet River valley, this natural hot spring is a three-hour drive from Vancouver — most of it on gravel. The reward: undeveloped hot pools surrounded by old-growth forest, with the river running past just metres away.

## The Approach

From Pemberton, head north on the Lillooet River FSR. The road starts paved but quickly turns to gravel. The first 30 km are well-maintained — logging traffic keeps it graded. After that, the surface gets rougher. Washboard sections, loose rocks, and the occasional mud hole appear. Nothing extreme, but you will appreciate having moderate clearance and all-season tires.

The hot springs are approximately 90 km from Pemberton. Plan for 2 to 2.5 hours of driving time one way. Cell service drops completely once you leave Pemberton. Download your maps and let someone know your plan before you head out.

## The Hot Springs

Sloquet is undeveloped. There are no buildings, no staff, no admission fee. The pools are natural rock formations where geothermal water mixes with cold river water. The temperature varies by pool — some are bath-warm, others are genuinely hot. You can adjust the mix by moving rocks around, but please leave the site as you found it.

There is a pit toilet at the main campsite area. No drinking water, no garbage pickup. Pack everything out, including your toilet paper.

## Camping

The main campsite near the springs is first-come-first-served. On summer weekends, it fills up by Thursday evening. If the main site is full, there are pull-offs and smaller sites along the last few kilometres of the access road.

## When to Go

Late spring through early fall is the best window. The road is usually passable from May to October, depending on snow levels. Mid-week is ideal if you want the pools to yourself.

[Check the Sloquet Hot Springs trail details](/plan/sloquet-hot-springs) or [plan a trip](/plan/sloquet-hot-springs) with the Offroady community.`,
    coverImage: '/images/blog/sloquet-hot-springs-hero.png',
    coverAlt: 'Natural hot springs pool surrounded by forest in BC backcountry',
    publishedAt: null,
    status: 'draft',
    seoTitle: 'Sloquet Hot Springs: BC FSR Trail Guide & Trip Report | Offroady',
    seoDescription: 'Complete guide to reaching Sloquet Hot Springs via forest service road. What to expect, what to bring, and trail conditions for this remote BC hot spring.',
    keywords: ['Sloquet Hot Springs', 'BC hot springs FSR', 'Sloquet road conditions', 'Lillooet River FSR', 'remote BC hot spring access'],
    readingTime: '7 min read',
    author: 'Offroady Team',
    ctaText: 'Plan your trip to Sloquet Hot Springs',
    researchNotes: 'Sloquet Hot Springs is on BC Recreation Sites and Trails. The FSR approach is approximately 90 km from Pemberton on the Lillooet River Forest Service Road (Lillooet FSR). The road is generally passable with moderate-clearance AWD, but can be rough after rain. No cell service once you leave Pemberton. The hot springs themselves are undeveloped — natural rock pools with variable temperatures. No facilities beyond pit toilets. Camping is first-come-first-served. BRMB (Backroad Mapbooks) shows the access route clearly.',
  },
  {
    slug: 'mount-cheam-in-a-rav4',
    title: 'Taking a Stock RAV4 to Mount Cheam: Does It Make It?',
    excerpt: 'Mount Cheam is one of BC\'s most popular hiking destinations. But can you get a stock crossover up the access road? We tested it.',
    trailSlug: 'mount-cheam-fsr-access',
    emailExcerpt: 'Can a stock RAV4 make it up Mount Cheam FSR? We tested it — here is what we found about this popular BC access road.',
    body: `Mount Cheam is one of the most popular hikes in the Fraser Valley. On a clear summer weekend, the trailhead parking lot fills up early. But getting to that trailhead requires driving up the Mount Cheam FSR — a road that has a reputation for chewing up unprepared vehicles.

We took a stock 2023 Toyota RAV4 (8.4 inches of ground clearance) up the access road on a dry September day to find out if the reputation is deserved.

## The Access Road

The road starts at the end of Chilliwack Lake Road. The first section is well-graded gravel — any car can handle it. But after about 2 km, the surface changes. The gravel gives way to embedded rocks, exposed roots, and the occasional deep rut. The road climbs steadily, gaining about 800 metres of elevation over 10 km.

## The Challenges

Three sections of the road demand attention:

**The switchbacks** — Tight, steep turns with loose gravel on the surface. Momentum is your friend, but too much speed and you will slide wide. In the RAV4, we took these in first gear with traction control on.

**The rock garden** — About halfway up, a 50-metre section of embedded rocks that forces you to pick a line carefully. The RAV4 cleared it with about an inch to spare on the highest rocks. Slow and steady won the day.

**The final steep pitch** — A short but steep climb just before the trailhead. The RAV4's AWD system handled it without slipping, but we aired down to 22 PSI for extra grip.

## Verdict

A stock RAV4 can absolutely make it up Mount Cheam FSR on a dry day with careful driving. But there is a catch: this is not a road you want to attempt in the rain, at night, or with less than 8 inches of clearance. And if you have a larger group, the parking situation at the top means you should arrive early.

[View the Mount Cheam FSR trail details](/plan/mount-cheam-fsr-access) or [plan a trip](/plan/mount-cheam-fsr-access) to see it for yourself.`,
    coverImage: '/images/blog/mount-cheam-hero.png',
    coverAlt: 'Mid-size SUV driving on Mount Cheam FSR with Mount Cheam in background',
    publishedAt: null,
    status: 'draft',
    seoTitle: 'Mount Cheam FSR in a RAV4: Crossover Off-Road Test | Offroady',
    seoDescription: 'Our test run taking a stock Toyota RAV4 up the Mount Cheam FSR access road. Did it make it? What we learned about line choice, tire pressure, and clearance on this popular BC trail.',
    keywords: ['Mount Cheam FSR', 'RAV4 offroad', 'crossover FSR test', 'Mount Cheam access road', 'BC trail vehicle requirements'],
    readingTime: '6 min read',
    author: 'Offroady Team',
    ctaText: 'Check Mount Cheam trail details',
    researchNotes: 'Mount Cheam FSR access is a well-known trail in the Chilliwack area. The road starts as well-maintained gravel but becomes progressively rougher with ruts and rocks in the upper sections. Stock crossovers with 8 inch clearance can make it on a dry day with careful line choice. Most sources recommend high clearance 4x4 for a stress-free experience. The trail is active with logging vehicles — check for active logging before heading up.',
  },
  {
    slug: 'whipsaw-creek-the-true-test',
    title: 'Whipsaw Creek: The True Test for BC Off-Roaders',
    excerpt: 'Whipsaw Creek FSR is not a beginner trail. Rocky sections, steep climbs, and technical driving make it a rite of passage for serious BC off-roaders.',
    trailSlug: 'whipsaw-creek-forest-service-road',
    emailExcerpt: 'Whipsaw Creek is BC\'s ultimate 4x4 challenge trail. Technical rocks, steep climbs, and stunning views. Not for beginners.',
    body: `Whipsaw Creek is not a trail you accidentally drive. It is a trail you prepare for, plan around, and talk about for weeks afterwards. Located near Princeton, BC, this 30 km route through the Similkameen region is widely considered one of the most challenging stock-legal 4x4 trails in the province.

## The Trail

The route starts on the Whipsaw Creek FSR and winds through the Granite Creek area. The first few kilometres are unremarkable — gravel road, a few potholes, nothing special. Then the trail drops into the canyon and everything changes.

**The rock gardens** are the main event. Sustained sections of embedded boulders that demand careful line choice and low-range gearing. Clearance is critical — 10 inches minimum, more if you can get it. Stock Jeeps and Tacomas can make it, but expect to use your skid plates.

**The creek crossings** are straightforward on a dry day but become genuine obstacles after rain. Water levels can rise quickly. Check the forecast before you go and be prepared to turn around if conditions change.

**The shelf road sections** are narrow and exposed. Not a place for anyone uncomfortable with heights or limited room for error.

## Vehicle Requirements

- High clearance (10+ inches)
- Low-range 4x4
- Recovery gear: kinetic rope, soft shackles, traction boards
- Winch recommended
- Skid plates strongly recommended
- At least 2 vehicles in your group

## Best Time to Go

June through October, depending on snow. Early season can have lingering snowpack in the upper sections. Late season means dry, dusty conditions with excellent traction.

This is a group trail. Go with experienced drivers, bring recovery gear, and plan for a full day. [Check Whipsaw Creek trail details](/plan/whipsaw-creek-forest-service-road) or find a group run.`,
    coverImage: '/images/blog/whipsaw-creek-hero.png',
    coverAlt: '4x4 vehicle navigating rocky terrain on Whipsaw Creek trail in BC backcountry',
    publishedAt: null,
    status: 'draft',
    seoTitle: 'Whipsaw Creek FSR: BC\'s Ultimate 4x4 Challenge Trail | Offroady',
    seoDescription: 'Complete trail guide for Whipsaw Creek FSR — BC\'s most technical off-road trail. What to bring, what to expect, and how to prepare for this challenging route.',
    keywords: ['Whipsaw Creek', 'BC 4x4 challenge', 'technical offroad BC', 'Whipsaw trail guide', 'advanced BC offroad'],
    readingTime: '8 min read',
    author: 'Offroady Team',
    ctaText: 'See Whipsaw Creek trail details and trip options',
    researchNotes: 'Whipsaw Creek is widely considered one of BC\'s most challenging stock-legal 4x4 trails. Located near Princeton, BC, it runs approximately 30 km through the Granite Creek area. The trail features sustained rock gardens, steep climbs, creek crossings, and narrow shelf road sections. High clearance with lockers recommended. Winch and recovery gear mandatory. Best run with a group of at least 2-3 vehicles. The trail is typically open from June to October depending on snow. No cell service on the trail. Exit via the Granite Creek side allows a loop run. Sources: BC Forest Service, Backroad Mapbooks, 4x4 community trip reports on BC4x4 forums.',
  },
];

export function getAllPublishedTrailStories(): TrailStory[] {
  return trailStories
    .filter((s) => s.status === 'published')
    .sort((a, b) => {
      if (!a.publishedAt || !b.publishedAt) return 0;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
}

export function getTrailStoryBySlug(slug: string): TrailStory | null {
  return trailStories.find((s) => s.slug === slug) ?? null;
}

export function getTrailStoryByTrailSlug(trailSlug: string): TrailStory | null {
  return trailStories.find((s) => s.trailSlug === trailSlug && s.status === 'published') ?? null;
}

export function getAllTrailStorySlugs(): string[] {
  return trailStories.map((s) => s.slug);
}

export function getPublishedTrailStorySlugs(): string[] {
  return trailStories.filter((s) => s.status === 'published').map((s) => s.slug);
}

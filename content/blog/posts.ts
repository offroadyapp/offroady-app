export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
  updatedAt?: string;
  author: string;
  coverImage?: string;
  coverAlt?: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  relatedTrailSlug?: string;
  readingTime: string;
  status: 'draft' | 'published';
  body: string;
};

const posts: BlogPost[] = [
  {
    slug: 'first-time-offroading-bc',
    title: '第一次越野要准备什么？新手必读装备清单',
    excerpt: '在BC的森林服务土路（FSR）上第一次越野该带什么？自救装备、胎压放气、通讯导航、安全清单——BC老越野的经验总结。',
    category: 'Off-Roading Basics',
    tags: ['beginner', 'gear', 'FSR', 'BC', 'safety'],
    publishedAt: '2026-05-01T22:00:00-07:00',
    author: 'Offroady Team',
    coverImage: '/images/blog/first-trip-gear-hero.png',
    coverAlt: 'Off-road gear laid out on tailgate in BC forest — traction boards, recovery rope, air compressor',
    seoTitle: '第一次越野要准备什么？新手必读装备清单 | BC Forest Service Road Guide',
    seoDescription: '脱困板、拖车绳、胎压放气、急救包……BC森林土路新手越野装备全清单。第一次上FSR看这篇就够了。',
    keywords: ['offroading beginners BC', 'FSR gear checklist', 'forest service road tips', 'BC offroad recovery gear', '新手越野装备'],
    relatedTrailSlug: 'mamquam-river-fsr',
    readingTime: '6 min read',
    status: 'published',
    body: `第一次开上森林服务土路（FSR），那种既兴奋又有点紧张的感觉，每个老越野都经历过。轮胎压在碎石上咔咔响、对面来车扬起一片尘土、手机信号一格一格往下掉——这些全是你即将习惯的日常。

但说实话，BC的山里没信号的地方太多了。万一陷车了、爆胎了、路被倒木挡住了，光靠一个热心路人搭把手？概率不大。所以我写了这份清单，不是要吓你，而是让你第一次出去的时候心里有底。

## 一、最基础的：车要有底子

不是非得开牧马人或者陆巡才能上FSR。很多BC的森林土路，带个中等离地间隙的四驱SUV（RAV4、Outback、4Runner这些）完全能走。出发前检查三样东西就够了：

**备胎**——检查一下。别笑，很多人开了一年都不知道备胎早就压没气了或者五年没换过。

**电池**——如果还是原厂电瓶，超过四年了，建议换个新的再出发。

**底盘护板**——没有也没关系，但要有心理准备：飞起来的石头可能会打到底盘或者水箱。

## 二、自救装备：陷车了怎么办？

在FSR上陷车不是"会不会"的问题，是"什么时候"的问题。泥坑、积雪、沙地、或者只是不小心开偏了一个轮子——新手最容易犯的错就是低估一条看起来平平无奇的土路。

- **脱困板（Traction Boards）**——绝对是新手第一件应该买的装备。两条黄色或橙色的板子往轮胎下面一塞，比什么都管用。
- **拖车绳（Kinetic Recovery Rope）**——不是普通拖车绳，是那种带弹力的动能绳。BC的4x4圈子里公认20,000磅以上断裂强度才够用。
- **软卸扣（Soft Shackles）**——比钢制卸扣安全得多，钢卸扣崩断了就是一颗子弹。
- **折叠铲（Shovel）**——一把好用的工兵铲，挖泥挖雪能省掉你等救援的几小时。

## 三、放气！放气！放气！

这是新手最常忽略的一件事。公路胎压35-40 PSI，上了碎石路不放到20-25 PSI，你就是在玩弹球。买一个几块钱的胎压笔和放气工具，上FSR前把四个轮子放到约20 PSI。回来上高速之前别忘了打回去。一台便携充气泵是必备的。

## 四、通讯和导航

BC很多FSR完全没手机信号。如果你一个人去、或者车队只有两台车，强烈建议备一个卫星通讯设备。

**Garmin InReach**或**Zoleo**——最可靠的选择，可以发短信、共享位置、按SOS求救按钮。**离线地图**——提前在手机上把区域地图下载好。实在什么都没有？至少告诉朋友或家人你打算去哪条路、大概几点回来。

去看看我们的[Trail of the Week](/trail-of-the-week)选一条简单路线开始你的第一次越野吧。`,
  },
  {
    slug: 'what-is-high-clearance',
    title: 'What Does High Clearance Mean on BC Trails?',
    excerpt: 'Understanding vehicle clearance is key to choosing the right trail in BC. Here\'s what the terms mean and why it matters for forest service roads.',
    category: 'Off-Roading Basics',
    tags: ['clearance', 'vehicle', 'FSR', 'beginner', 'BC'],
    publishedAt: '2026-05-01T22:15:00-07:00',
    author: 'Offroady Team',
    seoTitle: 'What Does High Clearance Mean on BC Trails? | Offroady',
    seoDescription: 'High clearance explained: what it means, how much you need for BC forest service roads, and how to match your vehicle to the right trail.',
    keywords: ['high clearance vehicle BC', 'ground clearance FSR', '4x4 trail requirements BC', 'vehicle clearance explained offroad'],
    readingTime: '5 min read',
    status: 'published',
    body: `When you browse trails on Offroady, you will see vehicle recommendations like "high clearance required" or "AWD with moderate clearance recommended." But what does that actually mean for your vehicle?

## What Is Ground Clearance?

Ground clearance is the minimum distance between the lowest point of your vehicle and the ground. For most stock SUVs and trucks, that measurement falls somewhere between 8 and 12 inches.

The lowest point on a typical vehicle is usually the differential, the exhaust, or the transmission skid plate. On a Subaru Outback, that number is about 8.7 inches. On a Jeep Wrangler Rubicon, it is about 10.8 inches stock, and much more with a lift.

## What Clearance Do BC Forest Service Roads Require?

Most FSRs in BC are well-maintained gravel roads that any SUV or crossover can handle. But conditions change with weather, logging activity, and time of year:

- **Low clearance (under 8")** — Stick to paved roads and well-graded gravel. A sedan can handle some FSRs early in the season, but expect to take it slow.
- **Moderate clearance (8"–10")** — Covers most BC FSRs. Crossovers like the RAV4, Outback, and Honda Passport fit here. Avoid deep ruts and rock gardens.
- **High clearance (10"+)** — Required for rocky trails, deep ruts, creek crossings, and remote routes like Whipsaw Creek. This is where trucks and Wranglers live.

## What Trails Match Your Vehicle?

On Offroady, each trail lists a vehicle recommendation so you can match your rig before you go. [Browse our trails](/trail-of-the-week) to find one at your comfort level — or plan a trip with other members to explore something more challenging together.

If you are new to this, start with a Moderate clearance trail and build up. Nobody starts on the hardest lines.`,
  },
  {
    slug: '4x4-vs-awd-fsr',
    title: '4x4 vs AWD: What Matters for Forest Service Roads?',
    excerpt: 'Do you really need a 4x4 for BC backroads? Not always. Here\'s how AWD and 4x4 compare on forest service roads, and when each makes sense.',
    category: 'Vehicle & Gear',
    tags: ['4x4', 'AWD', 'vehicle', 'FSR', 'BC'],
    publishedAt: '2026-05-01T22:30:00-07:00',
    author: 'Offroady Team',
    seoTitle: '4x4 vs AWD for BC Forest Service Roads | Offroady',
    seoDescription: 'Can you take an AWD crossover on BC FSRs? Yes — but here is when you need a real 4x4. Vehicle comparison for BC off-road beginners.',
    keywords: ['4x4 vs AWD BC', 'AWD on forest service road', 'offroad vehicle BC', 'crossover vs truck FSR'],
    readingTime: '5 min read',
    status: 'published',
    body: `One of the most common questions from new members: "Can I take my AWD crossover on BC forest service roads, or do I need a proper 4x4?"

The short answer: for most FSRs, AWD is fine. But there are real limits.

## How AWD and 4x4 Differ

**AWD (All-Wheel Drive)** — Power is sent to all four wheels automatically. Most modern crossovers (RAV4, Outback, CX-5, Rogue) use an on-demand AWD system. Great for gravel, light mud, and wet pavement. The key limitation: no low range, and less wheel articulation.

**4x4 / 4WD (Four-Wheel Drive)** — A part-time system with a transfer case. You engage it when needed. Trucks (Tacoma, Silverado) and SUVs (4Runner, Wrangler) use true 4x4 systems. Low range gives you crawling power for steep climbs and technical terrain. More durable components for hard use.

## When AWD Is Enough

A good AWD system with moderate ground clearance (8"+) will handle 80% of BC FSRs without issue:

- Well-graded gravel roads
- Harrison East FSR
- Squamish Valley FSR
- Norrish Creek FSR

The key is picking the right trail for your vehicle. On Offroady, each trail lists a difficulty rating and vehicle recommendation so you can choose with confidence.

## When You Need a 4x4

Some trails genuinely require low range, high clearance, and durable running gear:

- Whipsaw Creek — technical rock sections and steep climbs
- Statlu Lake approach — deep ruts and creek crossings
- Lost Airplane Ridge — narrow shelf roads with exposure

If you are running these routes, bring recovery gear and go with another vehicle. These are not crossover trails.

## The Bottom Line

Most new off-roaders in BC start with an AWD crossover and learn what they need over time. Do not feel pressured to buy a truck before your first trip.

If you want to see which trails match your vehicle, [check out our trail list](/trail-of-the-week) or [join a group trip](/join-a-trip) to ride with experienced members who know the terrain.`,
  },
  {
    slug: 'essential-recovery-gear-beginners',
    title: 'Essential Recovery Gear for Beginner Off-Roaders',
    excerpt: 'Getting stuck is part of off-roading. Here is the essential recovery gear every beginner needs before heading onto BC forest service roads.',
    category: 'Safety & Recovery',
    tags: ['recovery gear', 'safety', 'beginner', 'BC', 'stuck'],
    publishedAt: null,
    author: 'Offroady Team',
    seoTitle: 'Essential Recovery Gear for Beginner Off-Roaders in BC | Offroady',
    seoDescription: 'Recovery gear checklist for BC off-road beginners: traction boards, kinetic rope, soft shackles, shovel, air compressor. What to carry and why.',
    keywords: ['offroad recovery gear BC', 'beginner recovery kit', 'FSR stuck help', 'traction boards BC', 'kinetic recovery rope'],
    readingTime: '5 min read',
    status: 'draft',
    body: `Getting stuck is not a sign of failure — it is a rite of passage in off-roading. Every experienced driver has a story about the time they misjudged a mud hole or took the wrong line. The difference between a bad story and a great one is having the right recovery gear.

## The Starter Recovery Kit

If you are new to BC forest service roads, here are the five things you should carry before your first trip:

### 1. Traction Boards

Maxtrax-style recovery boards are the single best investment a beginner can make. Slide them under a spinning tire and they give you instant grip. No winch, no second vehicle, no sweat.

### 2. Kinetic Recovery Rope

A kinetic rope stretches under load and snaps back, yanking a stuck vehicle out with momentum. Look for a 20,000-lb breaking strength minimum. Brand recommendations in the BC community include Yankum, Bubba Rope, and ARB.

### 3. Soft Shackles

Steel shackles can become dangerous projectiles if they break. Soft shackles are lighter, stronger in practice, and much safer. Carry at least two.

### 4. Folding Shovel

A quality military-style entrenching tool is worth its weight. Dig out a buried axle, clear mud from around a tire, or level ground for a jack.

### 5. Portable Air Compressor

Deflating tires for traction is one of the best things you can do on loose gravel or mud. But you need to pump them back up before hitting pavement. A small 12V compressor lives in your trunk and saves you from hunting for a gas station air hose.

## Plan Ahead

Recovery gear is only useful if you know how to use it. Practice with your kinetic rope and boards in a safe area before you need them on a trail.

And the best recovery tool? A second vehicle. [Join a trip](/join-a-trip) through Offroady and you will never be out there alone.`,
  },
  {
    slug: 'never-go-offroading-alone',
    title: 'Why You Should Never Go Off-Roading Alone',
    excerpt: 'Solo off-roading in BC backcountry carries real risks. Here is why you should always bring a second vehicle — or find a group on Offroady.',
    category: 'Safety & Recovery',
    tags: ['solo', 'safety', 'group', 'BC', 'recovery'],
    publishedAt: null,
    author: 'Offroady Team',
    seoTitle: 'Why You Should Never Go Off-Roading Alone in BC | Offroady',
    seoDescription: 'Solo off-roading in BC forest service roads is risky. Learn why two vehicles are safer and how Offroady helps you find trip partners.',
    keywords: ['solo offroading BC', 'offroad safety tips', 'group offroad BC', 'BC forest service road solo risk', 'offroady trip planning'],
    readingTime: '4 min read',
    status: 'draft',
    body: `BC's forest service roads are some of the most beautiful driving routes in the world. They are also remote, unpredictable, and completely unforgiving if something goes wrong. Here is why you should almost never go alone.

## What Can Go Wrong Solo

- **Vehicle breakdown** — A dead alternator, a shredded tire, or a snapped belt can leave you stranded for hours or overnight.
- **Getting stuck** — Even on an easy trail, one wrong line can put you in a mud hole that no amount of Maxtrax can fix.
- **Injury** — A slip on a wet rock while airing tires, or a cut hand while moving a log, can become serious without help.
- **No cell service** — Large parts of the Squamish, Harrison, and Pemberton backcountry have zero signal. If you are hurt and alone, nobody knows where you are.

## The Second Vehicle Rule

Experienced BC off-roaders follow an informal rule: never run fewer than two vehicles on any trail where you could get stuck. Two vehicles can recover each other. Two people can split driving duties. Two sets of eyes catch problems earlier.

## How Offroady Helps

You do not need a pre-existing friend group to run trails safely. Offroady is built for exactly this situation:

- [Browse upcoming trips](/join-a-trip) and join one that fits your schedule
- Check trail conditions and vehicle requirements before you go
- Meet other BC off-roaders who share your interest
- Organize group runs with built-in trip planning

Off-roading is better with people. Safer, more fun, and you learn faster. Find your next group run on Offroady today.`,
  },
];

export function getAllPublishedPosts(): BlogPost[] {
  return posts
    .filter((p) => p.status === 'published')
    .sort((a, b) => {
      if (!a.publishedAt || !b.publishedAt) return 0;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return posts.find((p) => p.slug === slug) ?? null;
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug);
}

export function getPublishedSlugs(): string[] {
  return posts.filter((p) => p.status === 'published').map((p) => p.slug);
}

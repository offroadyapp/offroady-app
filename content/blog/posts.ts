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
  videos?: VideoItem[];
};

// --- Multi-language canonical structure ---

export type VideoItem = {
  type: 'youtube' | 'youtube_short' | 'external' | 'mp4';
  url: string;
  embedUrl?: string;
  title?: string;
  caption?: string;
  thumbnailUrl?: string;
  credit?: string;
};

export type Language = 'en' | 'zh';

export type CanonicalBlogTranslation = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  readingTime: string;
  status: 'draft' | 'published';
  coverImage?: string;
  coverAlt?: string;
  videos?: VideoItem[];
};

export type CanonicalBlogPost = {
  contentId: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
  updatedAt?: string;
  author: string;
  relatedTrailSlug?: string;
  translations: Partial<Record<Language, CanonicalBlogTranslation>>;
};

const posts: BlogPost[] = [
  // Note: This array is kept for backward compatibility.
  // The canonical content is in canonicalBlogPosts below.
  // Existing pages that import posts directly still work.

  
  {
    slug: 'hale-creek-newbie-run-4wdabc',
    title: 'Hale Creek 新手必参加的Newbie Run!',
    excerpt: '4WDABC 举办的 Newbie Run，50 多台车分组出发，新手跟着学习基础越野知识、车辆操作和安全注意事项。有 easy way 也有 hard way，轻松、有趣，也很适合第一次想尝试越野的朋友。本文含全程照片图库和视频回顾。',
    category: 'Trip Stories',
    tags: ['Hale Creek', '4WDABC', 'Newbie Run', 'BC Off-Roading', 'Beginner', 'Trip Story', 'Group Run', 'Beginner Off-Road'],
    publishedAt: null,
    author: 'Offroady Team',
    coverImage: '/images/blog/halecreek/hale-creek-newbie-run-cover.jpg',
    coverAlt: '4WDABC Newbie Run 参加车辆在 Hale Creek 集合点整齐排列，BC 省越野社区新手活动',
    seoTitle: '第一次参加 4WDABC Newbie Run：Hale Creek 越野新手活动回顾 | Offroady',
    seoDescription: '参加 4WDABC 在 Hale Creek 举办的 Newbie Run，50 多台车分组出发。有 easy way 和 hard way 两种路线选择，新手可以在真实越野环境中学习基础知识和安全规则。',
    keywords: ['Hale Creek newbie run', '4WDABC beginner off-road', 'BC newbie off-road event', 'Hale Creek FSR', 'BC off-road beginner group', '4WDABC Newbie Run', '越野新手活动'],
    relatedTrailSlug: 'hale-creek-easy-way-access-area',
    readingTime: '5 min read',
    status: 'draft',
    body: `如果你是一个越野新手，正在犹豫要不要迈出第一步，那我强烈建议你找一个这样的活动试试。

这次我参加的是 **4WDABC——BC 省越野车协会** 组织的一个 **Newbie Run**。顾名思义，这种活动就是专门面向新手的：不需要你一上来就会爬石头、冲泥坑、判断路线，也不需要你假装自己很懂。你只需要带着车、带着好奇心、带着一点点紧张，然后跟着队伍出发就可以了。

这也是我觉得这类活动最好的地方：它不是单纯"出去玩一圈"，而是边玩边学。

![4WDABC Newbie Run 参加车辆和车友在 Hale Creek 集合点听组织者讲解](/images/blog/halecreek/hale-creek-newbie-run-gathering-01.jpg)

## 50 多台车，场面还是挺震撼的

这次活动参加的人不少，现场大概有 **50 多台车**。各种车型都有——Jeep、Toyota、pickup、SUV，甚至有人开着非越野车辆来参加。怎么说呢，氛围轻松得很，感觉大家不是来比赛的，而是来交朋友的。

对于新手来说，第一次看到这么多越野车一起集合，其实已经有点小激动了。出发前，组织者做了基本说明，包括当天路线、分组、安全注意事项、车队行进规则。这个环节对新手特别有帮助——越野不是一个"自己随便开进去看看"的活动。车距怎么保持、无线电怎么沟通、什么时候等待后车、困难路段怎么处理，这些都是安全的一部分。

这次队伍分成了 **3 组**：
- **两组走 easy way**——适合新手和轻度越野车辆
- **一组走 hard way**——给想挑战一点难度的

这个安排非常好。新手根据自己的车辆和驾驶经验选择路线，不必硬上难度。越野最重要的不是逞强，而是知道自己和车辆的边界在哪里。

![Newbie Run 车队可以看到的Harrison湖景](/images/blog/halecreek/hale-creek-newbie-run-convoy-start.jpg)

## Newbie Run 最有价值的地方：有人带，有人讲，有人提醒

很多人第一次接触越野，最大的问题不是车不够好，而是不知道该怎么判断。比如：

- 这段路应该怎么选线？
- 什么时候需要低速四驱？
- 什么时候要保持动力，什么时候要慢慢挪？
- 遇到坑、碎石、泥地应该怎么处理？
- 前车过得去，我的车是不是一定过得去？
- 如果卡住了，应该怎么安全处理？

这些东西光看视频真的很难真正学会。跟着有经验的人一起走，会直观得多。有人在前面示范，有人在关键地方提醒，有时还会下车讲解为什么这么走——这对新手来说是无价的。

这次虽然是 newbie run，但绝不是"无聊的平路开车"。路上有一些需要判断和操作的地方，只是整体节奏很友好，不会让新手一开始就压力山大。

而且时不时还能看到 hard way 那边的"现场直播"——有车在挑战一些稍微陡一点、石头多一点的路段。对新手来说，看着别人怎么过，自己心里也有数了：哦，原来要这样走。

![Hard way 组通过 Hale Creek 森林路段](/images/blog/halecreek/hale-creek-newbie-run-easy-route.jpg)

## Easy way 不等于没意思

很多人听到 easy way，可能觉得是不是没什么挑战。其实完全不是。

对新手来说，easy route 恰恰是最适合学习的地方。你有时间观察，有时间思考，也有机会在安全范围内感受车辆在非铺装路面上的反应。你会开始注意到：

- 车轮压在哪里会更稳
- 底盘高度为什么重要
- 轮胎抓地力和普通公路驾驶有什么不同
- 车队为什么要保持节奏
- 路面看起来差不多，实际开起来差别很大

这些都是越野的基础。很多看起来"简单"的路，其实正好适合练习基本判断。

而且别忘了——有些新手甚至开的不是硬派越野车。这次确实有非越野车辆参加，跟着 easy way 组也能顺利完成。这说明一个问题：**你不需要一辆改装过的牧马人才开始越野。** 一辆靠谱的 SUV 或 crossover，加上正确的判断和同伴照应，已经可以开启你的越野之旅了。

![Hale Creek 营地标牌](/images/blog/halecreek/hale-creek-newbie-run-scenic-afternoon.jpg)

## Hard way 给大家看到了另一种可能

走 hard way 的那组，确实遇到了一些更有挑战性的路段。对刚开始的新手来说，不一定马上要去挑战，但看看别人怎么过也很长见识。

越野的乐趣之一就在这里：同一片区域，不同路线、不同车辆、不同经验的人，会有完全不同的玩法。有些路段对老手来说是"好玩"，对新手来说就是"压力"。所以有分组、有选择，是非常好的安排。

我觉得这也是参加 club run 的好处——你不会被迫做超出能力范围的事，但你能看到自己技术进步后，还能去哪里、怎么玩。

## 安全感很重要，尤其是第一次越野

如果是自己一个人开去陌生的 trail，很多人会紧张：万一走错路怎么办？手机没信号怎么办？卡住了怎么办？车坏了怎么办？

这次 Newbie Run 最大的好处就是：**你不是一个人。** 前后都有车，组织者有经验，队伍会互相照应。

当然，这并不意味着完全不用准备。基本的东西还是需要的：
- 出发前检查车辆
- 油量充足
- 带水和食物
- 穿适合户外的鞋
- 带基本应急用品
- 听从组织者安排
- 不单独离队
- 不盲目挑战没把握的路段

越野不是为了冒险出事，而是为了安全地去到平时去不到的地方。

![被尖硬的石头扎破轮胎，途中换轮胎也并不少见](/images/blog/halecreek/hale-creek-newbie-run-break-stop.jpg)

## 对新手来说，这种活动真的很值得参加

我会很鼓励刚开始接触越野的朋友参加 Newbie Run。原因很简单：你可以在一天里学到很多基础知识，而且是**在真实环境里学**，不是在网上看几篇文章自己想象。

你会看到不同车辆的表现，听到有经验的人讲解，也会更清楚自己的车适合什么样的路线。

更重要的是，你会发现越野社区其实很友好。大家不是来比谁的车更贵、谁胆子更大，而是一起出去玩、互相帮助、一起安全回来。

这次 Hale Creek 的活动整体感觉很轻松，也很好玩。人多，车多，气氛好。对于第一次参加的人来说，是一个很好的入门体验。

![回程中看到的湖景](/images/blog/halecreek/hale-creek-newbie-run-wrap-up.jpg)

---

## 活动照片图库

![车队在 Hard way上蜿蜒前行，场面壮观](/images/blog/halecreek/hale-creek-newbie-run-convoy-angle-02.jpg)

![从另一个角度看到的车队行进画面](/images/blog/halecreek/hale-creek-newbie-run-convoy-angle-03.jpg)

![带着狗狗一同前进](/images/blog/halecreek/hale-creek-newbie-run-trail-scenery-04.jpg)

![湖边一览无余，令人神往](/images/blog/halecreek/hale-creek-newbie-run-lunch-break.jpg)

![湖边也有涉水而过的挑战](/images/blog/halecreek/hale-creek-newbie-run-mid-trail-05.jpg)

![Easy way 组的挑战路段，陡坡加碎石](/images/blog/halecreek/hale-creek-newbie-run-hard-way-01.jpg)

![Easy way 路段另一角度，车辆正在通过技术难点](/images/blog/halecreek/hale-creek-newbie-run-hard-way-02.jpg)

![各种车辆争奇斗艳](/images/blog/halecreek/hale-creek-newbie-run-afternoon-trail.jpg)

---

## Offroady 的想法：让更多人找到适合自己的 trail 和同行伙伴

这次活动也让我更确定一件事：很多人其实是想出去玩的，只是不知道去哪、不知道跟谁去、不知道自己能不能去。

这正是 Offroady 想解决的问题。如果你是新手，可以先从适合自己车辆的 trail 开始。如果你不想一个人去，可以 plan a trip 或 join a trip，和其他人一起走。

越野最好的体验，往往不是一个人闷头开进去，而是和一群靠谱的人一起出发、一起学习、一起回来。

**下次，也许我们可以一起出发。**`,
    videos: [
      {
        type: 'youtube',
        url: 'https://youtu.be/Y8yiD0ta0UE',
        title: 'Hale Creek Newbie Run easy way convoy',
        caption: 'Easy way 组沿 Hale Creek FSR 前行，适合新手的路线节奏',
      },
      {
        type: 'youtube',
        url: 'https://youtu.be/W02MBEqk_oY',
        title: 'Hale Creek Newbie Run hard way technical sections',
        caption: 'Hard way 组挑战更有技术难度的路段，展现越野进阶路线',
      },
      {
        type: 'youtube',
        url: 'https://youtu.be/W2pW0M_Ztp0',
        title: 'Hale Creek scenic afternoon drive',
        caption: '下午风景驾驶片段，展示 Hale Creek 区域的自然风光',
      },
      {
        type: 'youtube',
        url: 'https://youtu.be/yus2ziaGsW4',
        title: 'Hale Creek Newbie Run highlights',
        caption: '当天活动精彩集锦，车队穿越森林和山路',
      },
      {
        type: 'youtube',
        url: 'https://youtu.be/PpeGqzNy4yc',
        title: 'Hale Creek Newbie Run wrap-up',
        caption: '活动收尾，大家安全返回集合点',
      },
      {
        type: 'youtube',
        url: 'https://youtu.be/_v8mnBBGcbk',
        title: 'Mini truck taking on the Hale Creek challenge',
        caption: 'Mini truck 也来挑战 Hale Creek 越野路线，体型虽小勇气不小',
      },
    ],
  },
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
  {
    slug: 'trail-difficulty-explained',
    title: 'Understanding the Trail Difficulty Rating: Is That Trail Right for You?',
    excerpt: 'Offroady trails are rated Easy, Moderate, Difficult, and Extreme — but what does that actually mean on the ground? Here is how to match a trail to your vehicle and experience.',
    category: 'Off-Roading Basics',
    tags: ['difficulty rating', 'trail selection', 'beginner', 'FSR', 'BC'],
    publishedAt: '2026-05-02T10:00:00-07:00',
    author: 'Offroady Team',
    seoTitle: 'Understanding Offroady Trail Difficulty Ratings: Easy to Extreme | BC Off-Road Guide',
    seoDescription: 'Easy, Moderate, Difficult, Extreme — what each trail difficulty level means for your vehicle and driving skill. BC forest service road guide for beginners and experienced off-roaders.',
    keywords: ['offroad trail difficulty BC', 'BC FSR trail rating', 'beginner offroad trail selection', '4x4 trail difficulty explained', 'easy moderate difficult extreme'],
    readingTime: '5 min read',
    status: 'published',
    body: `Understanding the trail difficulty rating is your first step to a safe and fun off-road trip. Here is what Easy, Moderate, Difficult, and Extreme actually mean on BC FSRs.

## Easy — Paved or well-maintained gravel
Any car can handle these routes. Think Squamish Valley FSR on a dry day. No 4x4 needed, no high clearance required, no prior experience.

## Moderate — Graded gravel with occasional obstacles
Where most BC FSRs live. Loose gravel, mild washboard, occasional potholes. A creek crossing might be shallow. AWD or 4x4 recommended with 8" clearance minimum.

## Difficult — Technical sections with real obstacles
Deep ruts, rock gardens, creek crossings up to 12", steep grades. 4x4 required, 10" clearance minimum. Previous off-road experience strongly recommended.

## Extreme — Expert-only terrain
Winching likely, body damage expected. Modified 4x4 required with lockers and winch. Advanced driving skills only.

## How to Pick the Right Trail
- Start one level below your vehicle\'s capability
- Check trail photos and recent trip reports
- Weather can change a Moderate trail to Difficult overnight

Ready to find your next trail? [Browse all trails](/trail-of-the-week) or [join a group trip](/join-a-trip).\n\n---\n\n**📬 Get trail tips in your inbox — subscribe to the Offroady Weekly Digest:**\n👉 **[Subscribe](https://www.offroady.app/weekly-digest)**`,
  },
  {
    slug: 'mount-cheam-fsr-first-offroady-trip-2026-05-03',
    title: 'Mount Cheam我来了！成功收获了一次 Offroady小冒险',
    excerpt: 'Offroady 第一次真实用户组队 trail trip：原计划去 Mount Cheam Lookout，结果一路 washout、倒树、河边收尾，最后变成一次很有故事的小冒险。',
    category: 'Completed Trip',
    tags: ['Mount Cheam', 'Cheam Lookout', 'Chilliwack', 'FSR', 'Offroady Trip', 'Completed Trip', 'BC Offroad'],
    publishedAt: '2026-05-03T22:00:00-07:00',
    author: 'Offroady Team',
    coverImage: '/images/blog/mount-cheam-fsr-20260503/c06fa6a553bbc9b2cd96c2a7f778f90e.jpg',
    coverAlt: 'Mount Cheam FSR trail with mountain view in the distance',
    seoTitle: 'Offroady First Completed Trip: Mount Cheam FSR Adventure',
    seoDescription: 'Offroady 的第一次真实组队 trip：Mount Cheam FSR 一日小冒险，途中遇到 washout、倒树和临时改线，最终收获了一次安全、有趣的 BC 越野体验。',
    keywords: ['Mount Cheam FSR', 'Cheam Lookout BC', 'Offroady first trip', 'BC offroad group trip', 'Chilliwack FSR', 'Mount Cheam adventure', 'BC forest service road trip'],
    relatedTrailSlug: 'mount-cheam-fsr-access',
    readingTime: '5分钟',
    status: 'published',
    body: `
**Mount Cheam FSR access · 2026年5月3日**  
Trip link: [Mount Cheam FSR access](/trips/70f24bf9-9fd8-4ff4-93d6-50ace4b05119)

原计划很简单：  
天气好，车友集合，沿着 Mount Cheam FSR 一路上山，去看看传说中的 Cheam Lookout。

听起来是不是很顺？

事实证明，越野活动里，最不靠谱的就是“听起来很顺”。

5月3日这天，天气是真的给面子。蓝天、阳光、初夏的热浪，山里温度也冲到了大约25度。大家的心情也很到位：车洗没洗不重要，轮胎够不够脏才重要。

![Mount Cheam FSR trail condition 1](/images/blog/mount-cheam-fsr-20260503/c06fa6a553bbc9b2cd96c2a7f778f90e.jpg)

![Mount Cheam FSR trail condition 2](/images/blog/mount-cheam-fsr-20260503/79031e7b96b3fa8826f22f9d52f26940.jpg)

可是山路显然有自己的剧本。

最近雨季带来的山洪，把不少路面冲出了 washout。有些地方看起来像是普通坑洼，走近一看才发现：这不是坑，这是大自然亲手设计的越野考试题。

一路往前，我们遇到了一个比较大的 washout。Rubicon 来回试探一下，虽然也不是“躺着过”，但凭借离地间隙、四驱和一点点车主自信，问题不大。不过同行的皮卡如果硬过，风险就明显高了。

![Large washout on Mount Cheam FSR](/images/blog/mount-cheam-fsr-20260503/613faf313336485109304cafd68dd840.jpg)

![Rubicon checking the washout](/images/blog/mount-cheam-fsr-20260503/3102109eb5deabfbb6124687c19ec529.jpg)

于是大家做了一个很 Offroady 的决定：  
**不是每一次出发都要硬闯到终点，安全回家才是最高级别的完成。**

所以，我们放弃继续冲 Lookout，掉头，准备去半山腰的一个平台做饭休息。

你以为故事到这里就进入轻松野餐模式了吗？

并没有。

我们很快又遇到了新关卡：横倒的树木。

其中一根树枝还特别会找位置，直接卷进了皮卡的后轮和挡泥板之间。那一刻，大家的表情大概都是：

> “嗯……这个情况，说明今天的活动含金量上来了。”

这时候，同行的一位美女车友直接展现了真正的行动力。她先是奋不顾身跳上去，试图把树干压下来。后来又冷静判断，建议把车底伸出来的树干部分掰断。

然后大家一起动手。

事实证明，越野路上除了 winch、recovery board、shovel，有时候还需要一项隐藏装备：  
**集体智慧 + 一点蛮力。**

树枝成功掰断，皮卡终于脱困。现场掌声可以没有，但心里必须给满分。什么叫巾帼不让须眉？这就是。什么叫出来玩不能只会拍照？这也是。

![Clearing the fallen tree and helping the pickup](/images/blog/mount-cheam-fsr-20260503/c5c08ebe9d91bd44ac8674238f597d70.jpg)

虽然最后我们没有真正到达 Mount Cheam Lookout，但半山腰的平台风景依然很美。山风、阳光、远处的山脊，还有大家终于能安稳坐下来做饭休息的那种满足感，完全不输终点。

![Mountain view from the rest stop](/images/blog/mount-cheam-fsr-20260503/f0ddb7b84fed0b5f354434a6b4d4a526.jpg)

有时候，越野最有意思的地方就在这里：  
你计划的是 A 点到 B 点，最后记住的却是中间那些“哎呀这怎么过去”的瞬间。

回程的时候，我们又去了 Chilliwack River 河边。初夏的河水很猛，也很凉。大家在河边放松了一下，看着水流一路冲下去，突然觉得今天虽然路线改了、Lookout 没到、树也拦路了，但这趟完全没有白来。

![Chilliwack River stop 1](/images/blog/mount-cheam-fsr-20260503/7bb0a8661111d71a8d59695bad4429a1.jpg)

![Chilliwack River stop 2](/images/blog/mount-cheam-fsr-20260503/7a9321d36656eb7e2e7aeda713e06804.jpg)

![Chilliwack River stop 3](/images/blog/mount-cheam-fsr-20260503/898d64cf0a61b51337cb83722c3fabd0.jpg)

因为这就是一次真正的 Offroady trip：

不是打卡式完成任务，  
不是一个人硬扛全程，  
而是一群人一起出发，遇到情况一起判断，能过就过，该停就停，然后把意外变成故事。

这也是 Offroady 想做的事情。

我们不只是列出 trails，也不只是让大家收藏路线。我们更希望本地车友可以找到合适的人、合适的路线、合适的时间，一起安全地出去玩。无论你是 Rubicon、皮卡、SUV，还是刚刚开始接触 forest service road，只要你愿意加入，总能找到适合自己的 trip。

这次没有到达 Lookout。

但我们完成了 Offroady 的第一次真实组队出行。

而且我们已经可以很确定地说：

**下次，还会更好玩。**`,
  videos: [
    {
      type: 'youtube',
      url: 'https://youtu.be/dQw4w9WgXcQ',
      title: 'Mount Cheam FSR Trip Highlights',
      caption: 'A quick recap of our Mount Cheam FSR adventure \u2014 washouts, fallen trees, and river views.',
    },
  ],
  },
  {
    slug: 'trail-difficulty-explained-zh',
    title: '越野难度怎么分？这条路你的车能走吗？',
    excerpt: 'Offroady 把路线难度分为简单、中等、困难、极限四级。每个等级在地上到底意味着什么？教你看懂难度标签，选对路线。',
    category: 'Off-Roading Basics',
    tags: ['难度等级', '路线选择', '新手', 'FSR', 'BC'],
    publishedAt: '2026-05-02T10:00:00-07:00',
    author: 'Offroady Team',
    seoTitle: '越野难度等级怎么分？从简单到极限全解析 | Offroady BC越野指南',
    seoDescription: '简单、中等、困难、极限——每个难度等级在地面上到底意味着什么？你的车能不能走？需要多少经验？BC森林土路新手到老手的路线选择指南。',
    keywords: ['越野难度等级', 'BC FSR路线评分', '新手越野选路', '四驱越野难度', '简单中等困难极限'],
    readingTime: '5分钟',
    status: 'published',
    body: `Offroady 把路线难度分为四个等级——简单、中等、困难、极限。每个等级在路上到底是什么样？你的车能不能走？你现在的经验够不够？今天拆开讲清楚。

## 简单——铺装路或维护良好的碎石路
任何车都能走。天晴的斯阔米什河谷FSR就属于这类。不要求四驱、不要求高离地、不要求任何越野经验。

## 中等——碎石路加零散障碍
绝大多数BC森林土路都在这个范围。松动碎石、轻度搓板路、偶尔坑洼、浅水滩。建议全轮驱动或四驱，最低20厘米离地间隙。

## 困难——真正需要技术了
深车辙、碎石阵、最深30厘米溪流、陡坡。必须四驱，最低25厘米离地间隙。强烈建议有越野驾驶经验。

## 极限——老手专属
大概率要用绞盘，车身损伤正常。需要改装四驱、差速锁、绞盘。高级越野技术必备。

## 选路三原则
- 从比车的能力低一个级别开始
- 多看路线照片和近期出行记录
- 一场暴雨能让中等变困难

想找下一条路线？[浏览全部路线](/trail-of-the-week)或[跟经验丰富的成员组队出发](/join-a-trip)。

---

**📬 每周越野快报直达邮箱——路线推荐、越野技巧、社群活动：**
👉 **[立即订阅](https://www.offroady.app/weekly-digest)**`,
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

// ---------------------------------------------------------------------------
// Canonical multi-language content registry
// ---------------------------------------------------------------------------

function t(post: BlogPost): CanonicalBlogTranslation {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    keywords: post.keywords,
    readingTime: post.readingTime,
    status: post.status,
    coverImage: post.coverImage,
    coverAlt: post.coverAlt,
    videos: post.videos,
  };
}

/**
 * Group adjacent EN/ZH pairs by their slug relationship.
 * ZH slugs end with -zh; EN slugs don't.
 * If no partner exists, one translation is simply empty.
 */
function groupCanonical(raw: BlogPost[]): CanonicalBlogPost[] {
  const enMap = new Map<string, BlogPost>();
  const zhMap = new Map<string, BlogPost>();

  for (const p of raw) {
    if (p.slug.endsWith('-zh')) {
      const base = p.slug.slice(0, -3); // strip '-zh'
      zhMap.set(base, p);
    } else {
      enMap.set(p.slug, p);
    }
  }

  const allKeys = new Set<string>([...enMap.keys(), ...zhMap.keys()]);
  const result: CanonicalBlogPost[] = [];

  for (const key of allKeys) {
    const en = enMap.get(key);
    const zh = zhMap.get(key);

    result.push({
      contentId: key,
      category: (en ?? zh)!.category,
      tags: (en ?? zh)!.tags,
      publishedAt: (en ?? zh)!.publishedAt,
      updatedAt: (en ?? zh)!.updatedAt,
      author: (en ?? zh)!.author,
      relatedTrailSlug: (en ?? zh)!.relatedTrailSlug,
      translations: {
        ...(en ? { en: t(en) } : {}),
        ...(zh ? { zh: t(zh) } : {}),
      },
    });
  }

  return result;
}

const canonicalBlogPosts: CanonicalBlogPost[] = groupCanonical(posts);

export function getAllCanonicalBlogPosts(): CanonicalBlogPost[] {
  return canonicalBlogPosts;
}

export function getCanonicalBlogPostById(contentId: string): CanonicalBlogPost | null {
  return canonicalBlogPosts.find((p) => p.contentId === contentId) ?? null;
}

/**
 * Get a blog translation for a specific language.
 * Falls back to the other language if the requested one doesn't exist or is draft.
 * Returns { translation, availableLang }.
 */
export function getBlogTranslation(
  contentId: string,
  preferredLang: Language
): { translation: CanonicalBlogTranslation; availableLang: Language } | null {
  const canonical = getCanonicalBlogPostById(contentId);
  if (!canonical) return null;

  const pref = canonical.translations[preferredLang];
  if (pref && pref.status === 'published') {
    return { translation: pref, availableLang: preferredLang };
  }

  // Fallback to other language
  const other: Language = preferredLang === 'en' ? 'zh' : 'en';
  const alt = canonical.translations[other];
  if (alt && alt.status === 'published') {
    return { translation: alt, availableLang: other };
  }

  // Still return pref even if draft, so caller can decide
  if (pref) {
    return { translation: pref, availableLang: preferredLang };
  }

  return null;
}

/**
 * Get all published translations across all canonical posts.
 * Returns flat entries with their contentId and language info.
 */
export function getAllPublishedBlogTranslations(): Array<{
  contentId: string;
  lang: Language;
  translation: CanonicalBlogTranslation;
}> {
  const result: Array<{ contentId: string; lang: Language; translation: CanonicalBlogTranslation }> = [];

  for (const canonical of canonicalBlogPosts) {
    for (const [lang, translation] of Object.entries(canonical.translations)) {
      if (translation.status === 'published') {
        result.push({
          contentId: canonical.contentId,
          lang: lang as Language,
          translation,
        });
      }
    }
  }

  // Sort by publishedAt descending
  return result.sort((a, b) => {
    const aDate = canonicalBlogPosts.find((c) => c.contentId === a.contentId)?.publishedAt ?? '';
    const bDate = canonicalBlogPosts.find((c) => c.contentId === b.contentId)?.publishedAt ?? '';
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
}


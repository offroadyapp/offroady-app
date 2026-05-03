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
  // Mamquam River FSR (ZH)
  {
    slug: 'mamquam-river-fsr-zh',
    title: '马姆奎姆河森林路：斯阔米什的后花园入口',
    excerpt: '一个悠闲的下午探索马姆奎姆河谷——这条对新手友好的森林服务土路，在斯阔米什北边打开了通往徒步、露营和河边活动的入口。',
    trailSlug: 'mamquam-river-fsr',
    emailExcerpt: '斯阔米什附近的入门级森林土路，可到河边、露营地，适合轻松探索。新手上路的绝佳第一条路线。',
    body: '马姆奎姆河森林路是那种难得让每个人都能找到乐趣的路线。第一次越野的新手可以在下半段轻松巡航，经验丰富的探险者可以深入河谷找偏远露营地。晴天周六的下午，路上不间断地有皮卡、SUV，偶尔还有跨界车，全往同一个地方去：河边。\n\n## 怎么去\n\n从斯阔米什出发，沿马姆奎姆河森林路经过奎斯特大学路口往北开。路一开始是宽阔平整的碎石路——离地间隙一般的车也能轻松应对。大约5公里后到达第一个河边入口，大多数人在此止步。\n\n过了主要游泳点，路开始变窄。碎石变松了，偶尔出现坑洼，开始有真正进入野外的感觉。约8公里处手机信号消失。到这时候，你就彻底进来了。\n\n## 路上有什么\n\n河本身是最大的亮点。冰冷清澈的冰川融水在光滑的花岗岩石上翻滚。前10公里路边有多个停车点和露营地，大部分是先到先得。夏天周末去的话，建议早到或者选平日。\n\n这条森林路也通往几个徒步路线起点，包括加里波第省立公园钻石头区域。如果你骑山地车，下半段路非常适合做摆渡骑乘。\n\n## 车辆建议\n\n素车斯巴鲁傲虎或RAV4走前10公里完全没问题。再往里路就变糙了。想探索河谷上部的话，建议有高离地间隙。备胎一定带上——河边的尖石头可不留情。\n\n出发前可以[查看马姆奎姆河森林路详情](/plan/mamquam-river-fsr)，或跟其他Offroady成员[组队出行](/plan/mamquam-river-fsr)。',
    coverImage: '/images/blog/mamquam-river-hero.png',
    coverAlt: '斯阔米什马姆奎姆河边停放的越野车，背景是森林覆盖的山脉',
    publishedAt: '2026-04-28T12:00:00-07:00',
    status: 'published',
    seoTitle: '马姆奎姆河森林路：斯阔米什越野入门指南 | Offroady',
    seoDescription: '探索斯阔米什附近的马姆奎姆河森林路——一条对新手友好的森林服务土路，可到河边、露营地、徒步起点。路线笔记和出行建议。',
    keywords: ['马姆奎姆河森林路', '斯阔米什越野', 'BC森林土路新手', '马姆奎姆河谷', '斯阔米什FSR'],
    readingTime: '6分钟',
    author: 'Offroady Team',
    ctaText: '在马姆奎姆河规划你的越野行程',
    researchNotes: '中文版基于BC省休闲场所与路线数据库公开信息。马姆奎姆FSR由斯阔米什林区定期维护。河边露营地先到先得。8公里深处失手机信号。前2公里以外冬季无维护。',
  },
  // Squamish Valley FSR (ZH)
  {
    slug: 'squamish-valley-fsr-zh',
    title: '斯阔米什河谷森林路：新手的完美首秀',
    excerpt: '宽阔的碎石路、壮丽的山谷景观、随处可停的探索点——斯阔米什河谷森林路是很多BC越野人的起点。',
    trailSlug: 'squamish-valley-fsr',
    emailExcerpt: '宽阔碎石路、山谷景色、轻松到达——斯阔米什河谷FSR是BC新手越野的理想入门路线。',
    body: '如果你是BC越野新手，想找一条不用考验救援装备的路线，斯阔米什河谷森林路就是起点。宽阔维护良好的碎石路、前几公里稳定的手机信号，还有那种让你觉得"赚到了"的风景——虽然开起来根本不费劲。\n\n## 驾驶体验\n\n路从斯阔米什河边柏油路尽头开始。沿着斯阔米什河谷向北穿过次生林和开阔草甸。前20公里由BC省林务局定期平整。你可以40到50公里时速巡航，不用担心暗藏的石头或者突然出现的坑。\n\n20公里左右出现分岔路。左边继续沿斯阔米什河谷通往埃拉霍河，右边是阿什卢河森林路——冬天是偏远滑雪的热门通道，夏天则是徒步路线。\n\n## 特别之处\n\n斯阔米什河谷森林路不是为了技术驾驶，而是为了到达。这条路打开了数英里的皇冠土地——露营、徒步、钓鱼、探索。河边有几十个非正式营地——有的有篝火圈，有的看得到坦塔卢斯山脉，有些藏得极好，周二晚上去就是你一个人的。\n\n阿什卢河岔路值得绕道去看看。路沿着阿什卢峡谷经过一些壮观的急流，通往阿什卢山徒步路线起点和著名的天空飞行员区域。\n\n## 新手建议\n\n这是学习基本功的绝佳路线：在碎石路上放胎压、出发前检查备胎、学会怎么观察前方的障碍。即使是跨界车，斯阔米什河谷森林路也能应付。\n\n前往[斯阔米什河谷森林路页面](/plan/squamish-valley-fsr)查看当前路况和即将出发的活动。',
    coverImage: '/images/blog/squamish-valley-hero.png',
    coverAlt: '斯阔米什河谷森林路碎石路蜿蜒穿过森林，远处是山景',
    publishedAt: '2026-04-30T14:00:00-07:00',
    status: 'published',
    seoTitle: '斯阔米什河谷森林路新手指南：第一次越野 | Offroady',
    seoDescription: '斯阔米什河谷森林路是BC新手越野的完美首秀路线。宽阔维护良好的碎石路，风景壮丽，全年路况对新手友好。',
    keywords: ['斯阔米什河谷森林路', 'BC新手越野', '第一次跑FSR', '斯阔米什越野入门', 'BC碎石路驾驶'],
    readingTime: '5分钟',
    author: 'Offroady Team',
    ctaText: '查看斯阔米什河谷FSR详情并规划行程',
    researchNotes: '斯阔米什河谷FSR由BC省林务局定期维护。通往阿什卢河FSR和埃拉霍河谷。约30公里以内路况普遍良好。之后根据季节有变化。入口处有手机信号，约5公里后消失。',
  },
  // Sloquet Hot Springs (ZH)
  {
    slug: 'sloquet-hot-springs-zh',
    title: '通往斯洛奎特温泉的路：一场值得的BC偏远冒险',
    excerpt: '穿过利卢埃特河谷的漫长风景路，通向BC省最好的天然温泉之一。出发前你需要知道这些。',
    trailSlug: 'sloquet-hot-springs',
    emailExcerpt: '通过森林土路到达的偏远天然温泉。从温哥华出发3小时风景驾驶，大部分是碎石路。每一段颠簸都值得。',
    body: '有些目的地本身就能证明那段路的值得。斯洛奎特温泉就是其中之一。藏在利卢埃特河谷深处，这个天然温泉离温哥华三小时车程——大部分在碎石路上。回报是：被原始森林环绕的未经开发的温泉池，河流就在几米外流过。\n\n## 怎么去\n\n从彭伯顿出发，沿利卢埃特河森林路向北。路一开始是铺装的，但很快变成碎石。前30公里维护良好——伐木车辆确保了路面平整。之后路况变糙。搓板路段、松动碎石、偶尔的泥坑开始出现。没什么极端的，但你会庆幸有中等离地间隙和全季胎。\n\n温泉离彭伯顿约90公里。单程留出2到2.5小时驾驶时间。一离开彭伯顿就完全没有手机信号了。出发前下好离线地图，告诉别人你的计划。\n\n## 温泉\n\n斯洛奎特是完全未经开发的。没有建筑、没有工作人员、没有门票。池子是天然岩层，地热水和冰冷的河水混合。温度因池而异——有的像洗澡水，有的真是烫的。你可以搬动石头调节水温，但请恢复原状。\n\n主露营地有旱厕。没有饮用水，没有垃圾收集。所有东西都带出去，包括你的卫生纸。\n\n## 露营\n\n温泉附近的主露营地先到先得。夏天周末的话，周四晚上就满了。要是满了，最后几公里的路上还有停车点和小营地。\n\n## 最佳季节\n\n春末到秋初是最佳窗口。路通常在5月到10月可通行，视积雪情况而定。想独享温泉的话，选平日。\n\n前往[斯洛奎特温泉路线详情](/plan/sloquet-hot-springs)或跟Offroady社群[组队出行](/plan/sloquet-hot-springs)。',
    coverImage: '/images/blog/sloquet-hot-springs-hero.png',
    coverAlt: 'BC偏远地区的天然温泉池，周围被森林环绕',
    publishedAt: null,
    status: 'draft',
    seoTitle: '斯洛奎特温泉：BC森林路路线指南 | Offroady',
    seoDescription: '通过森林服务土路到达斯洛奎特温泉的完整指南。路况如何、需要带什么、BC偏远温泉的路线条件。',
    keywords: ['斯洛奎特温泉', 'BC温泉森林路', '斯洛奎特路况', '利卢埃特河FSR', 'BC偏远温泉'],
    readingTime: '7分钟',
    author: 'Offroady Team',
    ctaText: '规划你的斯洛奎特温泉之旅',
    researchNotes: '斯洛奎特温泉在BC省休闲场所与路线名录中。从彭伯顿出发沿利卢埃特河FSR约90公里。中等离地间隙的全轮驱动车在好天气通常可通过，雨后路况可能变差。离开彭伯顿后无手机信号。温泉本身未开发，天然岩石池水温各异。除旱厕外无任何设施。露营先到先得。Backroad Mapbooks中清晰标注了路线。',
  },
  // Mount Cheam RAV4 (ZH)
  {
    slug: 'mount-cheam-rav4-zh',
    title: '素车RAV4能开到奇姆山吗？我们试了',
    excerpt: '奇姆山是BC省最热门的徒步目的地之一。但普通跨界车能开上它的上山路吗？我们实测了。',
    trailSlug: 'mount-cheam-fsr-access',
    emailExcerpt: '素车丰田RAV4能开上奇姆山FSR吗？我们实测了——关于这条热门BC上山路的发现。',
    body: '奇姆山是菲沙河谷最热门的徒步目的地之一。晴朗的夏日周末，山顶停车场一大早就满了。但到那个停车场需要开上奇姆山森林路——一条以"吃车"出名的路。\n\n我们开了一辆素车2023款丰田RAV4（21厘米离地间隙），在一个干燥的九月天开上了这条上山路，看看它的名声是否名副其实。\n\n## 上山路\n\n路从奇瓦克湖路尽头开始。第一段是平整良好的碎石路——任何车都能走。但大约2公里后路面变了。碎石变成了嵌在土里的石头、裸露的树根和偶尔的深车辙。路持续爬升，10公里内海拔上升约800米。\n\n## 挑战\n\n三段路需要特别注意：\n\n**连续发夹弯**——又窄又陡，路面有松动碎石。速度惯性能帮你，但太快了会甩到外线。在RAV4上，我们用一档加牵引力控制稳稳通过。\n\n**石头阵**——半程左右，一段约50米的嵌石路段，逼着你仔细选线。RAV4以最高石头处约2.5厘米的余量通过了。慢和稳赢了这一天。\n\n**最后陡坡**——快到停车场前的一段短而陡的爬坡。RAV4的全轮驱动系统没打滑就上去了，但我们把胎压放到了22 PSI以增加抓地力。\n\n## 结论\n\n素车RAV4在干燥天小心驾驶的话，完全能开上奇姆山FSR。但有个前提：这条路不适合雨天、夜间或离地间隙低于20厘米的车尝试。而且人多了山顶车位紧张，得早到。\n\n前往[奇姆山FSR路线详情](/plan/mount-cheam-fsr-access)或[规划行程](/plan/mount-cheam-fsr-access)亲自去看看。',
    coverImage: '/images/blog/mount-cheam-hero.png',
    coverAlt: '中型SUV行驶在奇姆山FSR上，背景是奇姆山',
    publishedAt: null,
    status: 'draft',
    seoTitle: '奇姆山FSR开RAV4能上吗？跨界车越野实测 | Offroady',
    seoDescription: '素车丰田RAV4开上奇姆山FSR上山路的实测。到底能不能上去？路线选择、胎压和离地间隙的实际经验分享。',
    keywords: ['奇姆山FSR', 'RAV4越野', '跨界车FSR测试', '奇姆山上山路', 'BC路线车辆要求'],
    readingTime: '6分钟',
    author: 'Offroady Team',
    ctaText: '查看奇姆山路线详情',
    researchNotes: '中文版基于公开越野社区出行报告。奇姆山FSR上山路在奇瓦克地区很有名。路况从平整碎石逐渐变为上层路段的深车辙和石头。离地间隙20厘米以上的素车跨界车在干燥天气小心选线可通过。多数来源推荐高离地间隙四驱以获得无压力体验。该路段有伐木车辆活动，出发前请确认是否正在伐木作业。',
  },
  // Whipsaw Creek (ZH)
  {
    slug: 'whipsaw-creek-zh',
    title: '鞭溪：BC越野人的真正试炼',
    excerpt: '鞭溪森林路不是新手路线。岩石路段、陡坡攀爬和技术驾驶，使它成为BC越野爱好者的成年礼。',
    trailSlug: 'whipsaw-creek-forest-service-road',
    emailExcerpt: '鞭溪是BC省终极四驱挑战路线。技术岩路、陡坡、壮丽景色。不适合新手。',
    body: '鞭溪不是你"顺便"开到的一条路。它是一条你可以提前准备、精心规划、然后跟人聊好几周的路。位于BC省普林斯顿附近，这条30公里的路线穿过西米卡米恩地区，被广泛认为是BC省素车合法四驱路线中最具挑战的路线之一。\n\n## 路线\n\n起点在鞭溪森林路，蜿蜒穿过花岗岩溪区域。前几公里平平无奇——碎石路、几个坑、没什么特别。然后路线下到峡谷，一切都变了。\n\n**石头阵**是主角。持续不断的嵌石路段，要求仔细选线和低速四驱挡。离地间隙至关重要——最低25厘米，越高越好。素车吉普和塔科马能过，但准备好听护板的摩擦声。\n\n**过溪**在干燥天很简单，但雨后就是真正的障碍了。水位可以迅速上涨。出发前检查天气预报，做好路况变化就掉头的准备。\n\n**崖边路段**又窄又暴露。不适合恐高或容错空间小的人。\n\n## 车辆要求\n\n- 高离地间隙（25厘米以上）\n- 低速四驱\n- 救援装备：动能绳、软卸扣、脱困板\n- 建议配备绞盘\n- 强烈建议装护板\n- 至少两辆车组队\n\n## 最佳季节\n\n6月到10月，视积雪情况而定。早春上段可能有积雪。晚秋天气干燥，抓地力极佳。\n\n这是一条需要组队的路线。跟有经验的驾驶员一起，带齐救援装备，留一整天。[查看鞭溪路线详情](/plan/whipsaw-creek-forest-service-road)或找一个组队活动。',
    coverImage: '/images/blog/whipsaw-creek-hero.png',
    coverAlt: '四驱车在BC偏远地区鞭溪路线的岩石地形上行驶',
    publishedAt: null,
    status: 'draft',
    seoTitle: '鞭溪FSR：BC终极四驱挑战路线 | Offroady',
    seoDescription: '鞭溪FSR完整路线指南——BC省最具技术挑战的越野路线。需要带什么、会经历什么、如何为这条路做准备。',
    keywords: ['鞭溪', 'BC四驱挑战', '技术越野BC', '鞭溪路线指南', 'BC高级越野'],
    readingTime: '8分钟',
    author: 'Offroady Team',
    ctaText: '查看鞭溪路线详情和出行选项',
    researchNotes: '鞭溪被广泛认为是BC省最具挑战的素车合法四驱路线之一。位于普林斯顿附近，约30公里穿过花岗岩溪区域。路线以持续的石头阵、陡坡、过溪和狭窄崖边路段为特征。建议高离地间隙加差速锁。必备绞盘和救援装备。最好至少2-3辆车组队。通常6月至10月开放，视积雪而定。路线上无手机信号。从花岗岩溪侧出口可形成环线。信息来源：BC省林务局、Backroad Mapbooks、BC4x4论坛社区出行报告。',
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

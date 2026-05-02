import Link from 'next/link';
import type { Metadata } from 'next';
import PageShell from '@/app/components/PageShell';

export const metadata: Metadata = {
  title: '第一次越野要准备什么？新手必读装备清单 | Offroady Blog',
  description: '在BC的森林服务土路（FSR）上，新手第一次越野应该带什么装备？自救装备、胎压放气、通讯导航、安全清单——BC老越野的经验总结。',
  openGraph: {
    title: '第一次越野要准备什么？新手必读装备清单',
    description: '脱困板、拖车绳、胎压放气、急救包……BC森林土路新手越野装备全清单。',
    url: 'https://www.offroady.app/blog',
    siteName: 'Offroady',
    images: [
      {
        url: 'https://www.offroady.app/images/blog/first-trip-gear-hero.png',
        width: 1024,
        height: 1024,
      },
    ],
    locale: 'zh_CN',
    type: 'article',
  },
};

export default function BlogIndexPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-black/8 bg-[#101412] px-8 py-10 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9dc2a2]">Blog</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Offroady Blog</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/80">
            Trail guides, trip reports, vehicle builds, and stories from the BC backcountry.
          </p>
        </section>

        <section className="mt-8">
          <article className="overflow-hidden rounded-3xl border border-black/8 bg-white shadow-sm">
            <img
              src="/images/blog/first-trip-gear-hero.png"
              alt="Off-road gear laid out on tailgate in BC forest"
              className="aspect-[2/1] w-full object-cover"
            />
            <div className="p-8 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Beginner Guide</p>
              <h2 className="mt-2 text-3xl font-bold text-[#243126]">
                第一次越野要准备什么？新手必读装备清单
              </h2>
              <p className="mt-2 text-sm text-gray-500">Published — May 1, 2026</p>
              <div className="mt-6 space-y-5 text-base leading-8 text-gray-700">
                <p>
                  第一次开上森林服务土路（FSR），那种既兴奋又有点紧张的感觉，每个老越野都经历过。轮胎压在碎石上咔咔响、对面来车扬起一片尘土、手机信号一格一格往下掉——这些全是你即将习惯的日常。
                </p>
                <p>
                  但说实话，BC的山里没信号的地方太多了。万一陷车了、爆胎了、路被倒木挡住了，光靠一个热心路人搭把手？概率不大。所以我写了这份清单，不是要吓你，而是让你第一次出去的时候心里有底。
                </p>

                <h3 className="pt-4 text-xl font-bold text-[#243126]">一、最基础的：车要有底子</h3>
                <p>
                  不是非得开牧马人或者陆巡才能上FSR。很多BC的森林土路，带个中等离地间隙的四驱SUV（RAV4、Outback、4Runner这些）完全能走。出发前检查三样东西就够了：
                </p>
                <p>
                  备胎——检查一下。别笑，很多人开了一年都不知道备胎早就压没气了或者五年没换过。<br />
                  电池——如果还是原厂电瓶，超过四年了，建议换个新的再出发。<br />
                  底盘护板——没有也没关系，但要有心理准备：飞起来的石头可能会打到底盘或者水箱。
                </p>

                <h3 className="pt-4 text-xl font-bold text-[#243126]">二、自救装备：陷车了怎么办？</h3>
                <p>
                  在FSR上陷车不是"会不会"的问题，是"什么时候"的问题。泥坑、积雪、沙地、或者只是不小心开偏了一个轮子——新手最容易犯的错就是低估一条看起来平平无奇的土路。
                </p>
                <ul className="list-disc space-y-3 pl-6">
                  <li><strong>脱困板（Traction Boards）</strong>——绝对是新手第一件应该买的装备。两条黄色或橙色的板子往轮胎下面一塞，比什么都管用。Maxtrax是行业标准，但Amazon上几十刀的也能救急。</li>
                  <li><strong>拖车绳（Kinetic Recovery Rope）</strong>——不是普通拖车绳，是那种带弹力的动能绳。BC的4x4圈子里公认20,000磅以上断裂强度才够用。</li>
                  <li><strong>软卸扣（Soft Shackles）</strong>——比钢制卸扣安全得多，钢卸扣崩断了就是一颗子弹。软卸扣就算断也不会伤人。</li>
                  <li><strong>折叠铲（Shovel）</strong>——一把好用的工兵铲，挖泥挖雪能省掉你等救援的几小时。</li>
                </ul>

                <h3 className="pt-4 text-xl font-bold text-[#243126]">三、放气！放气！放气！</h3>
                <p>
                  这是新手最常忽略的一件事。公路胎压35-40 PSI，上了碎石路不放到20-25 PSI，你就是在玩弹球——轮胎在石头上跳来跳去，抓地力为零，还容易爆胎。
                </p>
                <p>
                  买一个几块钱的胎压笔和放气工具，上FSR前把四个轮子放到约20 PSI。回来上高速之前别忘了打回去。一台便携充气泵（二三十刀就够用）是必备的。
                </p>

                <h3 className="pt-4 text-xl font-bold text-[#243126]">四、通讯和导航</h3>
                <p>
                  BC很多FSR完全没手机信号。不要假设"到山顶可能会有信号"。如果你一个人去、或者车队只有两台车，强烈建议备一个卫星通讯设备：
                </p>
                <ul className="list-disc space-y-3 pl-6">
                  <li><strong>Garmin InReach</strong>或<strong>Zoleo</strong>——最可靠的选择，可以发短信、共享位置、按SOS求救按钮。月费大约15-35刀。</li>
                  <li><strong>离线地图</strong>——提前在手机上把区域地图下载好。Gaia GPS、AllTrails、或者直接用Google Maps离线区域都行。</li>
                  <li>实在什么都没有？至少告诉朋友或家人你打算去哪条路、大概几点回来。</li>
                </ul>

                <h3 className="pt-4 text-xl font-bold text-[#243126]">五、安全和舒适</h3>
                <ul className="list-disc space-y-3 pl-6">
                  <li><strong>急救包</strong>——Amazon上几十刀一个的急救包，至少要包括绷带、消毒湿巾、止血带。</li>
                  <li><strong>水和食物</strong>——多带一箱水、几包能量棒或者干粮。陷车耽误几个小时是常有的事。</li>
                  <li><strong>保暖衣物</strong>——BC山区哪怕夏天，晚上也可能降到个位数。一件抓绒或软壳外套放车上不吃亏。</li>
                  <li><strong>手套</strong>——搬石头、拉钢缆、换轮胎，一副结实的工作手套能救你的手。</li>
                  <li><strong>充电宝</strong>——带一个能启动汽车的应急电源（Jump Starter），比单纯充电宝实用十倍。</li>
                </ul>

                <h3 className="pt-4 text-xl font-bold text-[#243126]">六、车上还有几样小东西</h3>
                <ul className="list-disc space-y-3 pl-6">
                  <li>小手电或头灯——手机手电不够亮，而且费电。</li>
                  <li>胶带（Duct Tape）——修什么都行，散热器管路破了都能临时缠一缠。</li>
                  <li>多功能工具或者一套基础扳手套筒。</li>
                  <li>一小段绳子和扎带。</li>
                  <li>纸巾和湿巾——别笑，越野车脏得太快了。</li>
                </ul>

                <h3 className="pt-4 text-xl font-bold text-[#243126]">最后的话</h3>
                <p>
                  新手第一次跑FSR，选一条简单的路——找那种评分"Easy"或"Medium"的、离家近的、白天来回的。不要一上来就挑战Whipsaw Creek或者Statlu Lake那种硬核路线。
                </p>
                <p>
                  叫上至少一台车一起走。两台车如果有一台陷了，另一台能拉出来。一个人去BC深山里陷车，那个体验真的不太美好。
                </p>
                <p>
                  做好准备了就把车开上去吧。BC的森林服务土路是这个省最好的秘密——开阔的景色、安静的山谷、只有你和你朋友在路上。第一次碎石路开完回来，你肯定会开始计划下一次。
                </p>
                <p className="font-semibold text-[#2f5d3a]">
                  在BC，去哪儿玩？和谁去？可以多看看 <a href="https://www.offroady.app" className="underline decoration-[#9dc2a2] underline-offset-4 hover:decoration-[#2f5d3a]">www.offroady.app</a>。
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </PageShell>
  );
}

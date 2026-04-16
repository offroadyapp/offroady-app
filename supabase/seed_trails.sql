-- Offroady trail seed data generated from trails/trails.json
-- Safe to re-run: upserts by slug

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'mamquam-river-fsr', 'Mamquam River FSR', 'Squamish', 49.68877, -123.14726, '公开 FB 帖子把 Mamquam 讨论成经典 Squamish 主线：有人问 Indian River / Mamquam 是否关闭，也有人反馈雪和冰对通行影响很大。它属于典型主线好走、支线更有挑战的区域。', 'Trailforks Mamquam FSR trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10162178880281009/', 'FB public post + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'indian-river-fsr-turnoff-from-mamquam', 'Indian River FSR (turnoff from Mamquam)', 'Squamish', 49.70619, -123.10511, '公开 FB 帖子直接在问 Indian River FSR 的通行情况；另一公开资料给出了从 Mamquam 分入 Indian River 的接近点坐标，因此这条线的接近位置可以较高置信度核到。', 'Untrammelled Travels route access coordinates for Indian River turnoff', 'https://www.facebook.com/groups/4wdabc/posts/10160245499671009/', 'FB public post + route guide turnoff coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'squamish-valley-fsr', 'Squamish Valley FSR', 'Squamish', 49.9028, -123.29324, '公开 FB 帖子里有人直接提到 Squamish Valley FSR 上段雪况和雨后条件；第二来源给出了 gravel FSR 开始的位置，因此适合作为入口规划点。', 'Untrammelled Travels gravel FSR start coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10158743758246009/', 'FB public post + route guide coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'ashlu-river-fsr', 'Ashlu River FSR', 'Squamish', 49.91432, -123.29259, '公开 FB 讨论里常把 Ashlu 当作 Squamish 一带的 scenic / backcountry 线路；Trailforks 给出了 Ashlu River FSR 的 trailhead 坐标，可作为较稳的入口定位。', 'Trailforks Ashlu River FSR trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10162506290371009/', 'FB public post + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'harrison-east-fsr', 'Harrison East FSR', 'Harrison', 49.35109, -121.74476, '公开 FB 帖子有人直接写自己昨天一路开到 East Harrison 的 70 km 标记附近，说明它是持续有人实跑的主线。Trailforks 也给出了 trailhead 坐标。', 'Trailforks Harrison East FSR trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10162303067231009/', 'FB public post + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'west-harrison-stsailes-west-fsr-approach', 'West Harrison / Sts''ailes (West) FSR approach', 'Harrison', 49.33173, -121.86669, '公开 FB 帖子有 West Harrison 实时路况反馈，也有人写到已经从 West Harrison 一路跑通到更远处。这里给的是可核到坐标的 West Harrison / Sts''ailes 接近点。', 'Trailforks Sts''ailes (West) FSR trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10162318323826009/', 'FB public post + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'norrish-creek-fsr', 'Norrish Creek FSR', 'Mission / Abbotsford', 49.19923, -122.15353, '公开 FB 帖子直接把 Norrish 描述成“很好看、很多可探索点，但雪线会很快变深”；第二来源可以核到 Norrish Creek FSR 接近坐标，同时公开路况也说明这里存在 gate 管理。', 'Trailforks Norrish Creek Forest Service Road Chute trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10162317599796009/', 'FB public post + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'florence-lake-fsr', 'Florence Lake FSR', 'Maple Ridge / Stave', 49.22951, -122.35815, '公开 FB 讨论里有人直接提到夜里上 Florence Lake FSR、也有人讲到 gate 和 road upgrades。第二来源给出了 Florence Lake FSR 的接近入口坐标。', 'Untrammelled Travels Florence Lake FSR access coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10161210383281009/', 'FB public post + route guide access coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'eagle-mountain-access-area', 'Eagle Mountain access area', 'Coquitlam', 49.31416, -122.80233, '公开 FB 帖子里有人直接讨论 Eagle Mountain 顶部路线名称和状态；4WDABC 官方明确这条线是 key-managed access。这里给的是公开可核的 access 区域坐标，而不是山顶坐标。', 'Trailforks Eagle Mountain Park Access trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10161418502831009/', 'FB public post + Trailforks access coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'jones-lake-route-waypoint', 'Jones Lake route waypoint', 'Fraser Valley / Hope', 49.23837, -121.60344, '公开 FB 帖子说明 Jones Lake 是常被讨论的 easy scenic drive / camping 区域；由于公开搜索结果更容易核到湖边 camp 点位，这里提供的是 Jones Lake 路线中的可验证公共营地坐标。', 'Untrammelled Travels Jones Lake campsite coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10160273067536009/', 'FB public post + public campsite coordinates on route', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'kookipi-creek-fsr', 'Kookipi Creek FSR', 'Harrison / Nahatlatch connector', 49.85735, -121.74111, '公开 FB 帖子直接讨论了 Kookipi FSR、fire tower 和春季暴雪，还提到这条线会连接 Nahatlatch 一带。第二来源给出了 Kookipi Creek FSR 的 trailhead 坐标。', 'Trailforks Kookipi Creek FSR trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10161520259571009/', 'FB public post + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'chehalis-forest-service-road', 'Chehalis Forest Service Road', 'Harrison / Fraser Valley', 49.25369, -121.95458, '公开 FB 帖子把 Chehalis 描述成“很好开、低压力、主路状态不错”的经典轻松线路；第二来源给出了 Chehalis FSR 的 trailhead 坐标，适合做入口规划。', 'Trailforks Chehalis Forest Service Road trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10160913029901009/', 'FB public post + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'mystery-creek-fsr-approach', 'Mystery Creek FSR approach', 'Harrison / North Chehalis', 49.33173, -121.86669, '公开 FB 帖子明确提到 Mystery Creek 仍有 hard compact snow 和 ice，也有人讨论它与 Chehalis 是否还能连通。这里用的是可核到的 west-side corridor 接近点，用于规划进入 Mystery Creek 区域。', 'Trailforks Mystery Creek FSR access info via Sts''ailes West FSR corridor', 'https://www.facebook.com/groups/4wdabc/posts/10162388503721009/', 'FB public post + Trailforks access corridor coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'nahatlatch-fsr', 'Nahatlatch FSR', 'Boston Bar / Nahatlatch', 49.95043, -121.48936, '公开 FB 帖子里有人分享新的 Nahatlatch fire lookout 走法，写到进入 Nahatlatch FSR 后还会遇到 logging truck；第二来源则给出了 Nahatlatch FSR trailhead 坐标。', 'Trailforks Nahatlatch FSR trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10162609434226009/', 'FB public post + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'nahatlatch-fire-lookout-access', 'Nahatlatch Fire Lookout access', 'Boston Bar / Nahatlatch', 49.98676, -121.53559, '同一条公开 FB 帖子明确讨论了如何从新的路线去 Nahatlatch fire lookout；第二来源可核到 fire lookout 接近点坐标，适合做高处目标定位。', 'Trailforks Nahatlatch Fire Lookout trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10162609434226009/', 'FB public post + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'chipmunk-creek-fsr', 'Chipmunk Creek FSR', 'Chilliwack', 49.15215, -121.74252, '公开 FB 帖子提到 Chipmunk FSR 雪地有 ruts 但仍可达，也有人讨论通往 Mt Cheam 的状况。第二来源给出了 Chipmunk Creek FSR 的 trailhead 坐标。', 'Trailforks Chipmunk Creek FSR trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10160122604146009/', 'FB public post + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'mount-cheam-fsr-access', 'Mount Cheam FSR access', 'Chilliwack', 49.15215, -121.74252, '公开 FB 帖子直接问 Mt Cheam FSR 最近能不能上、雪到什么程度；Trailforks 说明 Mt Cheam FSR 是从 Chipmunk Creek main 分上去的 4x4 access 路段，因此这里沿用其主接近点坐标。', 'Trailforks Mount Cheam FSR description / Chipmunk main access coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10160871942406009/', 'FB public post + Trailforks route description and access point', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'bridal-falls-fsr', 'Bridal Falls FSR', 'Chilliwack', 49.17321, -121.74278, '公开 FB 帖子说明 Bridal Falls FSR 接近顶部前约 900 米有明显滑塌、车通常到不了最上面；第二来源给出了 Bridal Falls FSR 的 trailhead 坐标。', 'Trailforks Bridal Falls FSR trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10160053133241009/', 'FB public post + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'statlu-lake-north-side-trailhead-via-mystery-creek-north-chehalis', 'Statlu Lake north-side trailhead via Mystery Creek / North Chehalis', 'Harrison / North Chehalis', 49.50481, -122.00459, '公开 FB 帖子里有人开 Ridgeline 去 Statlu Lake 北侧接近线，反馈有很多小 washout、rocks 和 cross ditches；第二来源给出了从 Mystery Creek / North Chehalis 下来的具体 trailhead 坐标。', 'Untrammelled Travels Statlu Lake trailhead coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10161322489121009/', 'FB public post + route guide trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'mount-woodside-forest-service-road', 'Mount Woodside Forest Service Road', 'Harrison Hot Springs', 49.23314, -121.90114, '你给的 Backroad Explorers 群里公开帖子直接讨论了 Mount Woodside 一年后的变化，还有另一条公开帖把它当作 moderate day run 选项。这条线是 Harrison 周边最典型的近程观景路线之一。', 'Trailforks Mount Woodside Forest Service Road trailhead coordinates', 'https://www.facebook.com/groups/1867571796698144/posts/24677897421905591/', 'FB public post from provided group + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'whipsaw-creek-forest-service-road', 'Whipsaw Creek Forest Service Road', 'Princeton / Manning area', 49.27911, -120.71985, '你给的 BC LET''S GO WHEELING 群里公开帖子明确讨论 Whipsaw 的当前状况，并提到这条线有 alpine views、side obstacles，适合真正想走 trail 的车辆。第二来源给出了 Whipsaw Creek FSR 的 trailhead 坐标。', 'Trailforks Whipsaw Creek Forest Service Road trailhead coordinates', 'https://www.facebook.com/groups/634197407174444/posts/1621973261730182/', 'FB public post from provided group + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'owl-creek-fsr', 'Owl Creek FSR', 'Pemberton / Mosquito Lake', 50.35642, -122.73433, '你给的 Backroad Explorers 群里公开帖子直接问 Owl Creek FSR 最近是否还能通过；Trailforks 则给出了 Owl Creek FSR 的 trailhead 坐标，并有单独的 washout trail report 说明它会因路损关闭。', 'Trailforks Owl Creek FSR trailhead coordinates', 'https://www.facebook.com/groups/1867571796698144/posts/7327453010709968/', 'FB public post from provided group + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'ford-mountain-fsr', 'Ford Mountain FSR', 'Tamihi / Chilliwack River', 49.09536, -121.59856, '你给的 Backroad Explorers 群里公开帖子明确把 Ford Mountain FSR 列为 Tamihi 区域适合 day trip 的线路之一，并与 Foley 等路线一起提到。第二来源给出了 Ford Mountain FSR 的 trailhead 坐标。', 'Trailforks Ford Mountain FSR trailhead coordinates', 'https://www.facebook.com/groups/1867571796698144/posts/8353811228074136/', 'FB public post from provided group + Trailforks trailhead coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'hale-creek-easy-way-access-area', 'Hale Creek (easy-way access area)', 'West Harrison', 49.5, -121.9, '公开 FB 帖子明确把 Hale Creek 列为 4WDABC 在 West Harrison 合同下维护的地点之一；另一公开越野路线说明写到 Hale Creek easy way 就在 Morris Valley FSR 23 km 标记之后。这里给的是用于行前规划的近似接近点，而不是 campsite 内任意点。', 'OnX / Gaia style route overview plus public Harrison references placing Hale Creek just past km 23 on West Harrison', 'https://www.facebook.com/groups/4wdabc/posts/10161327718471009/', 'FB public post + public route overview / km-based location reference', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'francis-lake-recreation-site-approach', 'Francis Lake Recreation Site approach', 'West Harrison / Weaver side', 49.34245, -121.84974, '公开 FB 帖子把 Francis Lake 列为 4WDABC 在 West Harrison 体系下维护的地点之一；第二来源可以核到 Francis Lake Recreation Site 的坐标，且官方/区域资料也明确它通过 West Harrison / Weaver 体系接近。', 'Public map listing Francis Lake Recreation Site exact coordinates', 'https://www.facebook.com/groups/4wdabc/posts/10161327718471009/', 'FB public post + public map coordinates', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.trails (
  slug, title, region, latitude, longitude, summary_zh, coordinate_source, facebook_post_url, notes, verification_level, source_type, featured_candidate, is_featured, is_published
)
values (
  'borden-creek-fsr', 'Borden Creek FSR', 'Tamihi / Chilliwack River', 49.108, -121.62, '你给的 Backroad Explorers 群公开帖子在讨论 Tamihi 区域 day trip 时直接点名 Borden Creek FSR；Trailforks 对 Borden Creek FSR 有独立 trail listing，并说明其从 Chilliwack Lake Road 进入。这里给的是规划级接近点坐标。', 'Trailforks Borden Creek FSR trail listing and Chilliwack Lake Rd access references', 'https://www.facebook.com/groups/1867571796698144/posts/8353811228074136/', 'FB public post from provided group + Trailforks/public access references', 'double-verified', 'facebook-public-post-plus-secondary-public-source', true, false, true
)
on conflict (slug) do update set
  title = excluded.title,
  region = excluded.region,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary_zh = excluded.summary_zh,
  coordinate_source = excluded.coordinate_source,
  facebook_post_url = excluded.facebook_post_url,
  notes = excluded.notes,
  verification_level = excluded.verification_level,
  source_type = excluded.source_type,
  featured_candidate = excluded.featured_candidate,
  is_published = excluded.is_published,
  updated_at = now();


/**
 * Auto Blog Generator for Offroady External Content Pipeline
 *
 * Generates original EN + ZH blog posts from external content sources.
 * Privacy-first: never copies original text verbatim. Always rewrites.
 * No external images are used without authorization.
 */

import { getServiceSupabase } from '@/lib/supabase/server';
import { localTrails } from '@/lib/offroady/trails';
import type { ExternalContentSource } from './external-content-discovery';

/**
 * Extended source type that includes DB-persisted fields.
 * Used after a source has been saved to the database.
 */
export type DbContentSource = ExternalContentSource & {
  id: string;
  matched_trail_id?: string | null;
  matched_trail_name?: string | null;
};

// ─── Types ────────────────────────────────────────────────────

export type GeneratedBlog = {
  translationGroupId: string;
  language: 'en' | 'zh';
  slug: string;
  title: string;
  excerpt: string;
  contentMarkdown: string;
  seoTitle: string;
  seoDescription: string;
  category: 'Trail Stories' | 'Community Events' | 'Completed Trips' | 'Trail Guides';
  coverImageUrl?: string;
  sourceUrl?: string;
  sourceNote?: string;
};

export type BlogPair = {
  translationGroupId: string;
  english: GeneratedBlog;
  chinese: GeneratedBlog;
  relatedTrailId: string | null;
  matchedTrailSlug: string | null;
  sourceId: string;
};

// ─── Helpers ───────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

function generateTranslationGroupId(): string {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function getDefaultCover(trailSlug?: string | null): string | undefined {
  // Use Offroady's own trail images when available
  if (trailSlug) {
    return `/images/trails/${trailSlug}/hero.jpg`;
  }
  return '/images/blog/default-trail-hero.jpg';
}

function formatDate(date?: string): string {
  if (!date) return 'recently';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return 'recently';
  }
}

function formatDateZh(date?: string): string {
  if (!date) return '近期';
  try {
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  } catch {
    return '近期';
  }
}

// ─── EN Blog Generation ───────────────────────────────────────

function generateEnSlug(source: ExternalContentSource, trailSlug?: string | null): string {
  const trail = trailSlug || slugify(source.detected_trail_name || source.raw_title);
  const suffix = slugify(source.raw_title).slice(0, 30);
  return `${trail}-${suffix}`;
}

function generateZhSlug(enSlug: string): string {
  return `${enSlug}-zh`;
}

function generateEnTitle(source: ExternalContentSource, trailName?: string | null): string {
  const trail = trailName || source.detected_trail_name || 'BC Off-Road Trail';
  const activity = source.detected_activity_type || '4x4 Adventure';

  if (source.detected_event_date) {
    return `${trail}: ${activity} Trip Report — ${formatDate(source.detected_event_date)}`;
  }
  return `${trail}: A Community ${activity} Worth Planning`;
}

function generateZhTitle(source: ExternalContentSource, trailName?: string | null): string {
  const trail = trailName || source.detected_trail_name || 'BC越野路线';
  const activity = source.detected_activity_type || '越野探险';

  if (source.detected_event_date) {
    return `${trail}：${activity}出行报告 — ${formatDateZh(source.detected_event_date)}`;
  }
  return `${trail}：一次值得规划的社区${activity}`;
}

function generateEnExcerpt(source: ExternalContentSource, trailName?: string | null): string {
  const trail = trailName || source.detected_trail_name || 'this trail';
  const region = source.detected_region || 'BC';

  if (source.detected_event_date) {
    return `Recent community activity on ${trail} in the ${region} area suggests it is a great option for your next off-road adventure. Check trail conditions, vehicle requirements, and plan your trip.`;
  }
  return `${trail} in the ${region} area continues to attract local 4x4 enthusiasts. Here is what we know about this trail and why it is worth planning a trip.`;
}

function generateZhExcerpt(source: ExternalContentSource, trailName?: string | null): string {
  const trail = trailName || source.detected_trail_name || '这条路线';
  const region = source.detected_region || 'BC';

  if (source.detected_event_date) {
    return `近期${region}地区${trail}有社区越野活动，路况适合规划下一次出行。查看路线详情、车辆要求，和车友一起组队出发。`;
  }
  return `${region}地区的${trail}持续吸引本地越野爱好者。来看看这条路线有什么亮点，值得你规划一次组队出行。`;
}

function generateEnBody(source: ExternalContentSource, trailContext?: Record<string, unknown> | null): string {
  const trailName = source.detected_trail_name || 'this trail';
  const region = source.detected_region || 'British Columbia';
  const activity = source.detected_activity_type || 'off-road adventure';
  const difficulty = source.detected_difficulty || 'intermediate';
  const vehicleReq = source.detected_vehicle_requirement || 'high-clearance 4x4';
  const season = source.detected_season || 'late spring through early fall';
  const eventDate = source.detected_event_date ? formatDate(source.detected_event_date) : 'recently';

  const trailSlug = trailContext?.slug;
  const planUrl = trailSlug ? `/plan/${trailSlug}` : null;
  const trailTitle = trailContext?.title || trailName;

  const trailDifficultySection = trailContext?.difficulty
    ? `- **Official difficulty:** ${trailContext.difficulty}`
    : '';

  const sections: string[] = [];

  // Title
  sections.push(`# ${generateEnTitle(source, trailName)}`);

  // Opening
  sections.push(
    `${trailTitle} in the ${region} area has recently seen community interest and activity. ` +
    (eventDate !== 'recently'
      ? `Around ${eventDate}, local 4x4 drivers were exploring this area. `
      : `Recent community posts and event listings suggest that this area continues to attract local 4x4 drivers. `) +
    `This is an original Offroady summary of publicly available information — we do not reproduce any personal posts, comments, or images.`
  );

  // Why this trail caught our eye
  sections.push(
    `## Why this trail caught our eye\n\n` +
    `${trailName} offers a compelling ${activity} experience in the ${region} area. ` +
    (trailContext
      ? `It is a ${trailContext.difficulty || 'well-known'} route that ${trailContext.card_blurb || 'provides a great off-road experience'}. `
      : `The trail provides access to scenic backcountry terrain suitable for off-road exploration. `) +
    `Community activity around this trail suggests it is actively used and worth planning a trip to.`
  );

  // What kind of trip is this
  sections.push(
    `## What kind of trip is this?\n\n` +
    `Based on publicly available community information:\n\n` +
    `- **Difficulty:** ${difficulty}\n` +
    `${trailDifficultySection ? trailDifficultySection + '\n' : ''}` +
    `- **Vehicle requirement:** ${vehicleReq}\n` +
    `- **Best season:** ${season}\n` +
    `- **Activity type:** ${activity}`
  );

  // Trail and vehicle notes
  sections.push(
    `## Trail and vehicle notes\n\n` +
    `When planning a trip to ${trailName}, keep these considerations in mind:\n\n` +
    `- **Road conditions can vary** by season and recent weather. Always check current conditions before heading out.\n` +
    `- **${vehicleReq}** is recommended for this area. If you are unsure about your vehicle, consider going with a group.\n` +
    `- **Recovery gear** is always a good idea — bring traction boards, a recovery strap, and basic tools.\n` +
    `- **Seasonal access:** ${season} is typically the best window. Check for early snow or washouts.\n` +
    (trailContext?.route_condition_note
      ? `- **Route note:** ${trailContext.route_condition_note}\n`
      : `- **Route note:** Conditions are based on publicly available community reports. Verify before you go.\n`)
  );

  // Community activity (original language, never copied)
  sections.push(
    `## Community activity\n\n` +
    `Recent community posts and event listings suggest that ${trailName} in the ${region} area continues to attract local 4x4 drivers. ` +
    (eventDate !== 'recently'
      ? `There was notable community interest around ${eventDate}, with drivers sharing experiences about the trail conditions and scenery. `
      : `The trail has seen ongoing community interest for ${activity} trips. `) +
    `As with any off-road destination, conditions can change quickly — recent visitors recommend checking local forums for up-to-date reports before heading out.`
  );

  // Plan it on Offroady
  const planSection =
    `## Plan it on Offroady\n\n` +
    (planUrl
      ? `- [View the ${trailTitle} trail page](${planUrl}) for detailed information\n`
      : `- This trail is not yet listed on Offroady. Consider [proposing it](/propose-a-trail) so the community can find and plan trips here.\n`) +
    `- [Plan a trip](/plan) with other Offroady members\n` +
    `- Join a group run or start your own adventure\n` +
    `- Share your completed trip and help the community`;

  sections.push(planSection);

  // Source
  sections.push(
    `## Source / Inspired by\n\n` +
    `- **Source:** ${source.source_name}\n` +
    `- **URL:** ${source.source_url}\n` +
    `- **Note:** This article is an original Offroady summary inspired by publicly available community/event information. We do not reproduce private posts, comments, or images.`
  );

  return sections.join('\n\n');
}

function generateZhBody(source: ExternalContentSource, trailContext?: Record<string, unknown> | null): string {
  const trailName = source.detected_trail_name || '这条路线';
  const region = source.detected_region || 'BC省';
  const activity = source.detected_activity_type || '越野探险';
  const difficulty = source.detected_difficulty || '中级';
  const vehicleReq = source.detected_vehicle_requirement || '高离地间隙四驱车';
  const season = source.detected_season || '春末到秋初';
  const eventDate = source.detected_event_date ? formatDateZh(source.detected_event_date) : '近期';

  const trailSlug = trailContext?.slug;
  const planUrl = trailSlug ? `/plan/${trailSlug}` : null;
  const trailTitle = trailContext?.title || trailName;

  const sections: string[] = [];

  // Title
  sections.push(`# ${generateZhTitle(source, trailName)}`);

  // Opening
  sections.push(
    `${region}的${trailTitle}近期有社区越野活动迹象。` +
    (eventDate !== '近期'
      ? `${eventDate}前后，当地越野爱好者在这条路线上有过探索。`
      : `近期的社区帖子和活动信息显示，这条路线仍然吸引着本地越野爱好者。`) +
    `本文是Offroady基于公开信息的原创整理——我们不复制任何个人帖文、评论或图片。`
  );

  // Why this trail caught our eye
  sections.push(
    `## 为什么值得关注\n\n` +
    `${trailName}在${region}地区提供了不错的${activity}体验。` +
    (trailContext
      ? `这是一条${trailContext.difficulty === 'easy' ? '入门级' : trailContext.difficulty === 'hard' ? '高难度' : '中级'}路线，${trailContext.card_blurb || '提供了很好的越野体验'}。`
      : `这条路线通往风景优美的野外地形，适合越野探索。`) +
    `围绕这条路线的社区活动表明，它经常被使用，值得规划一次出行。`
  );

  // What kind of trip is this
  sections.push(
    `## 适合什么样的出行\n\n` +
    `基于公开社区信息：\n\n` +
    `- **难度：** ${difficulty}\n` +
    (trailContext ? `- **官方难度评级：** ${trailContext.difficulty === 'easy' ? '简单' : trailContext.difficulty === 'hard' ? '困难' : '中等'}\n` : '') +
    `- **车辆要求：** ${vehicleReq}\n` +
    `- **最佳季节：** ${season}\n` +
    `- **活动类型：** ${activity}`
  );

  // Trail and vehicle notes
  sections.push(
    `## 路线和车辆注意事项\n\n` +
    `规划前往${trailName}时，请留意以下要点：\n\n` +
    `- **路况随季节和天气变化**，出发前请确认最新情况。\n` +
    `- **建议使用${vehicleReq}**。如果不确定车辆是否适合，建议组队出行。\n` +
    `- **带好救援装备**——脱困板、救援绳、基本工具都是好主意。\n` +
    `- **季节性通行：** ${season}通常是最佳窗口。注意是否还有积雪或路面被冲毁。\n` +
    (trailContext?.route_condition_note
      ? `- **路线备注：** ${trailContext.route_condition_note}\n`
      : `- **路线备注：** 路况信息基于公开社区报告，出发前请自行核实。\n`)
  );

  // Community activity
  sections.push(
    `## 社区动态\n\n` +
    `近期的社区帖子和活动信息显示，${region}的${trailName}仍然吸引着本地越野爱好者。` +
    (eventDate !== '近期'
      ? `${eventDate}前后有较多社区关注，驾驶者们分享了关于路况和风景的体验。`
      : `这条路线持续有社区关注，不时有${activity}出行活动。`) +
    `与任何越野目的地一样，路况可能快速变化——近期去过的人建议出发前查看本地论坛获取最新报告。`
  );

  // Plan it on Offroady
  const planSection =
    `## 在Offroady上规划你的行程\n\n` +
    (planUrl
      ? `- [查看${trailTitle}路线详情](${planUrl})获取更多信息\n`
      : `- 这条路线尚未收录到Offroady。考虑[推荐此路线](/propose-a-trail)，让社区可以在这里找路线和组队。\n`) +
    `- 和Offroady的越野伙伴们[一起规划行程](/plan)\n` +
    `- 加入一个组队活动或者自己发起一次冒险\n` +
    `- 分享你的已完成行程，帮助社区成长`;

  sections.push(planSection);

  // Source
  sections.push(
    `## 来源/灵感\n\n` +
    `- **来源：** ${source.source_name}\n` +
    `- **链接：** ${source.source_url}\n` +
    `- **声明：** 本文是Offroady基于公开社区/活动信息的原创整理。我们不复制私人帖文、评论或图片。`
  );

  return sections.join('\n\n');
}

// ─── Main Generation Function ─────────────────────────────────

export function generateBlogPair(
  source: ExternalContentSource | DbContentSource
): BlogPair {
  const groupId = generateTranslationGroupId();
  const dbSource = source as DbContentSource;
  const match = localTrails.find((t) => t.id === dbSource.matched_trail_id) ?? null;

  // Couldn't match — use fuzzy/detected name
  const matchedTrailId: string | null = dbSource.matched_trail_id ?? null;
  const matchedTrailSlug: string | null = match?.slug ?? null;
  const trailName: string | null = match?.title ?? source.detected_trail_name ?? null;

  const enSlug = generateEnSlug(source, match?.slug);
  const zhSlug = generateZhSlug(enSlug);

  const enBody = generateEnBody(source, match);
  const zhBody = generateZhBody(source, match);

  const sourceUrl = source.source_url || undefined;
  const sourceNote = `This article is an original Offroady summary inspired by ${source.source_name}.`;

  const english: GeneratedBlog = {
    translationGroupId: groupId,
    language: 'en',
    slug: enSlug,
    title: generateEnTitle(source, trailName),
    excerpt: generateEnExcerpt(source, trailName),
    contentMarkdown: enBody,
    seoTitle: `${trailName || source.detected_trail_name || 'Off-Road Trail'}: Community Activity & Trip Report | Offroady`,
    seoDescription: generateEnExcerpt(source, trailName),
    category: 'Trail Stories',
    coverImageUrl: getDefaultCover(match?.slug),
    sourceUrl,
    sourceNote,
  };

  const chinese: GeneratedBlog = {
    translationGroupId: groupId,
    language: 'zh',
    slug: zhSlug,
    title: generateZhTitle(source, trailName),
    excerpt: generateZhExcerpt(source, trailName),
    contentMarkdown: zhBody,
    seoTitle: `${trailName || source.detected_trail_name || '越野路线'}：社区活动与出行报告 | Offroady`,
    seoDescription: generateZhExcerpt(source, trailName),
    category: 'Trail Stories',
    coverImageUrl: getDefaultCover(match?.slug),
    sourceUrl,
    sourceNote,
  };

  return {
    translationGroupId: groupId,
    english,
    chinese,
    relatedTrailId: matchedTrailId,
    matchedTrailSlug,
    sourceId: dbSource.id ?? '',
  };
}

// ─── DB Save ───────────────────────────────────────────────────

export async function saveBlogPair(
  pair: BlogPair
): Promise<{ enPostId: string; zhPostId: string } | null> {
  const supabase = getServiceSupabase();

  const { data: enData, error: enError } = await supabase
    .from('blog_posts')
    .insert({
      language: 'en',
      translation_group_id: pair.translationGroupId,
      related_trail_id: pair.relatedTrailId,
      related_source_id: pair.sourceId,
      slug: pair.english.slug,
      title: pair.english.title,
      excerpt: pair.english.excerpt,
      content_markdown: pair.english.contentMarkdown,
      category: pair.english.category,
      status: 'draft',
      seo_title: pair.english.seoTitle,
      seo_description: pair.english.seoDescription,
      cover_image_url: pair.english.coverImageUrl,
      source_url: pair.english.sourceUrl,
      source_note: pair.english.sourceNote,
    })
    .select('id')
    .single();

  if (enError) {
    console.error('Failed to save EN blog:', enError);
    return null;
  }

  const { data: zhData, error: zhError } = await supabase
    .from('blog_posts')
    .insert({
      language: 'zh',
      translation_group_id: pair.translationGroupId,
      related_trail_id: pair.relatedTrailId,
      related_source_id: pair.sourceId,
      slug: pair.chinese.slug,
      title: pair.chinese.title,
      excerpt: pair.chinese.excerpt,
      content_markdown: pair.chinese.contentMarkdown,
      category: pair.chinese.category,
      status: 'draft',
      seo_title: pair.chinese.seoTitle,
      seo_description: pair.chinese.seoDescription,
      cover_image_url: pair.chinese.coverImageUrl,
      source_url: pair.chinese.sourceUrl,
      source_note: pair.chinese.sourceNote,
    })
    .select('id')
    .single();

  if (zhError) {
    // Rollback: delete EN post if ZH fails
    await supabase.from('blog_posts').delete().eq('id', enData.id);
    console.error('Failed to save ZH blog:', zhError);
    return null;
  }

  return { enPostId: enData.id, zhPostId: zhData.id };
}

export async function publishBlogPair(
  enPostId: string,
  zhPostId: string,
  publishedAt?: string
): Promise<boolean> {
  const supabase = getServiceSupabase();
  const now = publishedAt || new Date().toISOString();

  const { error: enError } = await supabase
    .from('blog_posts')
    .update({ status: 'published', published_at: now })
    .eq('id', enPostId);

  if (enError) {
    console.error('Failed to publish EN post:', enError);
    return false;
  }

  const { error: zhError } = await supabase
    .from('blog_posts')
    .update({ status: 'published', published_at: now })
    .eq('id', zhPostId);

  if (zhError) {
    // Rollback EN publish
    await supabase
      .from('blog_posts')
      .update({ status: 'draft', published_at: null })
      .eq('id', enPostId);
    console.error('Failed to publish ZH post:', zhError);
    return false;
  }

  return true;
}

export async function updateSourceStatus(
  sourceId: string,
  status: string,
  rejectionReason?: string
): Promise<void> {
  const supabase = getServiceSupabase();
  const updates: Record<string, unknown> = { status };
  if (rejectionReason) updates.rejection_reason = rejectionReason;
  await supabase.from('external_content_sources').update(updates).eq('id', sourceId);
}

// ─── Safety & Quality Checks ──────────────────────────────────

export function validateBlogQuality(pair: BlogPair): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // English check
  if (!pair.english.title || pair.english.title.length < 10)
    issues.push('EN title too short');
  if (!pair.english.contentMarkdown || pair.english.contentMarkdown.length < 200)
    issues.push('EN body too short');
  if (!pair.english.seoTitle || !pair.english.seoDescription)
    issues.push('EN SEO fields missing');

  // Chinese check
  if (!pair.chinese.title || pair.chinese.title.length < 10)
    issues.push('ZH title too short');
  if (!pair.chinese.contentMarkdown || pair.chinese.contentMarkdown.length < 200)
    issues.push('ZH body too short');
  if (!pair.chinese.seoTitle || !pair.chinese.seoDescription)
    issues.push('ZH SEO fields missing');

  // Cross-check: not same content (basic plagiarism guard)
  const enBodyNorm = pair.english.contentMarkdown.replace(/\s+/g, '').slice(0, 200);
  const zhBodyNorm = pair.chinese.contentMarkdown.replace(/\s+/g, '').slice(0, 200);
  if (enBodyNorm === zhBodyNorm) {
    issues.push('EN and ZH bodies appear identical');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

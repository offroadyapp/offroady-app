/**
 * Content Pipeline Orchestrator
 *
 * Coordinates the full external content → blog pipeline:
 * 1. Discover external sources
 * 2. Deduplicate & score
 * 3. Match trails
 * 4. Generate EN + ZH blog pair
 * 5. Safety checks
 * 6. Auto-publish or review
 * 7. Log results
 */

import {
  runAllScrapers,
} from './external-content-scrapers';
import {
  saveExternalSource,
  scoreRelevance,
  scoreCopyrightRisk,
  scorePrivacyRisk,
  checkCanAutoPublish,
  checkDailyPublishLock,
  createDailyPublishLock,
  updateRunLog,
  getRecentShortlistedSources,
  createContentDiscoveryRunLog,
} from './external-content-discovery';
import {
  generateBlogPair,
  saveBlogPair,
  publishBlogPair,
  validateBlogQuality,
  updateSourceStatus,
} from './auto-blog-generator';
import type { ExternalContentSource } from './external-content-discovery';
import type { BlogPair } from './auto-blog-generator';

export interface PipelineResult {
  success: boolean;
  runId?: string;
  sourcesChecked: number;
  sourcesAdded: number;
  sourcesRejected: number;
  draftsCreated: number;
  postsPublished: number;
  postsNeedingReview: number;
  publishedBlogPair?: {
    enSlug: string;
    zhSlug: string;
    trailName: string;
    translationGroupId: string;
  };
  errors: string[];
}

// ─── Main Pipeline ────────────────────────────────────────────

export async function runContentPipeline(): Promise<PipelineResult> {
  const result: PipelineResult = {
    success: true,
    sourcesChecked: 0,
    sourcesAdded: 0,
    sourcesRejected: 0,
    draftsCreated: 0,
    postsPublished: 0,
    postsNeedingReview: 0,
    errors: [],
  };

  let runId: string | undefined;

  try {
    // 1. Create run log
    runId = await createContentDiscoveryRunLog();
    result.runId = runId;

    // 2. Discover external sources
    console.log('[Pipeline] Discovering external sources...');
    const discovered = await runAllScrapers();
    result.sourcesChecked = discovered.length;
    console.log(`[Pipeline] Found ${discovered.length} raw sources`);

    // 3. Score and save each source
    const shortlisted: ExternalContentSource[] = [];

    for (const source of discovered) {
      // Score
      source.relevance_score = scoreRelevance(source);
      source.copyright_risk_score = scoreCopyrightRisk(source);
      source.privacy_risk_score = scorePrivacyRisk(source);

      // Reject if clearly irrelevant
      if (source.relevance_score < 40) {
        result.sourcesRejected++;
        continue;
      }

      // Save to DB
      const savedId = await saveExternalSource(source);
      if (savedId) {
        result.sourcesAdded++;
        (source as Record<string, unknown>).id = savedId;

        // Add to shortlist if high relevance
        if (source.relevance_score >= 70) {
          shortlisted.push(source);
        }
      }
    }

    console.log(`[Pipeline] Added ${result.sourcesAdded} new sources, rejected ${result.sourcesRejected}`);

    // 4. Check if we can auto-publish today
    const { locked } = await checkDailyPublishLock();

    // 5. Get best shortlisted sources (or fallback to DB-stored ones)
    const candidates = shortlisted.length > 0
      ? shortlisted.sort((a, b) => b.relevance_score - a.relevance_score)
      : await getRecentShortlistedSources(72);

    if (candidates.length === 0) {
      console.log('[Pipeline] No candidates for blog generation');
      await updateRunLog(runId, {
        status: 'completed',
        sources_checked: result.sourcesChecked,
        sources_added: result.sourcesAdded,
        sources_rejected: result.sourcesRejected,
        drafts_created: 0,
        posts_published: 0,
        posts_needing_review: 0,
      });
      return result;
    }

    // 6. Generate blog pairs for top candidates
    //    Priority: matched trail with no story > recent activity > nearby trail

    // Score candidate priority
    const scored = await Promise.all(
      candidates.map(async (c) => {
        const cRec = c as Record<string, unknown>;
        const relevanceScore = Number(cRec.relevance_score) || 50;
        const matchedTrailId = cRec.matched_trail_id as string | undefined;
        let priorityScore: number = relevanceScore;

        // Bonus: has matched trail
        if (matchedTrailId) priorityScore += 10;

        // Bonus: matched trail has no existing story
        if (matchedTrailId) {
          const hasStory = await checkTrailHasStory(matchedTrailId);
          if (!hasStory) priorityScore += 15;
        }

        return { source: c, priorityScore };
      })
    );

    scored.sort((a, b) => b.priorityScore - a.priorityScore);

    let publishedCount = 0;
    let draftCount = 0;
    let reviewCount = 0;

    for (const { source } of scored) {
      // Cast to Record for generic field access
      const src = source as Record<string, unknown>;
      const sourceId = src.id as string | undefined;
      const rawTitle = String(src.raw_title || '');
      const detectedTrailName = src.detected_trail_name as string | undefined;

      // 7. Generate blog pair (cast to ExternalContentSource)
      console.log(`[Pipeline] Generating blog pair for: ${rawTitle}`);
      const pair = generateBlogPair(source as import('./auto-blog-generator').DbContentSource);

      // 8. Validate quality
      const quality = validateBlogQuality(pair);
      if (!quality.valid) {
        console.warn(`[Pipeline] Quality check failed: ${quality.issues.join(', ')}`);
        if (sourceId) await updateSourceStatus(sourceId, 'needs_review',
          `Quality issues: ${quality.issues.join('; ')}`);
        reviewCount++;
        continue;
      }

      // 9. Save blog posts as drafts
      const saved = await saveBlogPair(pair);
      if (!saved) {
        console.error(`[Pipeline] Failed to save blog pair for ${rawTitle}`);
        result.errors.push(`Save failed: ${rawTitle}`);
        continue;
      }
      draftCount++;

      // 10. Check auto-publish eligibility
      const safety = checkCanAutoPublish(source as any);
      const canBeBestOfDay = publishedCount === 0 && !locked;

      if (safety.canPublish && canBeBestOfDay) {
        // 11. Lock and publish
        try {
          const pubOk = await publishBlogPair(saved.enPostId, saved.zhPostId);
          if (pubOk) {
            await createDailyPublishLock({
              translationGroupId: pair.translationGroupId,
              englishPostId: saved.enPostId,
              chinesePostId: saved.zhPostId,
              sourceId: sourceId ?? '',
            });
            if (sourceId) await updateSourceStatus(sourceId, 'published');

            publishedCount++;
            result.postsPublished = publishedCount;
            result.publishedBlogPair = {
              enSlug: pair.english.slug,
              zhSlug: pair.chinese.slug,
              trailName: detectedTrailName || rawTitle,
              translationGroupId: pair.translationGroupId,
            };

            console.log(`[Pipeline] Published: ${pair.english.title} / ${pair.chinese.title}`);
          } else {
            // Publish failed, keep as draft
            if (sourceId) await updateSourceStatus(sourceId, 'drafted', 'Publish DB operation failed');
            reviewCount++;
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          console.error(`[Pipeline] Publish error: ${msg}`);
          result.errors.push(`Publish error: ${msg}`);
          if (sourceId) await updateSourceStatus(sourceId, 'needs_review', `Publish error: ${msg}`);
          reviewCount++;
        }
      } else {
        // Source not eligible for auto-publish
        if (!safety.canPublish) {
          if (sourceId) await updateSourceStatus(sourceId, 'drafted',
            `Not eligible for auto-publish: ${safety.reasons.join(', ')}`);
        } else {
          if (sourceId) await updateSourceStatus(sourceId, 'drafted',
            'Daily publish limit reached (1/day)');
        }
        reviewCount++;
      }

      // Only publish 1 group per run
      if (publishedCount > 0) break;
    }

    result.draftsCreated = draftCount;
    result.postsNeedingReview = reviewCount;

    // 12. Finalize run log
    await updateRunLog(runId, {
      status: 'completed',
      sources_checked: result.sourcesChecked,
      sources_added: result.sourcesAdded,
      sources_rejected: result.sourcesRejected,
      drafts_created: result.draftsCreated,
      posts_published: result.postsPublished,
      posts_needing_review: result.postsNeedingReview,
      errors: result.errors.length > 0 ? result.errors : [],
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Pipeline] Fatal error: ${msg}`);
    result.success = false;
    result.errors.push(`Fatal: ${msg}`);

    if (runId) {
      await updateRunLog(runId, {
        status: 'failed',
        errors: [msg],
        finished_at: new Date().toISOString(),
      });
    }
  }

  return result;
}

// ─── Helper: Check if trail has any story ─────────────────────

async function checkTrailHasStory(trailId: string): Promise<boolean> {
  try {
    const { getServiceSupabase } = await import('@/lib/supabase/server');
    const supabase = getServiceSupabase();

    // Check blog_posts
    const { count: blogCount } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('related_trail_id', trailId)
      .eq('status', 'published');

    if ((blogCount ?? 0) > 0) return true;

    // Check user_stories as well (fallback)
    // We can't easily check the file-based trail-stories here,
    // so we check user_stories
    const { count: userStoryCount } = await supabase
      .from('user_stories')
      .select('*', { count: 'exact', head: true })
      .eq('related_trail_slug', trailId)
      .eq('status', 'published');

    return (userStoryCount ?? 0) > 0;
  } catch {
    return false;
  }
}

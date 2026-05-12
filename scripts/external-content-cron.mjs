/**
 * Offroady External Content → Blog Pipeline Cron Script
 *
 * Run daily via cron job.
 * Discovers external sources → generates blog pairs → auto-publishes 1/day.
 *
 * Usage:
 *   node scripts/external-content-cron.mjs
 *
 * Environment:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *   - INTERNAL_ADMIN_EMAILS (optional, for access)
 */

const RUN_MODE = process.env.RUN_MODE || 'pipeline';

async function main() {
  console.log(`[Cron] Starting external content pipeline (mode: ${RUN_MODE})`);
  console.log(`[Cron] Time: ${new Date().toISOString()}`);

  try {
    // We need to run this in the Next.js context to use the lib modules
    // which import from @/lib/supabase/server etc.
    // So we use a child process that calls the API route instead.

    const baseUrl = process.env.OFFROADY_BASE_URL || 'http://localhost:3000';
    const apiSecret = process.env.OFFROADY_INTERNAL_API_SECRET || '';

    const url = `${baseUrl}/api/internal/content-sources/pipeline`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-offroady-internal-secret': apiSecret,
      },
      signal: AbortSignal.timeout(120000), // 2 min timeout
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Pipeline API returned ${response.status}: ${body}`);
    }

    const result = await response.json();

    console.log(`\n=== Pipeline Results ===`);
    console.log(`Status:   ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`Run ID:   ${result.runId || 'N/A'}`);
    console.log(`Checked:  ${result.sourcesChecked} sources`);
    console.log(`Added:    ${result.sourcesAdded} new`);
    console.log(`Rejected: ${result.sourcesRejected}`);
    console.log(`Drafts:   ${result.draftsCreated}`);
    console.log(`Published: ${result.postsPublished}`);
    console.log(`Review:   ${result.postsNeedingReview}`);

    if (result.publishedBlogPair) {
      console.log(`\n📝 Published today:`);
      console.log(`   EN: ${result.publishedBlogPair.enSlug}`);
      console.log(`   ZH: ${result.publishedBlogPair.zhSlug}`);
      console.log(`   Trail: ${result.publishedBlogPair.trailName}`);
    }

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors:`);
      for (const err of result.errors) {
        console.log(`   - ${err}`);
      }
    }

    if (!result.success) {
      process.exit(1);
    }

  } catch (err) {
    console.error(`[Cron] Pipeline failed:`, err);
    process.exit(1);
  }
}

main();

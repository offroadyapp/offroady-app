# Offroady Blog — Daily Content Workflow

## Purpose

This document defines the workflow for creating, reviewing, and publishing Offroady blog posts. The goal is to produce SEO-friendly, original, useful content for the BC off-road community — not to automate low-quality publishing.

## Content Principles

- Every post must be **original**. Do not copy or rewrite content from other sites.
- Every post must be **useful** to someone in BC / Vancouver / Lower Mainland who goes off-roading or wants to start.
- Every post should read like it was written by a real person in the community, not an AI generating filler.
- No dangerous driving advice. No false trail information. No copyright infringement.
- Do not promise Google rankings. The goal is SEO-friendly, increasing the chance of indexing and natural traffic over time.

## Post Structure

Each post must include:

| Field | Required | Description |
|-------|----------|-------------|
| `slug` | Yes | Short English slug (kebab-case) |
| `title` | Yes | Catchy title, can be Chinese or English |
| `excerpt` | Yes | 1-2 sentence summary shown on /blog |
| `category` | Yes | One of the approved categories |
| `tags` | Yes | 3-6 relevant tags |
| `publishedAt` | Yes* | ISO date string. `null` if draft |
| `author` | Yes | "Offroady Team" or named author |
| `coverImage` | No | Path to hero image |
| `coverAlt` | No | Alt text for cover image |
| `seoTitle` | Yes | Unique <title> for this page |
| `seoDescription` | Yes | Unique <meta description> |
| `keywords` | Yes | 3-6 target keywords |
| `relatedTrailSlug` | No | Related trail on Offroady |
| `readingTime` | Yes | e.g. "5 min read" |
| `status` | Yes | `"draft"` or `"published"` |
| `body` | Yes | Markdown-formatted post body |

\* `publishedAt` must be `null` for drafts. Only set a date when status changes to `published`.

## Approved Categories

1. Off-Roading Basics
2. BC Trail Guides
3. Trip Stories
4. Vehicle & Gear
5. Safety & Recovery
6. Family Off-Roading
7. Seasonal Trail Tips
8. Community Events

## How to Create a Daily Post

### Step 1: Pick a topic

Use the seed topic list in this repo. Each day should cover a different angle. Do not repeat the same topic twice in a row.

### Step 2: Determine main keyword

Choose one primary keyword and 3-6 secondary keywords. Example:

- **Main**: "first time offroading BC"
- **Secondary**: "BC forest service road beginner", "offroad gear checklist", "FSR safety tips"

### Step 3: Write the post

Add a new object to `content/blog/posts.ts`. Write the body in Markdown format.

Internal links to include where natural:
- `/trail-of-the-week` — featured trail
- `/join-a-trip` — browse or join upcoming trips
- `/[trail-slug]` — specific trail detail page
- `/#more-trails` — browse all trails
- `/blog` — blog index

### Step 4: Set status to `"draft"`

Every new post starts as `draft`. Set `publishedAt` to `null`.

### Step 5: Review checklist

Before changing status to `published`, confirm:

- [ ] Content is original
- [ ] Content is relevant to BC / Vancouver off-road audience
- [ ] Content provides actual value to readers
- [ ] No obvious AI filler or empty paragraphs
- [ ] No dangerous driving advice
- [ ] No false trail or location information
- [ ] No copyright issues (images, text)
- [ ] SEO title reads naturally
- [ ] SEO description is accurate
- [ ] Internal links are correct
- [ ] CTA at end is natural (not forced)
- [ ] Article reads like a real community member wrote it

### Step 6: Publish

Once reviewed and approved:

1. Change `status` to `"published"`
2. Set `publishedAt` to current ISO timestamp
3. Run `npm run build` and confirm no errors
4. Commit and push

The post will now appear on `/blog`, enter the sitemap, and be crawlable by search engines.

### Step 7: Verify

- Check `/blog` shows the new post
- Check the post detail page loads at `/blog/[slug]`
- Confirm the sitemap at `/sitemap.xml` includes the new URL

## Draft vs Published Behavior

| Behavior | Draft | Published |
|----------|-------|-----------|
| Appears on /blog | No | Yes |
| Detail page accessible | No (404) | Yes |
| In sitemap | No | Yes |
| Crawlable by Google | No | Yes |

## Seed Topic List (30+ topics)

1. First Time Off-Roading in BC: What Beginners Should Know
2. What Does High Clearance Mean on BC Trails?
3. 4x4 vs AWD: What Matters for Forest Service Roads?
4. Essential Recovery Gear for Beginner Off-Roaders
5. Why You Should Never Go Off-Roading Alone
6. How to Read Trail Difficulty Before You Go
7. Best Practices for Driving Forest Service Roads in BC
8. How to Plan a Safe Weekend Trail Trip Near Vancouver
9. What to Pack for a Day on a BC Backroad
10. How Offroady Helps You Find Trails and People to Go With
11. Beginner-Friendly Off-Road Trails Near Vancouver
12. What Is an FSR in British Columbia?
13. How Weather Changes Trail Conditions in BC
14. Off-Roading Etiquette: Sharing Trails Respectfully
15. How to Invite Friends to an Offroady Trip
16. Why Trip Planning Matters Before Going Off-Road
17. Family-Friendly Off-Roading Tips in BC
18. How to Choose a Trail for Your Vehicle
19. What Makes a Trail Suitable for High-Clearance Vehicles?
20. How to Avoid Getting Stuck on a Trail
21. Tire Pressure Basics for Off-Road Driving
22. What New Jeep Owners Should Know Before Their First Trail
23. How to Prepare for a Winter Off-Road Trip in BC
24. Spring Trail Conditions in British Columbia
25. Summer Off-Roading Safety Tips
26. Fall Backroad Trips Near Vancouver
27. How to Use Offroady to Plan a Group Trip
28. Why Local Off-Road Communities Matter
29. How to Turn a Trail Drive Into a Safe Group Adventure
30. The Beginner's Guide to Responsible Off-Roading in BC

## Future Automation Ideas

Do not implement without explicit approval:

- Script to scaffold a new draft post with template
- GitHub Action for daily draft creation
- Admin page for editing posts
- CMS integration with review/publish workflow

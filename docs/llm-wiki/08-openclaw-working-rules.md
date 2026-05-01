# OpenClaw Working Rules

This document describes the rules and conventions AI coding agents should follow when working on the Offroady project.

## 1. Always Inspect Current Code Before Modifying

**Read the relevant source files before making changes.** Never assume you know the current state of the code. Check:
- `CLAUDE.md` in the project root for project-specific working rules
- The relevant `lib/offroady/*.ts` file
- The relevant route handler or page component
- The database schema (`supabase/schema.sql`)
- The LLM Wiki (`docs/llm-wiki/`) for project understanding

## 2. Keep UI Consistent With Existing Design

- Use the same Tailwind patterns as existing components
- Dark theme, off-black backgrounds, white text
- Follow existing component patterns (card layout, button styles, spacing)
- Maintain mobile-first responsive design
- Do not introduce new UI libraries or icon sets
- Use inline SVG or emoji for icons (as existing code does)

## 3. Run Build / Lint After Changes

Before claiming completion, always run:

```bash
npm run lint   # ESLint
npm run build  # Next.js production build
```

Fix errors. Note warnings honestly if they remain.

**A feature is not complete just because the code looks plausible.** It must compile and build cleanly.

## 4. Do Not Change Settled Product Decisions Unless Explicitly Asked

These are settled decisions:
- **Auth:** Email/password only. Social OAuth was removed — do not re-add
- **Supabase pattern:** All writes go through server routes with service role key. No client-side `.from().insert()`
- **Default featured trail:** `mount-cheam-fsr-access` — do not change without explicit request
- **Trail data source:** `trails/trails.json` is the primary source, not the DB
- **UI design:** Dark theme, hand-rolled components, Tailwind CSS v4

If you disagree with a decision, note it in a comment or issue. Do not unilaterally change it.

## 5. Update This Wiki After Each Meaningful Change

After completing a meaningful change (adding a feature, changing behavior, modifying the database schema):

1. Update the relevant `docs/llm-wiki/*.md` file(s)
2. Cover what changed and why
3. If something is marked "Needs verification" and you've verified it, remove the marker and document the finding

This keeps the wiki accurate for future agents.

## 6. Karpathy-Style Guardrails

- **Minimal diff beats sprawling rewrites.** Prefer the smallest change that correctly solves the problem.
- **Today's working solution beats speculative architecture.**
- **Touch only what the task requires.** Do not refactor unrelated areas.
- **Keep commits focused and reversible.**
- **If a change is risky, validate before expanding scope.**
- **Fix root causes, not just symptoms.**
- **Do not claim progress unless code actually landed in the repo.**

## 7. Search & Edit Discipline

When inspecting the repo, avoid wasting time in generated or vendor content unless explicitly needed:
- `.next/`
- `node_modules/`

## 8. Worktree Protection

Unless explicitly asked, preserve existing in-progress changes in these files:
- `app/page.tsx`
- `app/plan/[slug]/page.tsx`
- `app/components/CopyCoordinatesButton.tsx`

Do not casually overwrite or absorb unrelated work into a feature commit.

## 9. State Assumptions Explicitly

If something is ambiguous, do not silently guess. Say "This is how I interpret X, please confirm" or mark it as "Needs verification."

## 10. Schema Changes

Schema patches should be:
- Retry-safe: `create table if not exists`, `alter table ... add column if not exists`, `create index if not exists`
- Idempotent where possible
- Documented in a migration SQL file in `supabase/`

## 11. Progress Reporting

- Report code that landed, not intentions
- Distinguish clearly between committed work, uncommitted work, and planned work
- If something slipped, say so directly
- When blocked, name the blocker and the next recovery step

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Writing Style & Constraints

- **No Em-Dashes:** Do not use the em-dash character (—) or the associated HTML entity in any text, documentation, or content. Use standard hyphens (-) or colons (:) for breaks in thought.
- **Tone:** Technical yet personal, matching the "mostlychai" editorial style.

## Commands

```bash
npm run dev      # start local dev server at localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

No test suite exists.

## Architecture

**mostlychai** is a Next.js 16 (App Router) personal blog deployed on Vercel.

### Content system

Posts are markdown files in `content/posts/`. Two slug patterns are supported:

- `content/posts/my-post.md` → `/posts/my-post`
- `content/posts/my-series/index.md` → `/posts/my-series`

Frontmatter fields: `title`, `date` (YYYY-MM-DD), `description`, `tags` (array). Everything is parsed in `src/lib/posts.ts` using `gray-matter` + `remark`. Reading time is estimated at 200 wpm. Posts are sorted by `date` descending.

### Reactions

Each post has a ❤️ / 👍 / 👎 reaction bar. The reaction key is the slug joined with `/` (e.g. `"groceryfarm"`).

- **Production**: stored in Upstash Redis as a hash at `reactions:{slug}`, requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars
- **Local dev**: falls back to an in-memory `Map` (not persisted across requests)
- User's own reaction is persisted in `localStorage` under `reaction:{slug}`
- `ReactionBar` uses optimistic UI — updates immediately, syncs to `/api/reactions` in the background

### Design tokens

The palette is defined in `tailwind.config.ts` using OKLCH:

| Token | Usage |
|---|---|
| `cream-{50,100,200,300}` | Backgrounds, borders, surfaces |
| `ink` / `ink-soft` / `ink-faint` | Text hierarchy |
| `spice` / `spice-light` / `spice-muted` | Accent — hover states, active reactions, labels |

Fonts: `--font-display` (Instrument Serif, italic editorial) and `--font-sans` (DM Sans). Use `font-display` for titles and article body, `font-sans` for UI chrome (nav, metadata, tags, labels).

### New feature workflow

All new features go on a new branch → push → open PR → merge to main. Vercel deploys main automatically.

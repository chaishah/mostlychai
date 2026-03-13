# mostlychai

Chai's personal blog.

## Publishing setup

The app can read published posts from Supabase and expose a private `/publish` page for pasted markdown or `.md` uploads.

1. Create the `posts` table with [supabase/posts.sql](./supabase/posts.sql)
2. Add these env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PUBLISH_SECRET=
```

3. Open `/publish`
4. Paste markdown with frontmatter or upload a `.md` file

Expected frontmatter:

```md
---
title: "Post title"
date: "2026-03-13"
description: "Short summary"
tags: ["notes", "personal"]
slug: "optional/custom-slug"
---
```

If Supabase env vars are missing, the app falls back to local files in `content/posts/`.

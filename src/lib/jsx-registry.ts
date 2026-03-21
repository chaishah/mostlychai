import type { ComponentType } from "react";

// Registry of JSX post slugs to their component loaders.
// Each entry uses a static import so webpack/Next.js can bundle the component.
// This file is updated automatically when you upload a .jsx post via /publish.
// For production deploys, commit both the post file and this registry.

type Loader = () => Promise<{ default: ComponentType }>;

const registry: Record<string, Loader> = {
  // "my-post-slug": () => import("@/posts/my-post-slug"),
  "example-counter": () => import("@/posts/example-counter"),
};

export default registry;

import registry from "@/lib/jsx-registry";

interface Props {
  slug: string;
}

export default async function JsxPostRenderer({ slug }: Props) {
  const loader = registry[slug];

  if (!loader) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-sans text-red-500">
        JSX post <code className="text-xs">{slug}</code> is not in the registry.
        Add an entry to <code className="text-xs">src/lib/jsx-registry.ts</code>{" "}
        and redeploy.
      </div>
    );
  }

  const { default: PostComponent } = await loader();

  return <PostComponent />;
}

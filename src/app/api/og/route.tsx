import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "mostlychai";
  const description = searchParams.get("description") ?? "";
  const tagsParam = searchParams.get("tags") ?? "";
  const date = searchParams.get("date") ?? "";
  const tags = tagsParam ? tagsParam.split(",").slice(0, 3) : [];

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0e1117",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          fontFamily: "serif",
        }}
      >
        {/* Tags */}
        <div style={{ display: "flex", gap: "10px" }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: "rgba(107, 124, 255, 0.15)",
                color: "#8b9dff",
                padding: "4px 14px",
                borderRadius: "999px",
                fontSize: 14,
                fontFamily: "sans-serif",
                letterSpacing: "0.08em",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title + description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              fontSize: title.length > 55 ? 42 : 54,
              fontWeight: 400,
              color: "#eef0f8",
              lineHeight: 1.2,
              fontFamily: "serif",
            }}
          >
            {title}
          </div>
          {description && (
            <div
              style={{
                fontSize: 22,
                color: "#7a82a8",
                lineHeight: 1.5,
                fontFamily: "sans-serif",
                maxWidth: "800px",
              }}
            >
              {description}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              fontSize: 20,
              color: "#eef0f8",
              fontStyle: "italic",
              fontFamily: "serif",
            }}
          >
            mostlychai
          </div>
          {date && (
            <div
              style={{
                fontSize: 14,
                color: "#4a5070",
                fontFamily: "sans-serif",
              }}
            >
              {date}
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

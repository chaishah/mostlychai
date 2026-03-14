import { ImageResponse } from "next/og";

export const alt = "mostlychai";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0e1117",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "64px 72px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 400,
            color: "#eef0f8",
            fontStyle: "italic",
            lineHeight: 1.1,
            marginBottom: "24px",
          }}
        >
          mostlychai
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#7a82a8",
            fontFamily: "sans-serif",
            lineHeight: 1.5,
          }}
        >
          Side projects, ideas, and whatever's been on my mind.
        </div>
      </div>
    ),
    { ...size }
  );
}

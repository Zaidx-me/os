import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const alt = "ZaidOS — Muhammad Zaid";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background: "#0a0c10",
          color: "#e6e9ef",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            border: "1px solid #2a2f3d",
            borderRadius: 16,
            padding: 40,
            background: "rgba(18, 20, 28, 0.92)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              color: "#8b93a7",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#f59e0b",
              }}
            />
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#39FF14",
              }}
            />
            <span style={{ marginLeft: 8 }}>zaid@zaidos — zsh</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 28, color: "#39FF14" }}>
              $ whoami
            </p>
            <p style={{ margin: 0, fontSize: 36, fontWeight: 700 }}>zaid</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p
              style={{
                margin: 0,
                fontSize: 52,
                fontWeight: 700,
                letterSpacing: -1,
              }}
            >
              {site.name}
            </p>
            <p style={{ margin: 0, fontSize: 28, color: "#8b93a7" }}>
              {site.owner}
            </p>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

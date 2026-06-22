import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#15100a",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "40px",
        }}
      >
        <div
          style={{
            color: "#d99a2b",
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            fontFamily: "serif",
          }}
        >
          ČK
        </div>
      </div>
    ),
    { ...size }
  );
}

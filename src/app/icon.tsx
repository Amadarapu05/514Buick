import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#08080b",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
        }}
      >
        <span
          style={{
            color: "#c9a227",
            fontSize: "11px",
            fontWeight: "900",
            letterSpacing: "-0.5px",
            fontFamily: "sans-serif",
          }}
        >
          514
        </span>
      </div>
    ),
    { ...size }
  );
}

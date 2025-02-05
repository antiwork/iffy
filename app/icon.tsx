import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "black",
          background: "transparent",
          fontFamily: "IBMPlexMono-Medium, monospace",
          letterSpacing: "-0.15em",
        }}
      >
        :/
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "IBMPlexMono-Medium",
          data: await fetch(new URL("../public/fonts/IBMPlexMono-Medium.ttf", import.meta.url)).then((res) =>
            res.arrayBuffer(),
          ),
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}

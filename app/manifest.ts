import type { MetadataRoute } from "next";

/** Makes the app installable ("홈 화면에 추가" / "앱 설치"). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "음성배달앱",
    short_name: "음성배달",
    description: "음성으로 배달을 기록하는 앱",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1b3358",
    theme_color: "#1b3358",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

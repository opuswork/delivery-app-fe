import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";

import { ServiceWorkerRegistrar } from "@/components/layout/ServiceWorkerRegistrar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "음성배달앱",
  description: "음성으로 배달을 기록하는 앱",
  applicationName: "음성배달앱",
  // iOS "홈 화면에 추가": open full screen with the app's name.
  appleWebApp: { capable: true, title: "음성배달앱", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b3358",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster position="top-center" richColors />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

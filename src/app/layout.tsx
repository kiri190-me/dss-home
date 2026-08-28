import type { Metadata, Viewport } from "next";
import "./globals.css";
import { COMPANY } from "@/lib/site";

export const metadata: Metadata = {
  title: `${COMPANY.short} | RF/DC Power supply · Cryogenic · Vacuum`,
  description:
    "(주)디에스에스는 RF/DC 전원 공급 장치, 극저온 장비, 진공 장비를 공급합니다. 다양한 노하우를 통하여 최고의 제품과 최상의 서비스를 지원합니다.",
  // 회사 이름으로 검색했을 때 이 사이트가 잡혀야 한다.
  keywords: [
    "디에스에스",
    "DSS",
    "RF Power supply",
    "DC Power supply",
    "Cryogenic",
    "Vacuum",
    "군포",
  ],
};

/**
 * next/font/google을 쓰지 않는 것은 dss-auth와 같은 판단이다 — 빌드 때
 * 네트워크를 타는 의존성이 생겨 NAS 배포에 불리하고, 한글에는 어차피
 * 적용되지 않는다. 시스템 폰트 스택이 한글 렌더링도 가장 깔끔하다.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a1a3f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="antialiased">
      <body>{children}</body>
    </html>
  );
}

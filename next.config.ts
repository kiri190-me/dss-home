import type { NextConfig } from "next";

/**
 * 보안 헤더.
 *
 * dss-auth와 같은 이유로 프록시가 아니라 여기 둔다 — 프록시 설정은 저장소
 * 밖에 있어 배포할 때마다 다시 맞춰야 하고, 개발 서버에는 아예 없어서
 * 개발 중에 확인할 수 없다. 프록시에서 한 번 더 붙어도 해롭지 않다.
 *
 * 다만 dss-auth의 목록을 그대로 베끼지 않았다. 이쪽은 누구나 보는 공개
 * 홈페이지이고 자격증명을 다루지 않으므로, 필요한 것만 남긴다.
 */
const SECURITY_HEADERS = [
  // 이 사이트가 남의 페이지 안에 실려 클릭을 가로채이는 것을 막는다.
  // 여기에는 '사내 시스템' 버튼이 있어, 남의 틀 안에 실리면 그 버튼을
  // 가짜 로그인 화면으로 유도하는 발판이 된다.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // dss-auth는 same-origin이지만 여기는 공개 사이트의 통상값을 쓴다.
  // 나가는 주소에 감출 것이 없고, 같은 출처끼리는 경로가 보이는 편이
  // 유입 경로 파악에 쓰인다.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  // NAS Docker 이미지를 위한 설정. 실행에 필요한 파일만 추려 이미지가
  // 작아진다. dss-auth와 같은 이유로 지금 넣어 둔다.
  output: "standalone",
};

export default nextConfig;

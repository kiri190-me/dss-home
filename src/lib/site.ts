/**
 * 회사 정보와 메뉴 — 화면이 아니라 여기 한 곳에 둔다.
 *
 * 값은 전부 기존 dss21.com에서 그대로 가져왔다. 전화번호나 주소가 바뀌면
 * 이 파일만 고치면 되고, 머리말·꼬리말·본문에 흩어진 같은 값을 찾아다니지
 * 않아도 된다. 회사 정보는 여러 곳에 되풀이해 적히는 종류의 값이라,
 * 한 곳에서만 고칠 수 있게 해 두지 않으면 반드시 어긋난다.
 */

export const COMPANY = {
  nameKo: "(주)디에스에스",
  nameEn: "DSS Co., Ltd.",
  short: "(주)DSS",
  ceo: "허석우",
  businessNumber: "124-86-43615",
  tel: "+82-31-273-7541",
  fax: "+82-31-273-7567",
  email: "dss21@dss21.com",
  address: "경기도 군포시 당정로 76번길 17, 에이동 2층(당정동)",
  hours: "평일 오전 9시 – 오후 6시",
  since: 2017,
} as const;

/**
 * 사내 시스템(통합 로그인 포털) 주소.
 *
 * 환경변수로 둔 이유: 이 주소는 배포 위치에 따라 바뀐다. 지금은 개발 PC의
 * 3100이지만, NAS로 옮기면 리버스 프록시 뒤의 다른 주소가 된다. 코드에
 * 박아 두면 그때 이 파일을 찾아 고쳐야 한다.
 *
 * NEXT_PUBLIC_ 접두사를 쓰지 않는다 — 이 값은 서버에서 링크를 만들 때만
 * 쓰이므로 브라우저 번들에 넣을 이유가 없고, 접두사가 없으면 이미지를 다시
 * 빌드하지 않고 환경변수만 바꿔도 반영된다.
 */
export function portalUrl(): string {
  return process.env.PORTAL_URL ?? "http://localhost:3100";
}

/**
 * 사내(A/S 시스템)에서 오는 요청임을 증명하는 공유 비밀.
 *
 * 이 값 하나로 새 수리 의뢰를 읽고 고객사 링크를 심을 수 있다. 다만 **이
 * 키로 사내망에 닿을 수는 없다** — 연결은 언제나 사내가 먼저 걸고, 여기서
 * 사내로 가는 길은 없다.
 *
 * dss-auth의 OIDC를 거치지 않는다. 그쪽은 사람이 브라우저로 사내 시스템에
 * 들어가는 통로이고, 이건 서버 둘이 주고받는 다른 종류의 신뢰다. 방식
 * (해시 저장·시간차 없는 비교)은 본뜨되 시스템을 끌어오지는 않는다.
 *
 * 없으면 조용히 열어두지 않고 멈춘다 — 인증이 빠졌는데 그럭저럭 도는 상태가
 * 가장 위험하다(dss-auth `config/env.ts`와 같은 판단).
 */
export function nasSyncSecret(): string {
  const value = process.env.NAS_SYNC_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "NAS_SYNC_SECRET이 없거나 너무 짧습니다(32자 이상). .env.local을 확인하세요."
    );
  }
  return value;
}

/**
 * 우리 앞에 있는 **신뢰하는** 리버스 프록시 수. 기본 0.
 *
 * 속도 제한이 손님을 구분하는 근거다. 자세한 판단은 lib/http/client-key.ts에
 * 있다 — 요약하면 x-forwarded-for의 앞자리는 클라이언트가 쓴 값이라 위조
 * 가능하고 프록시가 덧붙인 뒷자리만 믿을 수 있다.
 *
 * ⚠️ 이 사이트는 **외부 호스팅에 올라가고 대부분의 호스팅은 프록시 뒤**라,
 * 배포할 때 1로 바꿔야 할 가능성이 높다. 0으로 두면 뚫리지는 않고 대신
 * 모두가 한 통을 쓴다 — 틀렸을 때 안전한 쪽으로 기울인 기본값이다.
 */
export function trustedProxyHops(): number {
  const raw = process.env.TRUSTED_PROXY_HOPS;
  if (raw === undefined || raw === "") return 0;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(
      `TRUSTED_PROXY_HOPS는 0 이상의 정수여야 합니다(받은 값: ${raw}).`
    );
  }
  return parsed;
}

/**
 * 대메뉴. 기존 사이트의 6개 대분류와 그 하위 항목을 그대로 옮겼다.
 *
 * href가 전부 "#"인 이유: 이번 작업의 범위는 메인 한 장이고 하위 페이지는
 * 아직 없다. 메뉴를 지우지 않고 남겨 둔 것은, 이 사이트가 무엇을 담게 될지
 * 보여주는 것이 지금 단계에서 더 쓸모 있기 때문이다. 페이지를 만들 때
 * 여기 href만 채우면 된다.
 */
export const NAV = [
  {
    label: "회사소개",
    items: [
      "대표이사 인사말",
      "비젼 및 경영이념",
      "회사연혁",
      "CI 소개",
      "조직도",
      "오시는길",
      "PARTNERS",
    ],
  },
  {
    label: "제품소개",
    items: ["RF/DC Power supply", "Cryogenic products", "Vacuum products"],
  },
  { label: "온라인문의", items: ["온라인문의"] },
  { label: "투자정보", items: ["투자정보"] },
  { label: "인재채용", items: ["인재상", "채용공고", "FAQ"] },
  { label: "고객센터", items: ["공지사항", "자료실"] },
] as const;

/** 메인의 바로가기 넉 장. 문구는 기존 사이트 그대로다. */
export const SHORTCUTS = [
  {
    title: "회사소개",
    subtitle: "COMPANY INTRODUCTION",
    lines: ["다양한 노하우를 통하여", "최고의 제품과 최상의", "서비스를 지원합니다."],
  },
  {
    title: "온라인문의",
    subtitle: "ONLINE INQUIRY",
    lines: ["문의사항이 있으시면", "언제든지 문의 주세요!", "친절히 상담해드립니다."],
  },
  {
    title: "투자정보",
    subtitle: "INVESTMENT INFORMATION",
    lines: ["(주)디에스에스의 투자", "정보를 제공드립니다.", "많은 관심 부탁드립니다."],
  },
  {
    title: "자료실",
    subtitle: "DATA ROOM",
    lines: ["미래를 생각하는 기업", "(주)디에스에스의 제품", "자료를 소개합니다."],
  },
] as const;

/**
 * 제품 세 종류. 이름은 기존 사이트의 표기를 그대로 쓴다.
 *
 * 설명은 원본에 본문이 없어(게시판이 비어 있다) 제품군 이름에서 벗어나지
 * 않는 선까지만 적었다. 실제 사양과 용도는 담당자가 채워야 한다.
 */
export const PRODUCTS = [
  {
    name: "RF/DC Power supply",
    ko: "RF · DC 전원 공급 장치",
    desc: "반도체·디스플레이 공정 장비에 쓰이는 고주파 및 직류 전원 공급 장치입니다.",
  },
  {
    name: "Cryogenic products",
    ko: "극저온 장비",
    desc: "극저온 환경을 만들고 유지하는 장비와 그 주변 부품을 다룹니다.",
  },
  {
    name: "Vacuum products",
    ko: "진공 장비",
    desc: "진공 환경 조성에 필요한 펌프와 계측·배관 부품을 공급합니다.",
  },
] as const;

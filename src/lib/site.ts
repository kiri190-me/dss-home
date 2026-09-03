import {
  isAutoValue,
  primaryLanAddress,
  resolveAutoUrl,
} from "./lan-address";

/** 포털(dss-auth)의 포트. */
const PORTAL_PORT = 3100;

/**
 * 회사 정보와 메뉴 — 화면이 아니라 여기 한 곳에 둔다.
 *
 * 값은 전부 기존 dss21.com에서 그대로 가져왔다. 전화번호나 주소가 바뀌면
 * 이 파일만 고치면 되고, 머리말·꼬리말·본문에 흩어진 같은 값을 찾아다니지
 * 않아도 된다. 회사 정보는 여러 곳에 되풀이해 적히는 종류의 값이라,
 * 한 곳에서만 고칠 수 있게 해 두지 않으면 반드시 어긋난다.
 */

/**
 * ⚠️ 이 파일은 lan-address 를 통해 node:os 를 끌어온다. 따라서 지금은
 * **서버에서만** 불러올 수 있다(현재 쓰는 곳은 전부 서버 컴포넌트다).
 * 클라이언트 컴포넌트에서 COMPANY 를 쓰고 싶어지면, 그 상수만 별도
 * 파일로 옮겨라 — 여기서 바로 가져가면 node:os 를 못 찾는다는 빌드 오류가
 * 난다. 원인이 회사 정보와 아무 상관이 없어 헤매기 쉽다.
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
  const configured = process.env.PORTAL_URL ?? "http://localhost:3100";
  // auto 면 이 기계의 사내망 주소로 푼다. 개발 PC 는 Wi-Fi 를 옮길 때마다
  // 주소가 바뀌는데, 그때마다 여기를 고치게 두면 언젠가 빠뜨린다.
  return isAutoValue(configured)
    ? resolveAutoUrl(configured, PORTAL_PORT, primaryLanAddress())
    : configured;
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
 * ■ 대분류에도 주소를 준다
 *
 * 예전에는 href가 전부 "#"이었다. 그래서 대메뉴를 눌러도 아무 데도 가지
 * 않았고, 대신 눌린 링크에 **포커스가 남았다**. 머리말은 focus-within으로도
 * 하위 메뉴를 여니까, 그 메뉴는 마우스를 치워도 열린 채로 붙어 있었고 옆
 * 메뉴에 마우스를 올리면 둘이 겹쳐 보였다. 갈 곳을 주는 것이 그 증상의
 * 근본 처방이다 — 누르면 화면이 바뀌니 붙어 있을 메뉴 자체가 없다.
 *
 * ■ slug가 없는 하위 항목
 *
 * 온라인문의·투자정보처럼 하위 항목이 대분류와 같은 이름 하나뿐인 곳이
 * 있다. 여기에 굳이 /inquiry 와 /inquiry/inquiry 를 둘 다 만들면 같은
 * 내용의 페이지가 둘이 된다. slug를 비워 두면 그 항목은 대분류 페이지
 * 자신을 가리킨다.
 */
export type NavItem = {
  readonly label: string;
  /** 없으면 대분류 페이지 자신을 가리킨다. */
  readonly slug?: string;
};

export type NavGroup = {
  readonly label: string;
  /** 페이지 머리의 영문 표기. 기존 사이트의 소제목을 그대로 쓴다. */
  readonly en: string;
  readonly slug: string;
  readonly items: readonly NavItem[];
};

export const NAV: readonly NavGroup[] = [
  {
    label: "회사소개",
    en: "COMPANY INTRODUCTION",
    slug: "company",
    items: [
      { label: "대표이사 인사말", slug: "greeting" },
      { label: "비젼 및 경영이념", slug: "vision" },
      { label: "회사연혁", slug: "history" },
      { label: "CI 소개", slug: "ci" },
      { label: "조직도", slug: "organization" },
      { label: "오시는길", slug: "directions" },
      { label: "PARTNERS", slug: "partners" },
    ],
  },
  {
    label: "제품소개",
    en: "PRODUCTS",
    slug: "products",
    items: [
      { label: "RF/DC Power supply", slug: "rf-dc-power-supply" },
      { label: "Cryogenic products", slug: "cryogenic" },
      { label: "Vacuum products", slug: "vacuum" },
    ],
  },
  {
    label: "온라인문의",
    en: "ONLINE INQUIRY",
    slug: "inquiry",
    items: [{ label: "온라인문의" }],
  },
  {
    label: "투자정보",
    en: "INVESTMENT INFORMATION",
    slug: "investment",
    items: [{ label: "투자정보" }],
  },
  {
    label: "인재채용",
    en: "RECRUIT",
    slug: "recruit",
    items: [
      { label: "인재상", slug: "ideal" },
      { label: "채용공고", slug: "jobs" },
      { label: "FAQ", slug: "faq" },
    ],
  },
  {
    label: "고객센터",
    en: "CUSTOMER CENTER",
    slug: "support",
    items: [
      { label: "공지사항", slug: "notice" },
      { label: "자료실", slug: "archive" },
    ],
  },
];

/** 대분류 페이지 주소. */
export function groupHref(group: NavGroup): string {
  return `/${group.slug}`;
}

/** 하위 항목 주소. slug가 없는 항목은 대분류 페이지를 가리킨다. */
export function itemHref(group: NavGroup, item: NavItem): string {
  return item.slug ? `/${group.slug}/${item.slug}` : `/${group.slug}`;
}

/** 주소의 첫 칸으로 대분류를 찾는다. 없으면 undefined — 라우트가 404로 넘긴다. */
export function findGroup(slug: string): NavGroup | undefined {
  return NAV.find((group) => group.slug === slug);
}

/** 대분류 안에서 하위 항목을 찾는다. slug 없는 항목은 주소가 없으니 제외된다. */
export function findItem(group: NavGroup, slug: string): NavItem | undefined {
  return group.items.find((item) => item.slug === slug);
}

/**
 * 메인의 바로가기 넉 장. 문구는 기존 사이트 그대로다.
 *
 * href는 NAV가 만든 실제 주소를 가리킨다 — 넉 장 모두 대메뉴에 있는 곳이라,
 * 카드만 "#"으로 남겨 두면 같은 자리로 가는 두 길 중 하나만 막힌 꼴이 된다.
 */
export const SHORTCUTS = [
  {
    title: "회사소개",
    href: "/company",
    subtitle: "COMPANY INTRODUCTION",
    lines: ["다양한 노하우를 통하여", "최고의 제품과 최상의", "서비스를 지원합니다."],
  },
  {
    title: "온라인문의",
    href: "/inquiry",
    subtitle: "ONLINE INQUIRY",
    lines: ["문의사항이 있으시면", "언제든지 문의 주세요!", "친절히 상담해드립니다."],
  },
  {
    title: "투자정보",
    href: "/investment",
    subtitle: "INVESTMENT INFORMATION",
    lines: ["(주)디에스에스의 투자", "정보를 제공드립니다.", "많은 관심 부탁드립니다."],
  },
  {
    title: "자료실",
    href: "/support/archive",
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
    href: "/products/rf-dc-power-supply",
    ko: "RF · DC 전원 공급 장치",
    desc: "반도체·디스플레이 공정 장비에 쓰이는 고주파 및 직류 전원 공급 장치입니다.",
  },
  {
    name: "Cryogenic products",
    href: "/products/cryogenic",
    ko: "극저온 장비",
    desc: "극저온 환경을 만들고 유지하는 장비와 그 주변 부품을 다룹니다.",
  },
  {
    name: "Vacuum products",
    href: "/products/vacuum",
    ko: "진공 장비",
    desc: "진공 환경 조성에 필요한 펌프와 계측·배관 부품을 공급합니다.",
  },
] as const;

import Link from "next/link";
import DssLogo from "./DssLogo";
import { NAV, portalUrl } from "@/lib/site";

/**
 * 머리말 — 로고, 대메뉴, 그리고 오른쪽 끝의 '사내 시스템'.
 *
 * ■ 자바스크립트를 쓰지 않는다
 *
 * 펼침 메뉴는 group-hover와 focus-within으로, 모바일 메뉴는 <details>로
 * 만들었다. 회사 소개 사이트의 머리말은 동작이 뻔한 부품이라, 이것 때문에
 * 클라이언트 번들을 만들 이유가 없다. 부수 효과로 자바스크립트가 늦게
 * 뜨거나 실패해도 메뉴가 동작한다.
 *
 * focus-within을 함께 거는 이유: hover만 걸면 마우스 없이 Tab으로 넘기는
 * 사람에게 하위 메뉴가 영영 열리지 않는다.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-5">
        {/*
          로고만 줄어들 수 있게 둔다(min-w-0 + shrink).

          머리말에는 로고·'사내 시스템'·메뉴 단추 셋이 한 줄에 들어가야 하는데,
          좁은 폰에서 셋의 너비를 합치면 화면을 넘길 수 있다. 무엇이 잘릴지를
          브라우저에 맡기면 하필 오른쪽 끝의 버튼이 잘린다 — 여기서 가장
          중요한 요소다. 그래서 버튼과 메뉴 단추는 shrink-0으로 고정하고,
          모자란 폭은 로고 글자가 말줄임으로 흡수하게 했다.
        */}
        <Link
          href="/"
          className="flex min-w-0 shrink items-center"
          aria-label="(주)디에스에스 홈으로"
        >
          <DssLogo />
        </Link>

        {/* ── 대메뉴 (넓은 화면) ── */}
        <nav className="ml-auto hidden lg:block" aria-label="주메뉴">
          <ul className="flex items-center">
            {NAV.map((group) => (
              <li key={group.label} className="group relative">
                <a
                  href="#"
                  className="block px-4 py-7 text-[15px] font-semibold text-zinc-700 transition-colors hover:text-dss-accent group-focus-within:text-dss-accent"
                >
                  {group.label}
                </a>
                <div className="invisible absolute left-0 top-full min-w-48 border border-zinc-200 bg-white py-2 opacity-0 shadow-lg transition-[opacity,visibility] group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm whitespace-nowrap text-zinc-600 hover:bg-zinc-50 hover:text-dss-accent"
                        >
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/*
          ── 사내 시스템 ──

          직원만 쓰는 문이라 손님용 메뉴와 같은 줄에 같은 모양으로 두지
          않는다. 채운 버튼으로 두어 "이건 다른 종류의 링크"임이 한눈에
          보이게 했다.

          rel="noopener"를 붙인다 — 새 창으로 여는 링크는 이것이 없으면
          열린 쪽에서 window.opener로 이 창의 주소를 바꿀 수 있다.
          로그인 화면으로 가는 링크라 특히 지켜야 하는 자리다.
        */}
        <a
          href={portalUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex shrink-0 items-center gap-2 rounded-md bg-dss-navy px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-dss-navy-2 sm:px-4 sm:text-sm lg:ml-4"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          사내 시스템
        </a>

        {/* ── 메뉴 (좁은 화면) ── */}
        <details className="relative shrink-0 lg:hidden">
          <summary
            className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100"
            aria-label="메뉴 열기"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>
          <div className="absolute right-0 top-full mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-2 shadow-xl">
            {NAV.map((group) => (
              <div key={group.label} className="px-2 py-1.5">
                <p className="px-2 py-1 text-sm font-bold text-zinc-900">
                  {group.label}
                </p>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="block rounded px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}

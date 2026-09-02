import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { COMPANY, PRODUCTS, SHORTCUTS } from "@/lib/site";

/**
 * 메인 화면.
 *
 * 기존 dss21.com 메인의 구성을 그대로 따랐다 — 배너, 바로가기 넉 장,
 * 제품소개, 공지사항, 고객센터, 꼬리말.
 *
 * ■ 원본 이미지를 가져오지 않았다
 *
 * 배너에 깔린 1.8MB짜리 세계지도 사진은 출처가 적혀 있지 않은 스톡
 * 이미지다. 라이선스를 확인할 수 없는 사진을 새 저장소로 옮기는 것은
 * 나중에 되돌리기 어려운 종류의 일이라, 같은 인상(짙은 남색, 격자,
 * 대륙을 잇는 곡선)을 CSS와 SVG로 다시 그렸다. 파일 무게는 0이고,
 * 어느 화면 폭에서나 또렷하다.
 *
 * 회사가 사진 원본과 사용 권리를 갖고 있다면 배너 배경만 그 사진으로
 * 바꾸면 된다 — 아래 <HeroBackdrop />만 갈아 끼우는 자리다.
 */

/** 배너 배경. 짙은 남색 + 격자 + 대륙을 잇는 곡선. */
function HeroBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-dss-navy">
      {/* 아래쪽이 살짝 밝은 남색 — 원본 사진의 빛 방향을 따라간다. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_120%,#1e4b8f_0%,#0d2b5c_45%,#0a1a3f_100%)]" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 420"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          {/* 원본의 옅은 격자. 원근이 아니라 평면 격자로 단순화했다. */}
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M48 0H0V48"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              opacity="0.06"
            />
          </pattern>
          <linearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f5c451" stopOpacity="0" />
            <stop offset="50%" stopColor="#f5c451" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f5c451" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="1200" height="420" fill="url(#grid)" />

        {/* 거점을 잇는 곡선 — 원본의 노란 항로선. */}
        <g fill="none" stroke="url(#arc)" strokeWidth="1.6">
          <path d="M60 330 Q 330 90 620 250" />
          <path d="M180 360 Q 520 80 900 210" />
          <path d="M420 300 Q 760 60 1160 250" />
          <path d="M120 260 Q 480 180 880 340" />
        </g>

        {/* 거점 점. 곡선의 양 끝과 교차점 언저리에 둔다. */}
        <g fill="#bfe3ff">
          {[
            [60, 330],
            [620, 250],
            [180, 360],
            [900, 210],
            [420, 300],
            [1160, 250],
            [880, 340],
            [330, 150],
            [760, 120],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" opacity="0.9" />
          ))}
        </g>
      </svg>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        {/* ───────── 배너 ───────── */}
        <section className="relative isolate flex min-h-[420px] items-center overflow-hidden md:min-h-[520px]">
          <HeroBackdrop />
          <div className="relative mx-auto w-full max-w-6xl px-5 py-20">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-dss-accent sm:text-sm sm:tracking-[0.3em]">
              SEMICONDUCTOR EQUIPMENT SOLUTIONS
            </p>
            {/*
              원본 배너의 굵은 이탤릭 두 줄을 그대로 가져왔다. 회사가
              오랫동안 얼굴로 써 온 문구라 임의로 바꾸지 않는다.
            */}
            <h1 className="mt-5 text-[26px] font-extrabold italic leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              BUSINESS NETWORKING
              <br />
              DSS CO., LTD.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75">
              다양한 노하우를 통하여 최고의 제품과 최상의 서비스를 지원합니다.
            </p>
            <a
              href="#products"
              className="mt-9 inline-flex items-center gap-2 border border-white/60 px-8 py-3 text-sm font-semibold tracking-widest text-white transition-colors hover:border-white hover:bg-white hover:text-dss-navy"
            >
              MORE
            </a>
          </div>
        </section>

        {/* ───────── 바로가기 넉 장 ───────── */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SHORTCUTS.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex flex-col border border-zinc-200 bg-white p-7 transition-all hover:-translate-y-1 hover:border-dss-accent hover:shadow-lg"
              >
                <h2 className="text-lg font-bold text-zinc-900">{card.title}</h2>
                <p className="mt-1 text-[11px] font-semibold tracking-[0.14em] text-dss-accent">
                  {card.subtitle}
                </p>
                <p className="mt-5 flex-1 text-sm leading-relaxed text-zinc-500">
                  {card.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
                <span
                  aria-hidden="true"
                  className="mt-6 inline-flex h-9 w-9 items-center justify-center border border-zinc-300 text-zinc-400 transition-colors group-hover:border-dss-accent group-hover:bg-dss-accent group-hover:text-white"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ───────── 제품소개 ───────── */}
        <section id="products" className="scroll-mt-24 bg-zinc-50 py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <header className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
                제품소개
              </h2>
              <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-dss-accent">
                PRODUCTS
              </p>
              <span className="mx-auto mt-6 block h-0.5 w-12 bg-dss-blue" />
            </header>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {PRODUCTS.map((product) => (
                <Link
                  key={product.name}
                  href={product.href}
                  className="group border border-zinc-200 bg-white p-8 transition-all hover:border-dss-blue hover:shadow-lg"
                >
                  <h3 className="text-lg font-bold text-zinc-900 transition-colors group-hover:text-dss-blue">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">{product.ko}</p>
                  <p className="mt-5 text-sm leading-relaxed text-zinc-600">
                    {product.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── 공지사항 · 고객센터 ───────── */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <div className="flex items-baseline justify-between border-b-2 border-zinc-800 pb-3">
                <h2 className="text-xl font-bold text-zinc-900">
                  공지사항
                  <span className="ml-3 text-[11px] font-semibold tracking-[0.14em] text-dss-accent">
                    NOTICE
                  </span>
                </h2>
                <Link
                  href="/support/notice"
                  className="text-sm text-zinc-400 hover:text-dss-accent"
                >
                  + 더보기
                </Link>
              </div>
              {/*
                원본도 이 자리가 비어 있다("게시물이 없습니다"). 없는 글을
                지어내 채우지 않고 같은 상태를 그대로 보여준다.
              */}
              <p className="py-14 text-center text-sm text-zinc-400">
                등록된 게시물이 없습니다.
              </p>
            </div>

            <div>
              <div className="border-b-2 border-zinc-800 pb-3">
                <h2 className="text-xl font-bold text-zinc-900">
                  고객센터
                  <span className="ml-3 text-[11px] font-semibold tracking-[0.14em] text-dss-accent">
                    CUSTOMER CENTER
                  </span>
                </h2>
              </div>
              <div className="mt-6 bg-dss-navy p-8 text-white">
                <a
                  href={`tel:${COMPANY.tel}`}
                  className="text-3xl font-bold tracking-tight hover:text-dss-accent"
                >
                  {COMPANY.tel}
                </a>
                <p className="mt-4 text-sm text-white/70">
                  상담운영 시간 : {COMPANY.hours}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  문의메일 :{" "}
                  <a href={`mailto:${COMPANY.email}`} className="hover:text-white">
                    {COMPANY.email}
                  </a>
                </p>
                <p className="mt-5 text-sm leading-relaxed text-white/60">
                  온라인을 통해 제품에 대한 문의사항을 남겨주시면 빠른 답변
                  도와드리겠습니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

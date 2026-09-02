import Link from "next/link";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { itemHref, type NavGroup, type NavItem } from "@/lib/site";

/**
 * 하위 페이지의 공통 틀 — 머리말, 제목 띠, 하위 탭, 본문, 꼬리말.
 *
 * 대분류 6개와 그 아래 항목들은 생김새가 같다. 페이지마다 이 구조를
 * 되풀이해 적으면 나중에 제목 띠 하나 고치는 데 스무 군데를 손대야 한다.
 * 라우트 파일은 "무엇을 보여줄지"만 정하고 틀은 여기 한 곳에 둔다.
 *
 * 제목 띠는 메인 배너와 같은 남색·같은 그라데이션을 쓴다. 높이만 낮췄다 —
 * 메인은 첫인상이고 여기는 길잡이라, 같은 옷을 입되 자리를 덜 차지해야 한다.
 */
export default function PageShell({
  group,
  current,
  children,
}: {
  group: NavGroup;
  /** 지금 보고 있는 하위 항목. 대분류 페이지에서는 없다. */
  current?: NavItem;
  children: React.ReactNode;
}) {
  // slug 없는 항목은 대분류 페이지 자신을 가리킨다. 탭으로 두면 자기
  // 자신으로 가는 탭이 하나 생기므로 뺀다.
  const tabs = group.items.filter((item) => item.slug);

  return (
    <>
      <SiteHeader />

      <main>
        {/* ───────── 제목 띠 ───────── */}
        <section className="relative isolate flex min-h-[200px] items-center overflow-hidden bg-dss-navy md:min-h-[260px]">
          <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_120%,#1e4b8f_0%,#0d2b5c_45%,#0a1a3f_100%)]" />
          <div className="relative mx-auto w-full max-w-6xl px-5 py-14 text-center">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-dss-accent">
              {group.en}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
              {current?.label ?? group.label}
            </h1>

            {/* 어디까지 들어와 있는지 — 뒤로 가기 말고 돌아갈 길을 준다. */}
            <nav aria-label="현재 위치" className="mt-6">
              <ol className="flex flex-wrap items-center justify-center gap-2 text-[13px] text-white/55">
                <li>
                  <Link href="/" className="transition-colors hover:text-white">
                    홈
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li>
                  {current ? (
                    <Link
                      href={`/${group.slug}`}
                      className="transition-colors hover:text-white"
                    >
                      {group.label}
                    </Link>
                  ) : (
                    <span className="text-white">{group.label}</span>
                  )}
                </li>
                {current && (
                  <>
                    <li aria-hidden="true">›</li>
                    <li className="text-white">{current.label}</li>
                  </>
                )}
              </ol>
            </nav>
          </div>
        </section>

        {/* ───────── 하위 탭 ───────── */}
        {tabs.length > 0 && (
          <div className="border-b border-zinc-200 bg-zinc-50">
            <nav className="mx-auto max-w-6xl px-5" aria-label={`${group.label} 하위 메뉴`}>
              <ul className="flex flex-wrap justify-center">
                {tabs.map((item) => {
                  const active = item.slug === current?.slug;
                  return (
                    <li key={item.slug}>
                      <Link
                        href={itemHref(group, item)}
                        aria-current={active ? "page" : undefined}
                        className={
                          "-mb-px block border-b-2 px-5 py-4 text-sm transition-colors " +
                          (active
                            ? "border-dss-blue font-semibold text-dss-blue"
                            : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-900")
                        }
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        )}

        {children}
      </main>

      <SiteFooter />
    </>
  );
}

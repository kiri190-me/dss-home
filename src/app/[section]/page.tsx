import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ComingSoon from "@/components/ComingSoon";
import PageShell from "@/components/PageShell";
import { COMPANY, NAV, findGroup, itemHref } from "@/lib/site";

/**
 * 대분류 페이지 — /company, /products, /inquiry ...
 *
 * ■ 왜 폴더 여섯 개가 아니라 [section] 하나인가
 *
 * 대분류 6개와 그 아래 17개는 지금 전부 같은 화면이다. 라우트 파일을
 * 스물세 개 만들면 같은 코드가 스물세 벌 생기고, 제목 띠 하나 고치는 데
 * 스물세 곳을 손대야 한다. 목차는 이미 lib/site.ts의 NAV에 있으니 주소도
 * 거기서 만들게 했다.
 *
 * 나중에 어느 한 페이지에 진짜 내용이 들어가면 src/app/company/history/
 * 같은 폴더를 만들면 된다 — Next는 고정된 칸을 [section]보다 먼저 고르므로
 * 그 주소만 새 페이지로 갈아 끼워진다.
 *
 * dynamicParams=false: NAV에 없는 주소는 404다. 이게 없으면 /아무거나가
 * 전부 이 페이지로 들어와, 오타 난 주소에도 멀쩡한 화면이 뜬다.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return NAV.map((group) => ({ section: group.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const group = findGroup(section);
  if (!group) return {};
  return { title: `${group.label} | ${COMPANY.short}` };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const group = findGroup(section);
  if (!group) notFound();

  const cards = group.items.filter((item) => item.slug);

  return (
    <PageShell group={group}>
      {cards.length > 0 ? (
        // 하위 항목이 있으면 목록을 보여준다. 대분류 페이지에 "준비 중"만
        // 띄우면, 정작 여기서 갈 수 있는 곳들을 대메뉴에서 다시 찾아야 한다.
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((item) => (
              <Link
                key={item.slug}
                href={itemHref(group, item)}
                className="group flex items-center justify-between border border-zinc-200 bg-white px-7 py-8 transition-all hover:-translate-y-1 hover:border-dss-accent hover:shadow-lg"
              >
                <span className="text-base font-bold text-zinc-900 transition-colors group-hover:text-dss-accent">
                  {item.label}
                </span>
                <span
                  aria-hidden="true"
                  className="ml-4 inline-flex h-9 w-9 shrink-0 items-center justify-center border border-zinc-300 text-zinc-400 transition-colors group-hover:border-dss-accent group-hover:bg-dss-accent group-hover:text-white"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <ComingSoon what={`${group.label}의`} />
      )}
    </PageShell>
  );
}

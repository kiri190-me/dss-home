import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ComingSoon from "@/components/ComingSoon";
import PageShell from "@/components/PageShell";
import { COMPANY, NAV, findGroup, findItem } from "@/lib/site";

/**
 * 하위 항목 페이지 — /company/history, /products/vacuum ...
 *
 * 같은 판단으로 만들었다. 위층 [section]/page.tsx의 설명을 함께 읽으면 된다.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return NAV.flatMap((group) =>
    // slug 없는 항목은 대분류 페이지를 가리키므로 여기 주소가 없다.
    group.items.flatMap((item) =>
      item.slug ? [{ section: group.slug, item: item.slug }] : []
    )
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string; item: string }>;
}): Promise<Metadata> {
  const { section, item } = await params;
  const group = findGroup(section);
  const found = group && findItem(group, item);
  if (!group || !found) return {};
  return { title: `${found.label} | ${group.label} | ${COMPANY.short}` };
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ section: string; item: string }>;
}) {
  const { section, item } = await params;
  const group = findGroup(section);
  if (!group) notFound();

  const found = findItem(group, item);
  if (!found) notFound();

  return (
    <PageShell group={group} current={found}>
      <ComingSoon what={`'${found.label}'의`} />
    </PageShell>
  );
}

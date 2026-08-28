import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import LinkNotUsable from "@/components/LinkNotUsable";
import {
  ITEM_PAGE_LIMIT,
  listItemsForLink,
  type CustomerRepairItem,
} from "@/lib/db/customer-repair-items";
import { findActiveLinkByToken } from "@/lib/db/repair-requests";
import { COMPANY } from "@/lib/site";

export const metadata: Metadata = {
  title: "수리 현황 | (주)DSS",
  // 이 주소가 검색에 잡히면 비밀 주소인 의미가 사라진다.
  robots: { index: false, follow: false },
};

/**
 * 고객사 전용 수리 현황판 — 링크를 타고 들어오면 처음 보이는 화면.
 *
 * ■ 여기서 판정하는 것이 없다
 *
 * 어느 건을 보여줄지, 출하 완료됐는지, 견적서 번호가 무엇인지는 전부 사내에서
 * 정해 완성된 형태로 밀려 들어온다(`customer_repair_items`). 이 화면은 받아서
 * 그리기만 한다.
 *
 * ■ 검색을 서버에서 하는 이유
 *
 * 전부 내려보내고 브라우저에서 거르면 화면에 띄우지도 않은 줄까지 고객
 * 브라우저로 나간다. 목록 자체가 사내 자료라 "안 보이지만 받아는 갔다"는
 * 상태를 만들지 않는다. 그래서 검색어는 주소에 실리고 서버가 거른다 —
 * 부수 효과로 검색 결과 주소를 그대로 동료에게 넘길 수 있다.
 */
export default async function RepairStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { token } = await params;
  const { q } = await searchParams;
  const query = (q ?? "").slice(0, 100);

  const link = await findActiveLinkByToken(token);
  if (!link) return <LinkNotUsable />;

  const { items, truncated } = await listItemsForLink(link.id, query);
  const base = `/repair/${encodeURIComponent(token)}`;

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-5 py-12 md:py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-dss-accent">
              REPAIR STATUS
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              수리 현황
            </h1>
            <p className="mt-3 text-sm text-zinc-600">
              <span className="font-semibold text-zinc-900">
                {link.customerDisplayName}
              </span>{" "}
              전용 화면입니다.
            </p>
          </div>

          <Link
            href={`${base}/new`}
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-dss-navy px-6 text-[15px] font-semibold text-white transition-colors hover:bg-dss-navy-2"
          >
            수리 의뢰서 작성
          </Link>
        </header>

        {/*
          검색은 평범한 GET 폼이다. 자바스크립트가 필요 없고, 검색한 주소를
          그대로 넘겨줄 수 있으며, 뒤로 가기가 자연스럽게 동작한다.
        */}
        <form method="get" action={base} className="mt-8 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            maxLength={100}
            placeholder="모델명 · L/N · S/N 으로 찾기"
            aria-label="모델명, L/N, S/N으로 찾기"
            className="h-11 w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 text-[15px] text-zinc-900 outline-none focus-visible:border-dss-accent"
          />
          <button
            type="submit"
            className="h-11 shrink-0 rounded-lg border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 transition-colors hover:border-dss-accent hover:text-dss-accent"
          >
            찾기
          </button>
          {query ? (
            <Link
              href={base}
              className="flex h-11 shrink-0 items-center px-3 text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-900"
            >
              전체 보기
            </Link>
          ) : null}
        </form>

        <p className="mt-4 text-xs leading-relaxed text-zinc-500">
          출하가 완료된 건은 목록에서 제외됩니다. 「현재 상태」는 담당자가
          안내용으로 적어 둔 값으로, 실제 작업 상황과 다를 수 있습니다.
        </p>

        {items.length === 0 ? (
          <p className="mt-10 rounded-lg border border-zinc-200 bg-zinc-50 px-6 py-14 text-center text-sm text-zinc-500">
            {query
              ? `'${query}' 로 찾은 건이 없습니다.`
              : "진행 중인 수리 건이 없습니다."}
          </p>
        ) : (
          <>
            {/* 표는 좁은 화면에서 자기 안에서만 가로로 밀린다. */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-zinc-800 text-left text-xs text-zinc-500">
                    <Th>접수번호</Th>
                    <Th>Model</Th>
                    <Th>L/N</Th>
                    <Th>S/N</Th>
                    <Th>접수일</Th>
                    <Th>현재 상태</Th>
                    <Th>비고</Th>
                    <Th>견적서번호</Th>
                    <Th>견적발행일</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <Row key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              {truncated
                ? `${ITEM_PAGE_LIMIT}건까지만 표시했습니다. 검색으로 좁혀 주세요.`
                : `${items.length}건`}
            </p>
          </>
        )}

        <p className="mt-10 rounded-lg bg-zinc-100 px-4 py-3 text-center text-xs leading-relaxed text-zinc-600">
          궁금하신 점은 담당자에게 연락 주세요.
          <br />
          <a
            href={`tel:${COMPANY.tel}`}
            className="mt-1 inline-block text-base font-bold text-zinc-900 hover:text-dss-accent"
          >
            {COMPANY.tel}
          </a>
        </p>
      </main>

      <SiteFooter />
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-3 font-semibold whitespace-nowrap">{children}</th>;
}

/** 값이 없는 칸은 전부 `-`. 빈칸으로 두면 "아직 없음"인지 화면이 깨진 건지 모른다. */
function Cell({ value }: { value: string | null }) {
  return (
    <td className="px-3 py-3 align-top text-zinc-700">
      {value ? value : <span className="text-zinc-400">-</span>}
    </td>
  );
}

function Row({ item }: { item: CustomerRepairItem }) {
  const pending = item.sourceKind === "REQUEST";

  return (
    <tr className="border-b border-zinc-200 hover:bg-zinc-50">
      <td className="px-3 py-3 align-top font-semibold whitespace-nowrap text-zinc-900">
        {pending ? (
          // 아직 접수번호가 없다. 번호를 지어내지 않고 상태를 말한다 —
          // 없는 번호를 보여주면 고객이 그 번호로 문의하게 된다.
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            접수 전
          </span>
        ) : (
          (item.intakeNumber ?? <span className="text-zinc-400">-</span>)
        )}
      </td>
      <Cell value={item.modelName} />
      <Cell value={item.lotNumber} />
      <Cell value={item.serialNumber} />
      <Cell value={item.receivedAt} />
      <td className="px-3 py-3 align-top whitespace-nowrap">
        {item.statusLabel ? (
          <span className="rounded bg-dss-navy/10 px-2 py-0.5 text-xs font-semibold text-dss-navy">
            {item.statusLabel}
          </span>
        ) : (
          <span className="text-zinc-400">-</span>
        )}
      </td>
      <Cell value={item.statusNote} />
      <Cell value={item.quoteNumber} />
      <Cell value={item.quoteIssuedDate} />
    </tr>
  );
}

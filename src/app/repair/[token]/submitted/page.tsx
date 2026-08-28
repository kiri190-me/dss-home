import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { COMPANY } from "@/lib/site";

export const metadata: Metadata = {
  title: "수리 의뢰 완료 | (주)DSS",
  robots: { index: false, follow: false },
};

/**
 * 보낸 뒤의 확인 화면.
 *
 * 진행 상황 조회는 두지 않는다(결정됨). 그래서 여기서 할 수 있는 안내는
 * "받았다"와 "급하면 전화" 둘뿐이고, 그 둘을 분명히 적는 것이 이 화면의
 * 전부다. 의뢰 번호를 만들어 보여주지 않는 이유: 사내에서 접수가 되어야
 * 비로소 접수번호가 생기고, 여기서 다른 번호를 하나 더 주면 고객과 담당자가
 * 서로 다른 번호를 들고 통화하게 된다.
 */
export default async function RepairRequestDonePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <>
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-24 text-center">
        <div className="text-4xl" aria-hidden="true">
          ✅
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
          수리 의뢰가 접수되었습니다
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600">
          담당자가 내용을 확인한 뒤 연락드리겠습니다.
          <br />
          상담 운영 시간은 {COMPANY.hours} 입니다.
        </p>

        <p className="mt-8 rounded-lg bg-zinc-100 px-4 py-3 text-xs leading-relaxed text-zinc-600">
          급하신 경우 전화 주시면 더 빠릅니다.
          <br />
          <a
            href={`tel:${COMPANY.tel}`}
            className="mt-1 inline-block text-base font-bold text-zinc-900 hover:text-dss-accent"
          >
            {COMPANY.tel}
          </a>
        </p>

        <div className="mt-8">
          <Link
            href={`/repair/${encodeURIComponent(token)}/new`}
            className="text-sm text-zinc-500 underline underline-offset-4 hover:text-zinc-900"
          >
            의뢰를 하나 더 보내기
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

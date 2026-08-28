import { DssMark } from "./DssLogo";
import { COMPANY } from "@/lib/site";

/**
 * 꼬리말.
 *
 * 사업자 정보를 여기 싣는 것은 장식이 아니라 의무다 — 상호·대표자·
 * 사업자등록번호·주소·연락처는 전자상거래법이 표시하도록 정한 항목이고,
 * 거래처가 실재하는 회사인지 확인하는 자리이기도 하다.
 *
 * 전화와 메일은 링크로 만든다. 폰에서 번호를 눌러 바로 걸 수 있어야
 * 하고, 그게 이 사이트에 오는 사람들이 실제로 하려는 일이다.
 */
export default function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <DssMark className="h-8" />
              <span className="flex flex-col leading-none">
                <span className="text-[15px] font-bold text-zinc-800">
                  {COMPANY.nameKo}
                </span>
                <span className="mt-1 text-[11px] font-semibold tracking-[0.12em] text-zinc-500">
                  {COMPANY.nameEn}
                </span>
              </span>
            </div>

            <dl className="mt-6 grid gap-x-8 gap-y-1.5 text-[13px] leading-relaxed text-zinc-600 sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="shrink-0 text-zinc-400">상호명</dt>
                <dd>{COMPANY.nameKo}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-zinc-400">대표</dt>
                <dd>{COMPANY.ceo}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-zinc-400">사업자번호</dt>
                <dd>{COMPANY.businessNumber}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-zinc-400">대표전화</dt>
                <dd>
                  <a href={`tel:${COMPANY.tel}`} className="hover:text-dss-accent">
                    {COMPANY.tel}
                  </a>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-zinc-400">팩스</dt>
                <dd>{COMPANY.fax}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-zinc-400">이메일</dt>
                <dd>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="hover:text-dss-accent"
                  >
                    {COMPANY.email}
                  </a>
                </dd>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <dt className="shrink-0 text-zinc-400">주소</dt>
                <dd>{COMPANY.address}</dd>
              </div>
            </dl>
          </div>
        </div>

        <p className="mt-10 border-t border-zinc-200 pt-6 text-xs text-zinc-400">
          COPYRIGHT © {COMPANY.since} {COMPANY.short}. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}

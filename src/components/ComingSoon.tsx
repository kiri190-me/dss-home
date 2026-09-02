import Link from "next/link";
import { COMPANY } from "@/lib/site";

/**
 * 아직 내용이 없는 페이지의 본문.
 *
 * 빈 화면을 그냥 두지 않고 연락처를 같이 싣는다. 여기까지 들어온 사람은
 * 무언가를 찾고 있었고, "준비 중"만 있으면 그대로 나가야 한다. 원본
 * dss21.com도 비어 있는 게시판 자리에 "등록된 게시물이 없습니다"를
 * 보여주지, 흰 화면을 보여주지 않는다.
 */
export default function ComingSoon({ what }: { what: string }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-20 text-center md:py-28">
      <span className="mx-auto block h-0.5 w-12 bg-dss-blue" />
      <h2 className="mt-8 text-xl font-bold text-zinc-900">준비 중입니다</h2>
      <p className="mt-4 text-sm leading-relaxed text-zinc-500">
        {what} 내용은 아직 준비 중입니다. 문의하실 내용이 있으시면 아래로
        연락 주세요.
      </p>

      <dl className="mx-auto mt-10 grid max-w-md gap-3 border border-zinc-200 bg-zinc-50 px-6 py-7 text-sm">
        <div className="flex items-center justify-center gap-3">
          <dt className="text-zinc-400">대표전화</dt>
          <dd>
            <a
              href={`tel:${COMPANY.tel}`}
              className="font-semibold text-zinc-800 hover:text-dss-accent"
            >
              {COMPANY.tel}
            </a>
          </dd>
        </div>
        <div className="flex items-center justify-center gap-3">
          <dt className="text-zinc-400">이메일</dt>
          <dd>
            <a
              href={`mailto:${COMPANY.email}`}
              className="font-semibold text-zinc-800 hover:text-dss-accent"
            >
              {COMPANY.email}
            </a>
          </dd>
        </div>
        <div className="flex items-center justify-center gap-3">
          <dt className="text-zinc-400">상담시간</dt>
          <dd className="text-zinc-600">{COMPANY.hours}</dd>
        </div>
      </dl>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 border border-zinc-300 px-8 py-3 text-sm font-semibold tracking-widest text-zinc-600 transition-colors hover:border-dss-navy hover:bg-dss-navy hover:text-white"
      >
        홈으로
      </Link>
    </section>
  );
}

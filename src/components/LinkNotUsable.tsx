import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { COMPANY } from "@/lib/site";

/**
 * 쓸 수 없는 주소로 들어왔을 때의 화면.
 *
 * ■ 왜 컴포넌트로 빼는가 — 문구가 갈리면 안 되기 때문이다
 *
 * 현황 목록과 의뢰서 작성 화면 둘 다 이 화면으로 끝난다. 두 곳에 따로 적어
 * 두면 한쪽만 고쳐지는 날이 오고, 그때 **문구의 차이가 곧 정보가 된다** —
 * 토큰을 하나씩 대보는 쪽에서 "이 화면은 다르네"로 존재 여부를 읽어낸다.
 *
 * ■ 없는 주소와 회수된 주소를 구분하지 않는다
 *
 * 구분해 주면 그 자체가 "존재하는 토큰"을 찾아내는 조회 도구가 된다.
 * 둘 다 같은 문구로 끝낸다.
 */
export default function LinkNotUsable() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-24 text-center">
        <div className="text-4xl" aria-hidden="true">
          🔒
        </div>
        <h1 className="mt-6 text-xl font-bold text-zinc-900">
          사용할 수 없는 주소입니다
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          주소가 잘못되었거나 더 이상 사용되지 않는 주소입니다.
          <br />
          담당자에게 새 주소를 요청해 주세요.
        </p>
        <p className="mt-8 text-sm text-zinc-500">
          문의:{" "}
          <a href={`tel:${COMPANY.tel}`} className="hover:text-dss-accent">
            {COMPANY.tel}
          </a>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

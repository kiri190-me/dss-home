import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/crypto/hash";
import { nasSyncSecret } from "@/lib/site";

/**
 * 사내(A/S 시스템)에서 온 요청인지 확인한다.
 *
 * ■ 이 경계가 하는 일과 하지 않는 일
 *
 * 이 열쇠를 가진 쪽은 새 수리 의뢰를 읽고 고객사 링크를 심을 수 있다.
 * 하지만 **이 열쇠로 사내망에 닿을 수는 없다** — 연결은 언제나 사내가 먼저
 * 걸고, 여기서 사내로 가는 길은 아예 없다. 이 서버가 통째로 털려도 공격자가
 * 얻는 것은 여기 있는 것뿐이다.
 *
 * ■ 왜 dss-auth의 OIDC를 쓰지 않는가
 *
 * 그쪽은 **사람이 브라우저로** 사내 시스템에 들어가는 통로다. 이건 서버 둘이
 * 주고받는 다른 종류의 신뢰이고, 여기에 OIDC를 끼우면 공개 서버가 로그인
 * 포털과 대화할 수 있어야 한다 — 지금 막으려는 바로 그 연결이 생긴다.
 * 방식(해시 저장, 시간차 없는 비교)은 본뜨되 시스템은 끌어오지 않는다.
 */
export function requireNasSync(request: Request): NextResponse | null {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return unauthorized();
  }

  // 시간차 없는 비교를 쓴다. 여기는 색인 조회가 아니라 **문자열 대조**라,
  // 앞에서부터 한 글자씩 비교하면 걸리는 시간이 맞은 글자 수를 알려준다.
  if (!safeEqual(header.slice(7), nasSyncSecret())) {
    return unauthorized();
  }

  return null;
}

/**
 * 실패 사유를 나누지 않는다(헤더가 없는 것과 값이 틀린 것). 나누면 열쇠를
 * 맞춰보는 쪽에 단서가 된다. 본문에도 아무것도 담지 않는다.
 */
function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: { "cache-control": "no-store" } }
  );
}

/** 이 API의 응답은 어디에도 캐시되면 안 된다 — 개인정보가 실린다. */
export const NO_STORE = { "cache-control": "no-store" } as const;

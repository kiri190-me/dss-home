"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sha256Hex } from "@/lib/crypto/hash";
import {
  findActiveLinkByToken,
  insertRepairRequest,
  type NewRepairRequest,
} from "@/lib/db/repair-requests";
import { ALL_FIELDS, maxLength, REQUIRED_FIELDS } from "@/lib/form-fields";
import { trustedClientIp } from "@/lib/http/client-key";
import { createRateLimiter } from "@/lib/http/rate-limit";
import { trustedProxyHops } from "@/lib/site";

/**
 * 수리 의뢰 접수.
 *
 * 서버 액션으로 둔 이유는 dss-auth의 비상 로그인과 같다 — Next가 서버 액션
 * 호출마다 Origin과 Host를 대조해 거절하므로 CSRF 토큰을 손으로 만들 필요가
 * 없다. 라우트 핸들러였다면 그 방어를 직접 짜야 했다.
 */

/**
 * 링크 하나당 시간당 20건.
 *
 * 정상 사용자는 하루에 몇 건이다. 20건은 그 몇 배이면서, 링크가 새어
 * 자동화된 도구에 물렸을 때는 확실히 걸린다. 링크별로 세는 이유: IP로 세면
 * 한 회사에서 여러 명이 같은 공인 IP로 나올 때 서로의 한도를 깎는다.
 *
 * 프로세스 메모리에 둔다 — DB에 두면 요청마다 쓰기가 생겨 제한 장치 자체가
 * 증폭기가 된다(dss-auth rate-limit.ts의 판단과 같다).
 */
const perLinkLimiter = createRateLimiter({ capacity: 20, refillPerMinute: 20 / 60 });

/**
 * 주소 하나당 시간당 40건.
 *
 * 링크를 여러 개 손에 넣은 경우를 막는다. 링크별 한도만 있으면 링크 n개로
 * n배를 넣을 수 있다.
 */
const perIpLimiter = createRateLimiter({ capacity: 40, refillPerMinute: 40 / 60 });

function fail(token: string, reason: string): never {
  redirect(`/repair/${encodeURIComponent(token)}/new?error=${reason}`);
}

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

export async function submitRepairRequest(formData: FormData): Promise<void> {
  const token = text(formData, "token");
  if (!token) fail("", "invalid");

  const headerList = await headers();
  const ip = trustedClientIp(
    headerList.get("x-forwarded-for"),
    trustedProxyHops()
  );

  // ───── 속도 제한 ─────
  //
  // DB를 만지기 전에 건다. 링크가 유효한지조차 보기 전이다 — 유효성 확인도
  // 조회 한 번이고, 그 조회를 무제한으로 시키면 그것만으로 부담이 된다.
  const now = Date.now();
  const ipKey = ip ?? "shared";
  if (!perIpLimiter.check(ipKey, now).allowed) fail(token, "too_many");
  if (!perLinkLimiter.check(sha256Hex(token), now).allowed) fail(token, "too_many");

  const link = await findActiveLinkByToken(token);
  // 링크가 없는 것과 회수된 것을 구분해 알려주지 않는다. 구분해 주면 토큰을
  // 하나씩 대보며 "존재하는 토큰"을 찾아내는 도구가 된다.
  if (!link) fail(token, "invalid");

  // ───── 칸 읽기 ─────
  //
  // 칸 이름을 여기 손으로 다시 적지 않는다. 양식에 칸이 40개에 가까워
  // 목록을 두 곳에 두면 반드시 어긋나고, 어긋나면 **고객이 적은 내용이
  // 조용히 버려진다.** form-fields.ts 하나를 화면과 여기가 함께 읽는다.
  const values: Record<string, string | null> = {};

  for (const field of ALL_FIELDS) {
    const value = text(formData, field.name);

    if (value.length > maxLength(field.name)) {
      fail(token, "too_long");
    }

    // 빈 문자열은 null로. DB에 ""와 null이 섞이면 "안 적은 것"을 찾는
    // 조회가 두 가지를 다 물어봐야 한다.
    values[field.name] = value || null;
  }

  for (const required of REQUIRED_FIELDS) {
    if (!values[required]) fail(token, "missing");
  }

  await insertRepairRequest({
    // 필수 칸을 여기 하나씩 다시 적지 않는다. 적어 두면 REQUIRED_FIELDS가
    // 늘 때마다 여기도 고쳐야 하고, 잊으면 타입 오류로 막힌다 — 실제로
    // L/N·S/N·END USER를 필수로 올릴 때 그렇게 막혔다. 바로 위 반복문이
    // REQUIRED_FIELDS의 모든 칸이 비어 있지 않음을 이미 확인했으므로,
    // 여기서는 그 사실을 타입에 한 번만 알려 준다.
    //
    // 남는 위험 하나: DB 칸을 NOT NULL로 바꾸면서 REQUIRED_FIELDS에 넣는 것을
    // 잊으면 이 단언이 그걸 가린다. 다만 그런 실수는 첫 제출에서 곧바로
    // 터지므로 조용히 지나가지 않는다.
    ...(values as unknown as NewRepairRequest),
    customerLinkId: link.id,
    // 원문이 아니라 해시를 남긴다 — 남용 조사에는 "같은 곳에서 여러 번인가"만
    // 필요하고, 그 주소가 어디인지는 필요 없다.
    submitterIpHash: ip ? sha256Hex(ip) : null,
  });

  redirect(`/repair/${encodeURIComponent(token)}/submitted`);
}

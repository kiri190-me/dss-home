import { NextResponse } from "next/server";
import { listUnpulledRequests } from "@/lib/db/repair-requests";
import { NO_STORE, requireNasSync } from "@/lib/server/nas-sync-auth";

/**
 * 사내가 아직 안 가져간 의뢰를 내준다.
 *
 * ■ 커서가 아니라 "안 가져간 것"으로 고른다
 *
 * `번호 > 커서` 방식은 번호나 시계가 한 번이라도 어긋나면 그 사이의 한 건을
 * **조용히 건너뛴다.** 그리고 건너뛴 것은 아무도 모른다 — 고객이 넣은 의뢰가
 * 소리 없이 사라지는 것이 이 기능에서 가장 나쁜 실패다.
 *
 * `pulled_at IS NULL`로 내주고 사내가 **확인해 준 뒤에만** 표시하면 잃어버릴
 * 수가 없다. 대신 사내가 받고서 표시 전에 죽으면 같은 것을 다시 받는데,
 * 그건 사내 표의 unique가 흡수한다. **잃는 것보다 겹치는 편이 낫다.**
 *
 * ■ 여기서 지우지 않는다
 *
 * 가져갔다고 곧바로 지우면 사내에 넣다가 실패했을 때 되돌릴 방법이 없다.
 * 지우는 것은 한참 뒤 보관 기한이 지난 뒤에 따로 한다.
 */
export async function GET(request: Request) {
  const denied = requireNasSync(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("limit") ?? "100");
  // 한 번에 가져가는 양에 상한을 둔다. 사내가 실수로 큰 값을 보내도
  // 이 서버가 한 번에 모든 행을 메모리에 올리지 않는다.
  const limit = Number.isInteger(requested)
    ? Math.min(Math.max(requested, 1), 200)
    : 100;

  const rows = await listUnpulledRequests(limit);

  return NextResponse.json({ requests: rows }, { headers: NO_STORE });
}

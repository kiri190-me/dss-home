import { NextResponse } from "next/server";
import { markRequestsPulled } from "@/lib/db/repair-requests";
import { NO_STORE, requireNasSync } from "@/lib/server/nas-sync-auth";

/**
 * 사내가 "받아서 저장했다"고 알려오는 자리.
 *
 * 여기까지 와야 비로소 `pulled_at`이 찍히고, 그 의뢰는 다음 조회에서 빠진다.
 * 사내가 받기만 하고 저장 전에 죽으면 이 호출이 오지 않으므로 다음번에 같은
 * 것을 다시 받게 된다 — 의도한 동작이다.
 *
 * 이미 표시된 것을 다시 표시해도 무해하다(조건에 `pulled_at IS NULL`이 있어
 * 두 번째부터는 0행이 바뀐다). 그래서 사내는 마음 놓고 재시도할 수 있고,
 * 이 API에 잠금이 필요 없다.
 */
export async function POST(request: Request) {
  const denied = requireNasSync(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400, headers: NO_STORE }
    );
  }

  const ids = (body as { ids?: unknown })?.ids;

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json(
      { error: "ids는 문자열 배열이어야 합니다." },
      { status: 400, headers: NO_STORE }
    );
  }

  // 한 번에 표시할 수 있는 양에 상한을 둔다 — 위 조회의 상한(200)과 맞춘다.
  if (ids.length > 200) {
    return NextResponse.json(
      { error: "한 번에 200건까지만 표시할 수 있습니다." },
      { status: 400, headers: NO_STORE }
    );
  }

  const marked = await markRequestsPulled(ids as string[]);

  return NextResponse.json({ marked }, { headers: NO_STORE });
}

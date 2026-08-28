import { NextResponse } from "next/server";
import { sha256Hex } from "@/lib/crypto/hash";
import { revokeCustomerLink, upsertCustomerLink } from "@/lib/db/repair-requests";
import { NO_STORE, requireNasSync } from "@/lib/server/nas-sync-auth";

/**
 * 사내가 고객사 링크를 심거나 회수하는 자리.
 *
 * ■ 이 방향도 사내가 먼저 거는 연결이다
 *
 * 링크의 주인은 A/S 시스템이다 — 담당자가 진짜 고객사 목록에서 고르고
 * 발급한다. 공개 쪽은 화면을 그리는 데 필요한 만큼만 받아 둔다. 사내가
 * **나가면서** 밀어 넣으므로 방화벽에 들어오는 구멍이 생기지 않는다.
 *
 * ■ 진짜 고객사 id를 받지 않는다
 *
 * `nasLinkId`는 A/S가 이 링크를 위해 발급한 별도의 id이지 `customers.id`가
 * 아니다. 이 서버는 인터넷에 열려 있어 언젠가 털릴 수 있다고 가정해야 하고,
 * 그때 사내 고객사 식별자가 함께 새면 안 된다.
 *
 * ■ 두 번 보내도 오류가 아니다
 *
 * 같은 `nasLinkId`로 CREATE를 다시 보내면 조용히 넘어간다. 밀어 넣기가
 * 네트워크 문제로 실패했는지 성공했는지 사내가 확신할 수 없는 순간이 있고,
 * 그때 재시도가 오류가 되면 담당자가 손으로 확인해야 한다.
 */
/**
 * 본문을 느슨한 형태로 받아 칸마다 검사한다.
 *
 * CREATE/REVOKE를 미리 구분된 타입으로 선언하지 않는 이유: 이건 밖에서 온
 * 믿을 수 없는 JSON이지 우리 타입이 아니다. 타입을 씌워 두면 컴파일러가
 * "이미 확인된 값"처럼 다루게 되어, 실제로는 없는 칸을 있다고 믿는 코드가
 * 조용히 만들어진다.
 */
function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

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

  const payload = (body ?? {}) as Record<string, unknown>;
  const nasLinkId = payload.nasLinkId;

  if (!isUuid(nasLinkId)) {
    return NextResponse.json(
      { error: "nasLinkId는 UUID여야 합니다." },
      { status: 400, headers: NO_STORE }
    );
  }

  if (payload.action === "REVOKE") {
    const revoked = await revokeCustomerLink(nasLinkId);
    // 이미 회수된 것을 다시 회수해도 성공으로 답한다 — 재시도가 오류가 되면
    // 안 된다. 실제로 바뀌었는지는 revoked로 알려준다.
    return NextResponse.json({ ok: true, revoked }, { headers: NO_STORE });
  }

  if (payload.action !== "CREATE") {
    return NextResponse.json(
      { error: "action은 CREATE 또는 REVOKE여야 합니다." },
      { status: 400, headers: NO_STORE }
    );
  }

  const { token, customerDisplayName } = payload as {
    token?: unknown;
    customerDisplayName?: unknown;
  };

  if (typeof token !== "string" || token.length < 32) {
    return NextResponse.json(
      { error: "token이 없거나 너무 짧습니다." },
      { status: 400, headers: NO_STORE }
    );
  }

  if (
    typeof customerDisplayName !== "string" ||
    !customerDisplayName.trim() ||
    customerDisplayName.length > 200
  ) {
    return NextResponse.json(
      { error: "customerDisplayName이 올바르지 않습니다." },
      { status: 400, headers: NO_STORE }
    );
  }

  // 평문 토큰은 여기서 곧바로 해시로 바뀌고 어디에도 저장되지 않는다.
  await upsertCustomerLink({
    nasLinkId,
    customerDisplayName: customerDisplayName.trim(),
    tokenHash: sha256Hex(token),
  });

  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}

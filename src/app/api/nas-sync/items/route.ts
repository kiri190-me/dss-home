import { NextResponse } from "next/server";
import {
  replaceItemsForLink,
  type IncomingItem,
} from "@/lib/db/customer-repair-items";
import { findLinkByNasId } from "@/lib/db/repair-requests";
import { NO_STORE, requireNasSync } from "@/lib/server/nas-sync-auth";

/**
 * 사내가 한 고객사의 현황을 **통째로** 밀어 넣는 자리.
 *
 * ■ 왜 통째인가
 *
 * 바뀐 것만 보내면 **사라져야 하는 것**을 다루기 어렵다 — 출하 완료된 건,
 * 삭제된 접수. 증분이면 "지워라"를 따로 보내야 하고 그 메시지가 한 번
 * 유실되면 고객 화면에 출하된 물건이 영영 남는다. 통째로 교체하면 사라질
 * 것이 저절로 사라지고, 몇 번을 다시 보내도 결과가 같다.
 *
 * ■ 빈 목록도 정상이다
 *
 * `items: []`는 "이 고객은 지금 보여줄 것이 없다"이지 오류가 아니다. 진행 중인
 * 건이 전부 출하되면 실제로 이렇게 된다. 빈 배열을 거절하면 마지막 한 건이
 * 출하된 뒤에도 그 건이 화면에 남는다.
 *
 * ■ 여기서 판정하지 않는다
 *
 * 어느 건을 보낼지, 출하 완료인지, 견적서 번호가 무엇인지는 전부 사내가
 * 정한다. 그 판정을 여기서 하려면 워크플로와 내자정리를 밖으로 내보내야
 * 하는데, 그게 이 설계가 막으려는 것이다.
 */

const MAX_ITEMS = 1000;

function str(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

/** `YYYY-MM-DD`만 받는다. date 칸에 아무 글자나 넣으면 Postgres가 던진다. */
function isoDate(value: unknown): string | null {
  const text = str(value, 10);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export async function PUT(request: Request) {
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
  const { nasLinkId, items } = payload;

  if (!isUuid(nasLinkId)) {
    return NextResponse.json(
      { error: "nasLinkId는 UUID여야 합니다." },
      { status: 400, headers: NO_STORE }
    );
  }

  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: "items는 배열이어야 합니다." },
      { status: 400, headers: NO_STORE }
    );
  }

  if (items.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `한 번에 ${MAX_ITEMS}건까지만 보낼 수 있습니다.` },
      { status: 400, headers: NO_STORE }
    );
  }

  const link = await findLinkByNasId(nasLinkId);
  // 회수된 링크에도 넣지 않는다. 회수는 "이 주소를 더 못 쓴다"이므로 그 뒤에
  // 자료를 채워 넣을 이유가 없다.
  if (!link) {
    return NextResponse.json(
      { error: "알 수 없거나 회수된 링크입니다." },
      { status: 404, headers: NO_STORE }
    );
  }

  const parsed: IncomingItem[] = [];

  for (const raw of items) {
    const item = (raw ?? {}) as Record<string, unknown>;
    const sourceKind = item.sourceKind;

    if (sourceKind !== "CASE" && sourceKind !== "REQUEST") {
      return NextResponse.json(
        { error: "sourceKind는 CASE 또는 REQUEST여야 합니다." },
        { status: 400, headers: NO_STORE }
      );
    }
    if (!isUuid(item.sourceId)) {
      return NextResponse.json(
        { error: "sourceId는 UUID여야 합니다." },
        { status: 400, headers: NO_STORE }
      );
    }

    parsed.push({
      sourceKind,
      sourceId: item.sourceId,
      intakeNumber: str(item.intakeNumber, 50),
      modelName: str(item.modelName, 200),
      lotNumber: str(item.lotNumber, 200),
      serialNumber: str(item.serialNumber, 200),
      receivedAt: isoDate(item.receivedAt),
      statusLabel: str(item.statusLabel, 100),
      statusNote: str(item.statusNote, 1000),
      quoteNumber: str(item.quoteNumber, 100),
      quoteIssuedDate: isoDate(item.quoteIssuedDate),
    });
  }

  const stored = await replaceItemsForLink(link.id, parsed);

  return NextResponse.json({ ok: true, stored }, { headers: NO_STORE });
}

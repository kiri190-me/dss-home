import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { db } from "./connection";
import { customerRepairItems } from "./schema";

/**
 * 고객 현황 목록 조회와, 사내가 밀어 넣는 통째 교체.
 *
 * "server-only"를 붙이지 않는다 — connection.ts와 같은 이유로 스크립트가
 * 직접 부를 수 있어야 한다. 브라우저로 새는 것은 postgres.js를 끌고 오는 것이
 * 실질적으로 막는다.
 */

export type CustomerRepairItem = {
  id: string;
  sourceKind: string;
  intakeNumber: string | null;
  modelName: string | null;
  lotNumber: string | null;
  serialNumber: string | null;
  receivedAt: string | null;
  statusLabel: string | null;
  statusNote: string | null;
  quoteNumber: string | null;
  quoteIssuedDate: string | null;
};

/**
 * 한 화면에 내려보내는 최대 줄 수.
 *
 * 상한이 없으면 접수 건이 많은 고객사에서 한 번에 수백 줄이 나가고, 그건
 * 화면이 느려지는 문제이기 이전에 **밖으로 나가는 자료의 양** 문제다.
 * 넘치면 "검색으로 좁혀 달라"고 안내한다.
 */
export const ITEM_PAGE_LIMIT = 200;

/**
 * 그 고객사가 볼 목록.
 *
 * ■ 검색은 서버에서 한다
 *
 * 전부 내려보내고 브라우저에서 거르면, 화면에 띄우지도 않은 줄까지 고객
 * 브라우저로 나간다. 목록 자체가 사내 자료라 "안 보이지만 받아는 갔다"는
 * 상태를 만들지 않는다.
 *
 * ■ 정렬
 *
 * 접수 전 의뢰(REQUEST)를 맨 위에, 그다음 접수일 최신순. 방금 넣은 의뢰가
 * 맨 위에 보여야 고객이 "들어갔구나"를 안다.
 */
export async function listItemsForLink(
  customerLinkId: string,
  query: string
): Promise<{ items: CustomerRepairItem[]; truncated: boolean }> {
  const trimmed = query.trim();

  // LIKE의 특수문자를 막는다. 이스케이프하지 않으면 '%'만 넣어도 전부가
  // 걸리고, '_'는 아무 한 글자와 맞는다 — 검색이 아니라 목록 전체 열람이 된다.
  const pattern = trimmed
    ? `%${trimmed.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`)}%`
    : null;

  const rows = await db
    .select({
      id: customerRepairItems.id,
      sourceKind: customerRepairItems.sourceKind,
      intakeNumber: customerRepairItems.intakeNumber,
      modelName: customerRepairItems.modelName,
      lotNumber: customerRepairItems.lotNumber,
      serialNumber: customerRepairItems.serialNumber,
      receivedAt: customerRepairItems.receivedAt,
      statusLabel: customerRepairItems.statusLabel,
      statusNote: customerRepairItems.statusNote,
      quoteNumber: customerRepairItems.quoteNumber,
      quoteIssuedDate: customerRepairItems.quoteIssuedDate,
    })
    .from(customerRepairItems)
    .where(
      and(
        eq(customerRepairItems.customerLinkId, customerLinkId),
        pattern
          ? or(
              sql`lower(${customerRepairItems.modelName}) LIKE ${pattern}`,
              sql`lower(${customerRepairItems.lotNumber}) LIKE ${pattern}`,
              sql`lower(${customerRepairItems.serialNumber}) LIKE ${pattern}`
            )
          : undefined
      )
    )
    // 접수 전(REQUEST)이 접수(CASE)보다 먼저 — 글자순으로 CASE < REQUEST라
    // 내림차순이면 REQUEST가 앞선다.
    .orderBy(
      desc(customerRepairItems.sourceKind),
      desc(customerRepairItems.receivedAt),
      asc(customerRepairItems.intakeNumber)
    )
    // 상한을 넘겼는지 알기 위해 하나를 더 읽는다.
    .limit(ITEM_PAGE_LIMIT + 1);

  return {
    items: rows.slice(0, ITEM_PAGE_LIMIT),
    truncated: rows.length > ITEM_PAGE_LIMIT,
  };
}

export type IncomingItem = {
  sourceKind: "CASE" | "REQUEST";
  sourceId: string;
  intakeNumber: string | null;
  modelName: string | null;
  lotNumber: string | null;
  serialNumber: string | null;
  receivedAt: string | null;
  statusLabel: string | null;
  statusNote: string | null;
  quoteNumber: string | null;
  quoteIssuedDate: string | null;
};

/**
 * 한 고객사의 현황을 **통째로 교체**한다.
 *
 * 지우고 넣는 것을 한 트랜잭션에 묶는 이유: 나누면 그 사이에 목록을 연 고객이
 * **빈 화면**을 본다. 자기 물건이 통째로 사라진 것처럼 보이는 화면이라,
 * 그 짧은 순간이 곧바로 전화가 된다.
 *
 * 몇 번을 다시 보내도 결과가 같다 — 그래서 사내는 실패했는지 확신하지 못할 때
 * 마음 놓고 다시 보낼 수 있고, 이 API에 잠금이 필요 없다.
 */
export async function replaceItemsForLink(
  customerLinkId: string,
  items: IncomingItem[]
): Promise<number> {
  return db.transaction(async (tx) => {
    await tx
      .delete(customerRepairItems)
      .where(eq(customerRepairItems.customerLinkId, customerLinkId));

    if (items.length === 0) return 0;

    await tx
      .insert(customerRepairItems)
      .values(items.map((item) => ({ ...item, customerLinkId })));

    return items.length;
  });
}

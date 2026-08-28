import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { sha256Hex } from "@/lib/crypto/hash";
import { db } from "./connection";
import { customerLinks, customerRepairItems, repairRequests } from "./schema";

/**
 * 공개 쪽 자료 접근. 화면과 API가 SQL을 직접 쓰지 않게 한 곳에 모은다.
 *
 * "server-only"를 붙이지 않는다 — connection.ts와 같은 이유다. 링크 발급
 * 스크립트(scripts/*.ts)가 이 모듈을 직접 부르는데, 그쪽은 Next 번들러 밖에서
 * 돌아 "react-server" 조건이 설정되지 않아 server-only가 곧바로 터진다.
 * 브라우저로 새는 것은 실질적으로 막혀 있다: 이 파일은 postgres.js를 끌고
 * 오므로 클라이언트 컴포넌트가 가져다 쓰면 빌드가 실패한다.
 */

export type ActiveLink = {
  id: string;
  customerDisplayName: string;
};

/**
 * 토큰으로 살아 있는 링크를 찾는다. 없거나 회수됐으면 null.
 *
 * 시간차 없는 비교(safeEqual)를 쓰지 않는다. 이건 문자열 대조가 아니라
 * **해시로 색인을 찾는 집합 조회**라, 걸리는 시간이 입력값에 따라 달라지지
 * 않는다. 오히려 전체 행을 훑어 하나씩 비교하는 쪽이 느리고 위험하다.
 * (dss-auth의 인가 코드·액세스 토큰 조회와 같은 방식이다.)
 */
export async function findActiveLinkByToken(
  token: string
): Promise<ActiveLink | null> {
  if (!token) return null;

  const [row] = await db
    .select({
      id: customerLinks.id,
      customerDisplayName: customerLinks.customerDisplayName,
    })
    .from(customerLinks)
    .where(
      and(
        eq(customerLinks.tokenHash, sha256Hex(token)),
        eq(customerLinks.isRevoked, false)
      )
    )
    .limit(1);

  return row ?? null;
}

/**
 * 새 의뢰의 값. drizzle이 표에서 뽑아 주는 타입을 그대로 쓴다 —
 * 칸이 40개를 넘어 손으로 옮겨 적으면 반드시 어긋난다.
 */
export type NewRepairRequest = typeof repairRequests.$inferInsert;

export async function insertRepairRequest(
  input: NewRepairRequest
): Promise<string> {
  const [row] = await db
    .insert(repairRequests)
    .values(input)
    .returning({ id: repairRequests.id });
  return row.id;
}

/**
 * 사내가 가져갈 것 = 아직 확인받지 못한 것. 오래된 순으로 준다.
 *
 * 칸을 하나씩 고르지 않고 표 전체를 내보낸 뒤 사내에 필요 없는 것만 덜어낸다.
 * 양식에 칸이 40개가 넘어 하나씩 적으면 새 칸을 더할 때마다 여기를 고치는
 * 것을 잊게 되고, 잊으면 **고객이 적은 내용이 사내에 도착하지 않는다** —
 * 조용히 일어나는 종류의 사고다.
 *
 * 덜어내는 것 둘: `customerLinkId`(공개 쪽 내부 id라 사내에서 쓸모없다.
 * 사내는 `nasLinkId`로 잇는다)와 `submitterIpHash`(남용 조사는 이 서버에서
 * 하고, 사내로 내보낼 이유가 없다).
 */
export async function listUnpulledRequests(limit: number) {
  const rows = await db
    .select({ request: repairRequests, nasLinkId: customerLinks.nasLinkId })
    .from(repairRequests)
    .innerJoin(customerLinks, eq(repairRequests.customerLinkId, customerLinks.id))
    .where(isNull(repairRequests.pulledAt))
    .orderBy(asc(repairRequests.submittedAt))
    .limit(limit);

  return rows.map(({ request, nasLinkId }) => {
    const { customerLinkId, submitterIpHash, ...rest } = request;
    void customerLinkId;
    void submitterIpHash;
    return { ...rest, nasLinkId };
  });
}

/**
 * 사내가 "받았다"고 알려온 것들에 표시한다.
 *
 * 이미 표시된 것을 다시 표시해도 무해하다 — 그래서 사내는 마음 놓고 재시도할
 * 수 있고, 이 API에 잠금이 필요 없다.
 */
export async function markRequestsPulled(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await db
    .update(repairRequests)
    .set({ pulledAt: new Date() })
    .where(and(inArray(repairRequests.id, ids), isNull(repairRequests.pulledAt)))
    .returning({ id: repairRequests.id });
  return rows.length;
}

/**
 * 사내가 링크를 심는다. 같은 `nasLinkId`를 다시 보내면 조용히 넘어간다 —
 * 밀어 넣기가 실패해 재시도될 때 오류가 나면 안 된다.
 */
export async function upsertCustomerLink(input: {
  nasLinkId: string;
  customerDisplayName: string;
  tokenHash: string;
}): Promise<void> {
  await db.insert(customerLinks).values(input).onConflictDoNothing({
    target: customerLinks.nasLinkId,
  });
}

/**
 * 사내가 알려준 연결용 id로 살아 있는 링크를 찾는다.
 *
 * 회수된 링크는 찾지 않는다 — 회수는 "이 주소를 더 못 쓴다"이므로 그 뒤에
 * 현황을 채워 넣을 이유가 없다.
 */
export async function findLinkByNasId(
  nasLinkId: string
): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: customerLinks.id })
    .from(customerLinks)
    .where(
      and(
        eq(customerLinks.nasLinkId, nasLinkId),
        eq(customerLinks.isRevoked, false)
      )
    )
    .limit(1);

  return row ?? null;
}

/**
 * 링크를 회수하고, **그 링크가 들고 있던 현황을 지운다.**
 *
 * 회수는 "이 주소는 이제 죽었다"는 뜻이다. 죽은 주소에 딸린 목록은 아무도
 * 읽을 수 없으므로 기능상 남겨 둘 이유가 없고, 남기면 **회사 밖 서버가
 * 쓰지도 않는 고객 자료를 계속 들고 있게 된다.** 이 사이트에 두는 자료는
 * 최소한이어야 한다.
 *
 * 링크 행 자체는 남긴다 — 이미 들어온 의뢰가 그 링크를 가리키고 있고,
 * "어느 주소로 들어온 의뢰인가"는 나중에 유출을 조사할 때 필요하다.
 */
export async function revokeCustomerLink(nasLinkId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .update(customerLinks)
      .set({ isRevoked: true, revokedAt: new Date() })
      .where(
        and(
          eq(customerLinks.nasLinkId, nasLinkId),
          eq(customerLinks.isRevoked, false)
        )
      )
      .returning({ id: customerLinks.id });

    if (rows.length === 0) return false;

    await tx
      .delete(customerRepairItems)
      .where(eq(customerRepairItems.customerLinkId, rows[0].id));

    return true;
  });
}

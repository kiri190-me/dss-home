import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * 고객사별 비밀 주소 — **사본**이다.
 *
 * ■ 주인은 A/S 시스템이다
 *
 * 링크는 사내에서 담당자가 진짜 고객사 목록을 보고 발급한다. 이 표는 그중
 * 공개 화면을 그리는 데 꼭 필요한 만큼만 받아 둔 사본이고, A/S 시스템이
 * **나가는 방향으로** 밀어 넣는다(사내로 들어오는 연결은 하나도 없다).
 *
 * ■ 진짜 고객사 id를 여기 두지 않는다
 *
 * `nasLinkId`는 A/S가 이 링크를 위해 발급한 **별도의 id**이지 `customers.id`가
 * 아니다. 공개 서버는 인터넷에 열려 있어 언젠가 털릴 수 있다고 가정해야 하고,
 * 그때 사내 고객사 식별자가 함께 새면 안 된다. 이 표에서 고객사에 대해 알 수
 * 있는 것은 화면에 띄울 이름 하나뿐이다.
 *
 * ■ 토큰 평문은 어디에도 저장하지 않는다
 *
 * sha256만 남긴다. 32바이트 난수라 사전 공격 대상이 아니므로 느린 해시가
 * 필요 없다(dss-auth `crypto/hash.ts`의 판단과 같다). 평문은 발급 순간 사람이
 * 한 번 보고 고객사에 전달할 뿐, 사내에도 여기에도 남지 않는다 — 즉 잃어버리면
 * 재발급만 가능하고 복구는 원리상 불가능하다.
 */
export const customerLinks = pgTable(
  "customer_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /**
     * A/S 시스템의 `customer_repair_links.id`. 두 쪽을 잇는 유일한 열쇠다.
     * unique라 같은 링크를 두 번 밀어 넣어도 하나로 유지된다 — 밀어 넣기를
     * 마음 놓고 재시도할 수 있어야 한다.
     */
    nasLinkId: uuid("nas_link_id").notNull().unique(),

    /** 화면에 "○○ 주식회사 수리 의뢰"로 띄울 이름. 이것 말고는 모른다. */
    customerDisplayName: text("customer_display_name").notNull(),

    /** sha256(토큰) hex. 조회는 이 값으로 한다. */
    tokenHash: text("token_hash").notNull().unique(),

    /**
     * 회수 여부. 행을 지우지 않고 표시만 하는 이유: 이미 들어온 의뢰가 이
     * 링크를 가리키고 있고, "어느 링크로 들어온 의뢰인가"는 나중에 유출을
     * 조사할 때 필요한 정보다.
     */
    isRevoked: boolean("is_revoked").notNull().default(false),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("customer_links_nas_link_id_idx").on(table.nasLinkId)]
);

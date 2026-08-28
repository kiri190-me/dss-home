import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { customerLinks } from "./customer-links";

/**
 * 고객사에게 보여줄 현황 — 사내가 밀어 넣는 **스냅샷**이다.
 *
 * ■ 여기서 아무것도 계산하지 않는다
 *
 * 어느 건을 보여줄지, 출하 완료됐는지, 견적서 번호가 무엇인지는 전부 사내에서
 * 판정해 완성된 형태로 온다. 공개 쪽은 받아서 그리기만 한다. 판정을 여기서
 * 다시 하려면 워크플로 단계와 내자정리까지 밖으로 내보내야 하는데, 그건
 * 이 설계가 막으려는 바로 그것이다.
 *
 * ■ 고객사별로 통째로 교체된다
 *
 * 사내가 "이 고객이 지금 봐야 할 목록"을 통째로 보내고, 그 링크의 행을
 * 트랜잭션 안에서 지우고 새로 넣는다. 바뀐 것만 보내지 않는 이유는
 * **사라져야 하는 것** 때문이다 — 출하 완료된 건, 삭제된 접수. 증분이면
 * "지워라"를 따로 보내야 하고 그 메시지가 한 번 유실되면 고객 화면에
 * 출하된 물건이 영영 남는다. 통째로 교체하면 사라질 것이 저절로 사라지고
 * 몇 번을 다시 보내도 결과가 같다.
 *
 * ■ 나가지 않는 것
 *
 * 금액(견적 공급가·부품 단가), 사내 진단 내용, 점검 결과, 워크플로 단계,
 * 담당 엔지니어, 사내 메모, 첨부파일. 이 표에 그런 칸이 없다는 것이
 * 그 약속을 지키는 방법이다.
 */
export const customerRepairItems = pgTable(
  "customer_repair_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    customerLinkId: uuid("customer_link_id")
      .notNull()
      .references(() => customerLinks.id, { onDelete: "cascade" }),

    /**
     * `CASE` = 사내 접수 건, `REQUEST` = 아직 접수로 바뀌지 않은 의뢰.
     *
     * 접수 전 의뢰도 보여주는 이유: 고객이 방금 넣은 의뢰가 목록에 없으면
     * "안 들어갔나" 하고 다시 넣거나 전화한다.
     */
    sourceKind: text("source_kind").notNull(),
    /** 사내 쪽 id(접수 또는 의뢰). 종류와 짝지어 유일하다. */
    sourceId: uuid("source_id").notNull(),

    /** 접수번호. 아직 접수 전이면 null → 화면에 "접수 전". */
    intakeNumber: text("intake_number"),

    // ── 검색 대상 ──
    modelName: text("model_name"),
    lotNumber: text("lot_number"),
    serialNumber: text("serial_number"),

    /** 접수일(의뢰면 제출일). */
    receivedAt: date("received_at"),

    /**
     * 고객 안내 상태 — 담당자가 손으로 정한 값이고 **실제 진행과 다를 수 있다.**
     *
     * 사내 상태 코드가 아니라 화면에 그대로 쓸 **글자**를 받는다. 코드를 받아
     * 여기서 이름표로 바꾸면 그 대응표가 두 저장소에 생기고, 관리자가 사내에서
     * 이름을 고쳐도 고객 화면은 옛 이름을 계속 보여준다.
     */
    statusLabel: text("status_label"),
    /** 비고. */
    statusNote: text("status_note"),

    // ── 견적 정보 (내자정리에서 사내가 읽어 보낸다) ──
    quoteNumber: text("quote_number"),
    quoteIssuedDate: date("quote_issued_date"),

    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "customer_repair_items_source_kind_check",
      sql`${table.sourceKind} IN ('CASE', 'REQUEST')`
    ),
    /**
     * 같은 건이 **한 목록 안에서** 두 줄로 보이지 않게 한다.
     *
     * ⚠️ 링크를 빼고 (종류, 사내 id) 만으로 잡았다가 실제로 터졌다. 고객사
     * 하나에 링크 행이 둘 이상 남아 있으면(재발급했는데 옛 링크가 회수되지
     * 않은 경우) 같은 접수가 두 링크에 걸린다. 통째 교체는 **그 링크의 행만**
     * 지우므로, 남아 있는 다른 링크의 행과 부딪혀 삽입이 통째로 실패했다.
     *
     * 제약의 본래 뜻은 "한 고객이 보는 목록에 같은 건이 두 번 뜨지 않는다"
     * 이므로 링크를 포함하는 것이 맞다. 링크가 여럿 남는 것 자체는 회수가
     * 제대로 전달되면 생기지 않지만, 그때도 현황 내보내기가 멈추지는 않아야
     * 한다 — 안전장치가 기능을 멈추게 하면 안 된다.
     */
    uniqueIndex("customer_repair_items_link_source_unique").on(
      table.customerLinkId,
      table.sourceKind,
      table.sourceId
    ),
    // 목록 화면이 매번 도는 조회.
    index("customer_repair_items_link_received_idx").on(
      table.customerLinkId,
      table.receivedAt
    ),
    /*
     * 검색용 색인 셋.
     *
     * 대소문자를 가리지 않고 찾으려면 조회가 lower(칸)을 쓰는데, 그러면 평범한
     * 색인은 쓰이지 않는다. 식(expression) 색인이라야 조회와 모양이 맞는다.
     */
    index("customer_repair_items_model_lower_idx").on(sql`lower(model_name)`),
    index("customer_repair_items_lot_lower_idx").on(sql`lower(lot_number)`),
    index("customer_repair_items_serial_lower_idx").on(sql`lower(serial_number)`),
  ]
);

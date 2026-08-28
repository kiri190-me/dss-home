import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customerLinks } from "./customer-links";

/**
 * 고객사가 넣은 수리 의뢰.
 *
 * ■ 회사의 실제 양식을 그대로 옮겼다
 *
 * 칸 구성은 「수리의뢰서.xlsx」(제목: "RF Matcher 점검 및 수리 접수")를 따른다.
 * 지금까지 그 엑셀을 메일로 주고받던 것을 이 표가 대신한다. 칸 이름을 임의로
 * 바꾸거나 줄이지 않은 이유: 담당자와 고객사가 이미 그 양식으로 대화하고
 * 있어서, 화면과 종이가 다르면 두 번 설명해야 한다.
 *
 * 양식에 없는 칸은 만들지 않았다. 하나만 예외로 이메일을 두었는데(양식에는
 * 연락처만 있다) 회신 수단이 전화뿐이면 곤란해서이고, 그래서 선택 항목이다.
 * 「접수 신청일」은 묻지 않는다 — 웹은 언제 보냈는지 이미 안다(submittedAt).
 *
 * ■ 이것은 접수(A/S의 repair_cases)가 아니다
 *
 * 접수에는 workflowType과 billingType이 필수인데 이건 상업적 판단이라 고객이
 * 알 수 없다. 이 표는 **담당자가 옮겨 적을 내용을 고객이 대신 채워 준 것**
 * 이고, 접수로 만드는 것은 사내에서 사람이 한다.
 *
 * ■ 필수는 여덟 칸이다
 *
 * 회사명·담당자·연락처·Model·L/N·S/N·END USER·고장 증상.
 *
 * L/N·S/N·END USER를 필수로 둔 이유: 이 셋이 없으면 어느 물건인지 특정할 수
 * 없어 담당자가 결국 전화를 걸어야 한다. 그리고 접수(repair_cases)는 물건을
 * products 행 하나로 잡는데 그 열쇠가 모델명+L/N+S/N이라, 셋이 갖춰져야
 * 의뢰가 접수로 곧장 이어진다.
 *
 * 그 밖의 Power·Position 값은 선택으로 둔다. 모르는 고객이 그것 때문에
 * 의뢰를 못 보내면 결국 전화로 돌아가게 되어 이 화면을 만든 이유가 사라진다.
 *
 * ■ 개인정보
 *
 * 이름·전화·메일·주소가 들어온다. **회사 밖 호스팅에 놓이는 개인정보**라
 * 사내 자료보다 더 조심해야 한다: 로그에 절대 남기지 않고, 사내가 가져간 뒤
 * 보관 기한이 지나면 지운다.
 */
export const repairRequests = pgTable(
  "repair_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    customerLinkId: uuid("customer_link_id")
      .notNull()
      .references(() => customerLinks.id, { onDelete: "restrict" }),

    /**
     * 어느 양식으로 받은 의뢰인가.
     *
     * 지금은 RF(Matcher·Generator) 하나뿐이지만, 회사는 Cryogenic과 Vacuum도
     * 다루고 그쪽은 Power·Position 같은 칸이 의미가 없다. 나중에 양식이
     * 갈릴 때 이 칸이 있으면 표를 새로 만들지 않고 늘릴 수 있다.
     *
     * pgEnum을 쓰지 않는다 — enum 값은 나중에 뺄 수 없다(A/S 시스템이 실제로
     * 겪은 함정이다). 문자열 + check가 같은 일을 하면서 되돌릴 수 있다.
     */
    formKind: text("form_kind").notNull().default("RF"),

    // ───── 고객 정보 ─────
    /** 회사명. 링크가 가리키는 고객사 이름으로 미리 채워 두되 고칠 수 있다. */
    companyName: text("company_name").notNull(),
    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),
    /** 양식에는 없다. 회신 수단이 전화뿐이면 곤란해 선택으로 둔다. */
    contactEmail: text("contact_email"),

    // ───── 수리 의뢰 품 정보 ─────
    productModelName: text("product_model_name").notNull(),
    lotNumber: text("lot_number").notNull(),
    serialNumber: text("serial_number").notNull(),
    endUser: text("end_user").notNull(),
    /** 반출지(주소). */
    returnAddress: text("return_address"),

    // ───── 설비 RF System 정보 ─────
    /** Chamber 정보. */
    chamberInfo: text("chamber_info"),

    /*
     * 양식의 표는 PC1·PC2·PC3 세 줄 × (Generator L/N·Model, Matcher L/N·Model)
     * 네 칸이다. jsonb 하나로 접지 않고 칸을 펼쳐 둔 이유: 종이 양식이 정확히
     * 세 줄이라 늘어날 여지가 지금은 없고, 펼쳐 두면 사내 화면에서 그대로
     * 보여줄 수 있으며 밖에서 온 JSON의 모양을 검사할 일도 없다.
     */
    pc1GeneratorLotNumber: text("pc1_generator_lot_number"),
    pc1GeneratorModel: text("pc1_generator_model"),
    pc1MatcherLotNumber: text("pc1_matcher_lot_number"),
    pc1MatcherModel: text("pc1_matcher_model"),
    pc2GeneratorLotNumber: text("pc2_generator_lot_number"),
    pc2GeneratorModel: text("pc2_generator_model"),
    pc2MatcherLotNumber: text("pc2_matcher_lot_number"),
    pc2MatcherModel: text("pc2_matcher_model"),
    pc3GeneratorLotNumber: text("pc3_generator_lot_number"),
    pc3GeneratorModel: text("pc3_generator_model"),
    pc3MatcherLotNumber: text("pc3_matcher_lot_number"),
    pc3MatcherModel: text("pc3_matcher_model"),

    // ───── 고장내용의 대한 상세정보 ─────
    alarmName: text("alarm_name"),
    symptomDescription: text("symptom_description").notNull(),
    /** 공정사용 시 출력Power — Source Fwd / Source Ref. */
    processSourcePower: text("process_source_power"),
    /** 공정사용 시 출력Power — Bias Fwd / Bias Ref. */
    processBiasPower: text("process_bias_power"),
    /** Issue 발생 시 출력Power — Fwd / Ref. */
    issuePower: text("issue_power"),
    /** 정상 동작 시 Position — Tune / Load. */
    normalPosition: text("normal_position"),
    /** Issue 발생 시 Position — Tune / Load. */
    issuePosition: text("issue_position"),
    /** 고객사측에서 점검 및 조치한 사항. */
    customerActions: text("customer_actions"),

    // ───── 고객사측 추가 확인 사항 (양식의 ①~⑥) ─────
    // 번호가 아니라 내용으로 이름을 붙인다. q1/q2로 두면 나중에 양식에서
    // 질문 하나가 빠질 때 번호가 밀려 옛 자료의 뜻이 통째로 달라진다.
    /** ① 특정 공정에서만 발생하는지 + 이슈 발생 인가 Power 값. */
    issueProcessScope: text("issue_process_scope"),
    /** ② 간헐적으로 발생하는지 + 빈도(%). */
    issueIntermittency: text("issue_intermittency"),
    /** ③ 초기 setup 중인지 기존 사용 중인지. */
    issueTiming: text("issue_timing"),
    /** ④ 공정 조건이 새 조건인지 기존 조건인지. */
    issueProcessCondition: text("issue_process_condition"),
    /** ⑤ 전체 설비(Chamber) 대수 및 이슈 발생 대수. */
    chamberCounts: text("chamber_counts"),
    /** ⑥ 고객사(장치업체)측에서 점검한 사항 상세. */
    customerInspectionDetail: text("customer_inspection_detail"),

    // ───── 살림 ─────
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    /**
     * IP **원문이 아니라 sha256**을 남긴다.
     *
     * 남용을 조사할 때 필요한 것은 "같은 곳에서 여러 번인가"이지 그 주소가
     * 어디인지가 아니다. 해시만 두면 그 질문에는 답하면서, 이름·전화번호와
     * 나란히 원문 IP를 들고 있지 않게 된다.
     */
    submitterIpHash: text("submitter_ip_hash"),

    /**
     * 사내가 가져갔다고 **확인해 준** 시각. null이면 아직 안 가져간 것이다.
     *
     * 이 칸 하나가 전달 방식의 핵심이다. "번호 다음부터" 같은 커서를 쓰면
     * 번호나 시계가 한 번 어긋날 때 그 사이의 의뢰를 조용히 건너뛰고, 건너뛴
     * 것은 아무도 모른다 — 고객이 넣은 의뢰가 소리 없이 사라지는 것이 이
     * 기능에서 가장 나쁜 실패다. 안 가져간 것을 계속 내주고 확인받은 뒤에만
     * 표시하면 잃어버릴 수가 없다. 대신 같은 건을 두 번 받을 수 있는데,
     * 그건 사내 표의 unique가 흡수한다. **잃는 것보다 겹치는 편이 낫다.**
     */
    pulledAt: timestamp("pulled_at", { withTimezone: true }),
  },
  (table) => [
    check("repair_requests_form_kind_check", sql`${table.formKind} IN ('RF')`),
    /**
     * 당겨오기가 매번 도는 조회다 — 아직 안 가져간 것을 오래된 순으로.
     * 가져간 행은 다시 조회되지 않으므로 부분 인덱스로 둔다. 시간이 지나면
     * 이 색인은 거의 비어 있게 된다.
     */
    index("repair_requests_unpulled_idx")
      .on(table.submittedAt)
      .where(sql`pulled_at IS NULL`),
    index("repair_requests_customer_link_id_idx").on(table.customerLinkId),
  ]
);

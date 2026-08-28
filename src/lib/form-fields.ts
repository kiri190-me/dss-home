/**
 * 수리 의뢰서의 칸 목록 — 화면과 저장이 같은 표를 본다.
 *
 * 「수리의뢰서.xlsx」(제목: "RF Matcher 점검 및 수리 접수")의 구성을 그대로
 * 옮겼다. 칸이 40개에 가까워, 화면은 화면대로 적고 저장은 저장대로 적으면
 * 반드시 어긋난다 — 그리고 어긋나면 **고객이 적은 내용이 조용히 버려진다.**
 * 그래서 목록을 한 곳에 두고 양쪽이 이걸 읽는다.
 *
 * server-only를 붙이지 않는다. 순수한 표이고 화면(서버 컴포넌트)과 서버
 * 액션이 함께 읽는다.
 */

/** DB 칸 이름 = 폼의 name. 둘을 같게 두면 옮겨 적을 일이 없다. */
export type FieldName =
  | "companyName"
  | "contactName"
  | "contactPhone"
  | "contactEmail"
  | "productModelName"
  | "lotNumber"
  | "serialNumber"
  | "endUser"
  | "returnAddress"
  | "chamberInfo"
  | "pc1GeneratorLotNumber"
  | "pc1GeneratorModel"
  | "pc1MatcherLotNumber"
  | "pc1MatcherModel"
  | "pc2GeneratorLotNumber"
  | "pc2GeneratorModel"
  | "pc2MatcherLotNumber"
  | "pc2MatcherModel"
  | "pc3GeneratorLotNumber"
  | "pc3GeneratorModel"
  | "pc3MatcherLotNumber"
  | "pc3MatcherModel"
  | "alarmName"
  | "symptomDescription"
  | "processSourcePower"
  | "processBiasPower"
  | "issuePower"
  | "normalPosition"
  | "issuePosition"
  | "customerActions"
  | "issueProcessScope"
  | "issueIntermittency"
  | "issueTiming"
  | "issueProcessCondition"
  | "chamberCounts"
  | "customerInspectionDetail";

/**
 * 반드시 있어야 하는 여덟.
 *
 * L/N·S/N·END USER가 여기 있는 이유: 이 셋이 없으면 어느 물건인지 특정할 수
 * 없어 담당자가 결국 전화를 걸어야 하고, 접수(repair_cases)가 물건을 잡는
 * 열쇠가 모델명+L/N+S/N이라 셋이 갖춰져야 의뢰가 접수로 곧장 이어진다.
 *
 * 이보다 늘리지 않는다. Power나 Position 값을 모르는 고객이 그것 때문에
 * 의뢰를 못 보내면 결국 전화로 돌아가게 되고, 그러면 이 화면을 만든 이유가
 * 사라진다. 모르는 칸은 비워 두고 보내면 담당자가 물으면 된다.
 */
export const REQUIRED_FIELDS = [
  "companyName",
  "contactName",
  "contactPhone",
  "productModelName",
  "lotNumber",
  "serialNumber",
  "endUser",
  "symptomDescription",
] as const satisfies readonly FieldName[];

/** 긴 글이 들어오는 칸. 화면에서 여러 줄 상자로 그린다. */
export const LONG_TEXT_FIELDS = [
  "symptomDescription",
  "customerActions",
  "issueProcessScope",
  "issueIntermittency",
  "issueTiming",
  "issueProcessCondition",
  "chamberCounts",
  "customerInspectionDetail",
  "returnAddress",
] as const satisfies readonly FieldName[];

const LONG_TEXT_SET = new Set<string>(LONG_TEXT_FIELDS);

/**
 * 칸의 길이 상한.
 *
 * 없으면 한 번의 제출로 DB를 채울 수 있다. 여러 줄 칸은 넉넉히, 한 줄 칸은
 * 좁게 잡는다 — 모델명이 2000자일 이유가 없다.
 *
 * 칸마다 숫자를 따로 적지 않는 이유: 40개 가까운 목록을 손으로 유지하면 새
 * 칸을 더할 때 빠뜨리게 되고, 빠뜨린 칸은 상한이 없는 채로 열린다.
 */
export function maxLength(name: FieldName): number {
  return LONG_TEXT_SET.has(name) ? 4000 : 200;
}

/** 화면에 그릴 순서와 이름. 종이 양식의 묶음을 그대로 따른다. */
export type FieldSpec = {
  name: FieldName;
  label: string;
  /** 칸 아래 작게 붙는 설명. 양식에 적혀 있던 안내를 그대로 옮긴 것들이다. */
  hint?: string;
  type?: "tel" | "email";
};

export type FieldGroup = {
  legend: string;
  description?: string;
  /** 한 줄에 나란히 둘 칸들. 배열 하나가 한 줄이다. */
  rows: FieldSpec[][];
  /**
   * 처음에 접어 둘지. RF 기술 값처럼 아는 사람만 채우는 묶음을 접어 두면
   * 폼이 처음 열렸을 때의 길이가 절반 이하가 된다 — 길어서 포기하는 것이
   * 이 화면의 가장 큰 실패다.
   */
  collapsed?: boolean;
};

export const FIELD_GROUPS: FieldGroup[] = [
  {
    legend: "고객 정보",
    rows: [
      [{ name: "companyName", label: "회사명" }],
      [
        { name: "contactName", label: "담당자" },
        { name: "contactPhone", label: "연락처", type: "tel" },
      ],
      [
        {
          name: "contactEmail",
          label: "이메일",
          type: "email",
          hint: "적어 주시면 진행 상황을 메일로도 알려드립니다.",
        },
      ],
    ],
  },
  {
    legend: "수리 의뢰 품 정보",
    rows: [
      [
        {
          name: "productModelName",
          label: "Model",
          hint: "정확한 모델명을 모르시면 아시는 대로 적어 주세요.",
        },
      ],
      [
        { name: "lotNumber", label: "L/N" },
        { name: "serialNumber", label: "S/N" },
      ],
      [{ name: "endUser", label: "END USER" }],
      [{ name: "returnAddress", label: "반출지(주소)" }],
    ],
  },
  {
    legend: "고장 내용",
    rows: [
      [{ name: "alarmName", label: "Alarm명" }],
      [{ name: "symptomDescription", label: "고장 증상" }],
      [{ name: "customerActions", label: "고객사측에서 점검 및 조치한 사항" }],
    ],
  },
  {
    legend: "설비 RF System 정보",
    description:
      "이슈가 발생한 설비의 RF System 정보입니다. 아시는 만큼만 적어 주세요.",
    collapsed: true,
    rows: [
      [{ name: "chamberInfo", label: "Chamber" }],
      [
        { name: "pc1GeneratorLotNumber", label: "PC1 Generator L/N" },
        { name: "pc1GeneratorModel", label: "PC1 Generator Model" },
        { name: "pc1MatcherLotNumber", label: "PC1 Matcher L/N" },
        { name: "pc1MatcherModel", label: "PC1 Matcher Model" },
      ],
      [
        { name: "pc2GeneratorLotNumber", label: "PC2 Generator L/N" },
        { name: "pc2GeneratorModel", label: "PC2 Generator Model" },
        { name: "pc2MatcherLotNumber", label: "PC2 Matcher L/N" },
        { name: "pc2MatcherModel", label: "PC2 Matcher Model" },
      ],
      [
        { name: "pc3GeneratorLotNumber", label: "PC3 Generator L/N" },
        { name: "pc3GeneratorModel", label: "PC3 Generator Model" },
        { name: "pc3MatcherLotNumber", label: "PC3 Matcher L/N" },
        { name: "pc3MatcherModel", label: "PC3 Matcher Model" },
      ],
    ],
  },
  {
    legend: "Power · Position 값",
    description: "계측값을 아시면 적어 주세요. 진단이 훨씬 빨라집니다.",
    collapsed: true,
    rows: [
      [
        {
          name: "processSourcePower",
          label: "공정사용 시 출력 Power (Source)",
          hint: "Source Fwd Power / Source Ref Power",
        },
        {
          name: "processBiasPower",
          label: "공정사용 시 출력 Power (Bias)",
          hint: "Bias Fwd Power / Bias Ref Power",
        },
      ],
      [
        {
          name: "issuePower",
          label: "Issue 발생 시 출력 Power",
          hint: "Fwd Power / Ref Power",
        },
      ],
      [
        {
          name: "normalPosition",
          label: "정상 동작 시 Position",
          hint: "Tune Position / Load Position",
        },
        {
          name: "issuePosition",
          label: "Issue 발생 시 Position",
          hint: "Tune Position / Load Position",
        },
      ],
    ],
  },
  {
    legend: "추가 확인 사항",
    description:
      "진단에 크게 도움이 되는 항목입니다. 아시는 것만 적어 주셔도 됩니다.",
    collapsed: true,
    rows: [
      [
        {
          name: "issueProcessScope",
          label:
            "① 전체 공정 중 특정 공정에서만 문제가 발생하는지? 이슈 발생되는 인가 Power 값",
        },
      ],
      [
        {
          name: "issueIntermittency",
          label: "② 상기 현상이 간헐적으로 발생하는지? 발생 빈도수(%)",
        },
      ],
      [
        {
          name: "issueTiming",
          label: "③ Issue 발생 시기가 초기 setup 중인지, 기존 사용중인지",
        },
      ],
      [
        {
          name: "issueProcessCondition",
          label: "④ Issue 발생 공정 조건이 새로운 조건인지, 기존 사용중인 조건인지",
        },
      ],
      [
        {
          name: "chamberCounts",
          label: "⑤ 전체 설비(Chamber) 대수 및 Issue 발생 설비 대수",
        },
      ],
      [
        {
          name: "customerInspectionDetail",
          label: "⑥ 고객사(장치업체)측에서 점검한 사항 상세",
          hint: "예: 파라메터 확인, 배선 확인 등",
        },
      ],
    ],
  },
];

/** 화면이 그리는 모든 칸. 저장 쪽이 이 목록을 돌며 값을 읽는다. */
export const ALL_FIELDS: FieldSpec[] = FIELD_GROUPS.flatMap((group) =>
  group.rows.flat()
);

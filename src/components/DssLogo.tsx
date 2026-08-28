/**
 * 회사 로고.
 *
 * 원본(dss21.com/images/logo.png)의 구성을 그대로 따른다 — 왼쪽에 표식
 * (파랑·흰색·빨강 정사각형 셋을 세로로 쌓은 것), 오른쪽에 두 줄
 * "(주)디에스에스 / DSS Co., Ltd.".
 *
 * ■ 왜 원본 PNG를 가져다 쓰지 않는가
 *
 * 그 파일은 28KB짜리 비트맵이라 고해상도 화면에서 글자가 뭉개지고, 흰 바탕이
 * 구워져 있어 어두운 배경 위에 흰 사각형으로 뜬다(꼬리말에서 실제로 그렇게
 * 된다). 표식은 사각형 셋뿐이라 SVG가 정확하고, 글자는 웹폰트로 두면 어느
 * 크기에서나 또렷하다.
 *
 * ■ 치수는 dss-auth와 같은 값이다
 *
 * 간격은 한 변의 9%, 가운데 칸 테두리는 한 변의 5.5%. 로그인 포털의
 * DssLogo와 같은 표식이어야 두 사이트를 오갈 때 같은 회사로 보인다.
 * 한쪽을 고치면 다른 쪽도 고쳐야 한다.
 */

const BLUE = "#0000CC";
const RED = "#EE0000";
const BORDER = "#A8A8A8";

/**
 * 가운데 칸 테두리는 화면 픽셀로 고정한다(non-scaling-stroke).
 *
 * 비율(한 변의 5.5%)로 두면 작은 크기에서 사라진다 — 머리말의 표식은 높이가
 * 36px이라 테두리가 5.5 × 36/318 ≈ 0.6px가 되고, 서브픽셀이라 브라우저가
 * 거의 칠하지 않는다. 실제로 로고가 사각형 셋이 아니라 **둘로 보였다.**
 * 흰 칸은 흰 바탕에 묻히므로 테두리가 사라지면 칸 자체가 사라진다.
 *
 * 화면 픽셀로 고정하면 어느 크기에서나 또렷한 선 하나가 남는다. 원본 로고의
 * 테두리도 가는 회색 선이라 인상이 어긋나지 않는다.
 */
const STROKE_PX = 1.25;

/** 표식만. 꼬리말처럼 글자를 따로 앉히는 자리에서 쓴다. */
export function DssMark({ className = "h-11" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 318"
      className={`${className} w-auto shrink-0`}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width="100" height="100" fill={BLUE} />
      {/*
        가운데는 속이 빈 사각형이다. 다른 두 칸과 똑같은 100×100으로 두고
        선만 얹는다 — stroke가 선 가운데를 기준으로 퍼져 0.6px가 밖으로
        나가지만, 그 정도는 눈에 띄지 않고 대신 세 칸의 크기가 정확히 같다.
      */}
      <rect
        x="0"
        y="109"
        width="100"
        height="100"
        fill="#FFFFFF"
        stroke={BORDER}
        strokeWidth={STROKE_PX}
        vectorEffect="non-scaling-stroke"
      />
      <rect x="0" y="218" width="100" height="100" fill={RED} />
    </svg>
  );
}

/**
 * 표식 + 글자.
 *
 * `tone`은 배경에 따라 글자색만 바꾼다. 표식의 세 색은 어느 배경에서도
 * 그대로다 — 브랜드 색을 배경에 맞춰 고쳐 쓰기 시작하면 그건 더 이상
 * 회사 로고가 아니다.
 */
export default function DssLogo({
  tone = "dark",
}: {
  /** dark = 밝은 배경용 짙은 글자, light = 어두운 배경용 흰 글자 */
  tone?: "dark" | "light";
}) {
  const text = tone === "light" ? "text-white" : "text-[#0000CC]";
  const sub = tone === "light" ? "text-white/70" : "text-[#0000CC]/70";

  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <DssMark className="h-10 sm:h-11" />
      {/*
        좁은 화면에서는 영문 줄을 접는다. 머리말에 로고와 '사내 시스템'
        버튼과 메뉴 단추가 한 줄에 들어가야 하는데, 390px 폰에서 두 줄을
        다 펴면 셋을 합한 너비가 화면을 넘어 버튼이 잘린다. 회사를 알아보는
        데는 한글 이름과 표식이면 충분하다.
      */}
      <span className="flex min-w-0 flex-col leading-none">
        <span className={`truncate text-[15px] font-bold tracking-tight ${text}`}>
          (주)디에스에스
        </span>
        <span
          className={`mt-1 hidden text-[11px] font-semibold tracking-[0.12em] sm:block ${sub}`}
        >
          DSS Co., Ltd.
        </span>
      </span>
    </span>
  );
}

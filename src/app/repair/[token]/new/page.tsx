import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import LinkNotUsable from "@/components/LinkNotUsable";
import { findActiveLinkByToken } from "@/lib/db/repair-requests";
import {
  FIELD_GROUPS,
  LONG_TEXT_FIELDS,
  maxLength,
  REQUIRED_FIELDS,
  type FieldGroup,
  type FieldSpec,
} from "@/lib/form-fields";
import { submitRepairRequest } from "@/lib/server/submit-repair-request";
import { COMPANY } from "@/lib/site";

export const metadata: Metadata = {
  title: "수리 의뢰 | (주)DSS",
  // 이 주소가 검색에 잡히면 비밀 주소인 의미가 사라진다.
  robots: { index: false, follow: false },
};

/**
 * 고객사 전용 수리 의뢰 화면.
 *
 * ■ 이 주소를 아는 사람만 쓸 수 있다
 *
 * 계정도 공개 폼도 아니고, 고객사마다 다른 비밀 주소다. 담당자가 A/S
 * 시스템에서 발급해 고객사에 전달한다. 주소 자체가 열쇠이므로
 * `robots: noindex`로 검색 색인을 막는다.
 *
 * ■ 없는 주소와 회수된 주소를 구분해 알려주지 않는다
 *
 * 구분해 주면 토큰을 하나씩 대보며 "존재하는 것"을 찾아내는 도구가 된다.
 * 둘 다 같은 문구로 끝낸다.
 *
 * ■ 칸 목록을 여기 적지 않는다
 *
 * 「수리의뢰서.xlsx」의 칸이 40개에 가깝다. 화면과 저장이 각자 목록을 들면
 * 반드시 어긋나고, 어긋나면 고객이 적은 내용이 조용히 버려진다.
 * form-fields.ts 하나를 양쪽이 읽는다.
 *
 * ■ 자바스크립트를 쓰지 않는다
 *
 * 접히는 묶음은 <details>다. 폼이 길어 처음부터 다 펴면 포기하게 되는데,
 * 그걸 막자고 클라이언트 번들을 만들 이유는 없다. 부수 효과로 스크립트가
 * 실패해도 폼이 그대로 동작한다.
 */

const ERROR_MESSAGES: Record<string, string> = {
  missing: "별표(*) 표시된 칸은 반드시 적어 주세요.",
  too_long: "한 칸에 적으신 내용이 너무 깁니다. 조금 줄여서 다시 보내 주세요.",
  too_many:
    "의뢰가 짧은 시간에 많이 접수되었습니다. 잠시 후 다시 시도해 주세요.",
  invalid: "주소가 올바르지 않습니다.",
};

const REQUIRED = new Set<string>(REQUIRED_FIELDS);
const LONG = new Set<string>(LONG_TEXT_FIELDS);

/** 한 줄에 칸이 몇 개냐에 따른 배치. 클래스명은 전부 소스에 그대로 있어야 한다. */
const ROW_CLASS: Record<number, string> = {
  1: "",
  2: "grid gap-4 sm:grid-cols-2",
  3: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
};

export default async function RepairRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const link = await findActiveLinkByToken(token);

  if (!link) return <LinkNotUsable />;

  const message = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.invalid) : null;

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl px-5 py-12 md:py-16">
        <header>
          <p className="text-xs font-semibold tracking-[0.14em] text-dss-accent">
            RF MATCHER 점검 및 수리 접수
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
            수리 의뢰서
          </h1>
          <p className="mt-3 text-sm text-zinc-600">
            <span className="font-semibold text-zinc-900">
              {link.customerDisplayName}
            </span>{" "}
            전용 의뢰 주소입니다.
          </p>
          <p className="mt-4 rounded-lg bg-zinc-100 px-4 py-3 text-xs leading-relaxed text-zinc-600">
            <span className="text-red-600">*</span> 표시된 칸만 필수입니다.
            나머지는 <strong>아시는 만큼만</strong> 적어 주셔도 접수됩니다 —
            적어 주실수록 진단이 빨라집니다.
          </p>
        </header>

        {message ? (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {message}
          </p>
        ) : null}

        <form action={submitRepairRequest} className="mt-8 flex flex-col gap-5">
          <input type="hidden" name="token" value={token} />

          {FIELD_GROUPS.map((group) => (
            <Group
              key={group.legend}
              group={group}
              // 회사명은 링크가 가리키는 고객사 이름으로 미리 채운다. 우리가
              // 이미 아는 것을 다시 치게 하지 않는다. 장치업체 이름이 다르면
              // 고칠 수 있게 읽기 전용으로 두지는 않는다.
              defaults={{ companyName: link.customerDisplayName }}
            />
          ))}

          <button
            type="submit"
            className="mt-2 flex h-12 items-center justify-center rounded-lg bg-dss-navy px-4 text-[15px] font-semibold text-white transition-colors hover:bg-dss-navy-2"
          >
            수리 의뢰 보내기
          </button>

          <p className="text-center text-xs leading-relaxed text-zinc-500">
            보내주신 내용은 담당자가 확인한 뒤 연락드립니다.
            <br />
            급하신 경우 {COMPANY.tel} 로 전화 주세요.
          </p>
        </form>
      </main>

      <SiteFooter />
    </>
  );
}

function Group({
  group,
  defaults,
}: {
  group: FieldGroup;
  defaults: Partial<Record<string, string>>;
}) {
  const body = (
    <div className="flex flex-col gap-4">
      {group.description ? (
        <p className="text-xs leading-relaxed text-zinc-500">
          {group.description}
        </p>
      ) : null}
      {group.rows.map((row, index) => (
        <div
          key={index}
          // 클래스명을 문자열로 조립하지 않는다 — Tailwind는 빌드 때 소스를
          // 훑어 쓰인 클래스만 남기므로, 조립한 이름은 CSS에 존재하지 않게
          // 되어 화면이 조용히 한 칸으로 무너진다.
          className={ROW_CLASS[Math.min(row.length, 4)]}
        >
          {row.map((field) => (
            <Field
              key={field.name}
              field={field}
              defaultValue={defaults[field.name]}
            />
          ))}
        </div>
      ))}
    </div>
  );

  if (group.collapsed) {
    return (
      <details className="border border-zinc-200">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-bold text-zinc-900 hover:bg-zinc-50">
          <span className="mr-2 text-dss-accent" aria-hidden="true">
            ▸
          </span>
          {group.legend}
          <span className="ml-2 font-normal text-zinc-400">
            (선택 — 눌러서 펴기)
          </span>
        </summary>
        <div className="border-t border-zinc-200 p-5">{body}</div>
      </details>
    );
  }

  return (
    <fieldset className="border border-zinc-200 p-5">
      <legend className="px-2 text-sm font-bold text-zinc-900">
        {group.legend}
      </legend>
      {body}
    </fieldset>
  );
}

function Field({
  field,
  defaultValue,
}: {
  field: FieldSpec;
  defaultValue?: string;
}) {
  const required = REQUIRED.has(field.name);
  const long = LONG.has(field.name);
  const shared =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 text-[15px] text-zinc-900 outline-none focus-visible:border-dss-accent";

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium leading-snug text-zinc-700">
        {field.label} {required ? <span className="text-red-600">*</span> : null}
      </span>
      {long ? (
        <textarea
          name={field.name}
          required={required}
          rows={field.name === "symptomDescription" ? 5 : 3}
          maxLength={maxLength(field.name)}
          defaultValue={defaultValue}
          className={`${shared} py-2.5`}
        />
      ) : (
        <input
          name={field.name}
          type={field.type ?? "text"}
          required={required}
          maxLength={maxLength(field.name)}
          inputMode={field.type === "tel" ? "tel" : undefined}
          defaultValue={defaultValue}
          className={`${shared} h-11`}
        />
      )}
      {field.hint ? (
        <span className="text-xs text-zinc-500">{field.hint}</span>
      ) : null}
    </label>
  );
}

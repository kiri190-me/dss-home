/**
 * 개발용 링크 발급.
 *
 * ⚠️ **운영에서 링크를 만드는 곳은 여기가 아니다.** 진짜 발급은 A/S 시스템의
 * 고객사 관리 화면에서 담당자가 하고, 그 결과가 이 서버로 밀려 들어온다
 * (POST /api/nas-sync/customer-links). 그래야 링크가 진짜 고객사 목록과
 * 묶이고, 누가 언제 발급했는지가 사내에 남는다.
 *
 * 이 스크립트는 A/S 쪽이 아직 없는 동안 공개 화면을 확인하기 위한 것이다.
 * 그래서 `nasLinkId`도 그냥 난수로 만든다 — 사내에 대응하는 행이 없다.
 *
 * 사용법:
 *   npm run link:issue -- "테스트 고객사"
 */
import { randomUUID } from "node:crypto";
import { randomToken, sha256Hex } from "../src/lib/crypto/hash";
import { pgClient } from "../src/lib/db/connection";
import { upsertCustomerLink } from "../src/lib/db/repair-requests";

// 최상위 await를 쓰지 않는다 — 이 프로젝트는 package.json에 type:module이 없어
// tsx가 CJS로 변환하고, 그러면 최상위 await가 컴파일되지 않는다.
async function main() {
  const displayName = process.argv[2];

  if (!displayName) {
    console.error('사용법: npm run link:issue -- "고객사 이름"');
    process.exitCode = 1;
    return;
  }

  const token = randomToken();
  const nasLinkId = randomUUID();

  await upsertCustomerLink({
    nasLinkId,
    customerDisplayName: displayName,
    tokenHash: sha256Hex(token),
  });

  const base = process.env.PUBLIC_BASE_URL ?? "http://localhost:3200";

  console.log(`\n"${displayName}" 전용 주소를 만들었습니다.\n`);
  console.log(`  ${base}/repair/${token}\n`);
  // 평문 토큰은 DB에도 로그에도 남지 않는다. 이 출력이 유일하게 보이는
  // 순간이고, 잃어버리면 재발급만 가능하다 — 복구는 원리상 불가능하다.
  console.log("이 주소는 지금 한 번만 표시됩니다. 잃어버리면 다시 발급해야 합니다.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  // 열린 연결 풀이 있으면 postgres.js가 프로세스를 계속 살려둔다.
  .finally(() => pgClient.end());

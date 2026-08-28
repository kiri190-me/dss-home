import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * 비밀 문자열을 저장하거나 대조하기 전에 씌우는 해시.
 *
 * dss-auth의 같은 이름 파일에서 필요한 부분만 가져왔다. 비밀번호를 다루는
 * scrypt 쪽은 가져오지 않는다 — 여기에는 사람이 정하는 비밀번호가 없고,
 * 다루는 것은 전부 32바이트 난수다.
 *
 * 왜 해시하는가: 이 서버는 인터넷에 열려 있어 언젠가 DB 덤프가 샐 수 있다고
 * 가정해야 한다. 평문 토큰이 저장되어 있으면 그 덤프만으로 모든 고객사의
 * 의뢰 주소를 그대로 쓸 수 있다. 해시만 두면 덤프를 얻어도 쓸 수 없다.
 *
 * 느린 해시(scrypt/argon2)가 필요 없는 이유: 32바이트 난수는 사전 공격
 * 대상이 아니다. 사람이 고른 단어가 아니라 추측할 수 없는 값이라, 공격자가
 * 후보를 만들어 대볼 방법 자체가 없다.
 */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * 시간 차이로 정답을 알아내지 못하게 비교한다.
 *
 * 길이가 다르면 timingSafeEqual이 예외를 던지므로 먼저 확인한다.
 * (dss-auth와 A/S 시스템이 같은 이유로 같은 처리를 한다.)
 *
 * 이 함수는 **사내에서 오는 요청의 공유 비밀**을 대조할 때 쓴다. 토큰
 * 조회처럼 해시로 색인을 찾는 경우에는 필요 없다 — 그건 문자열 비교가
 * 아니라 집합 조회라 시간이 값에 따라 달라지지 않는다.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * 주소에 담을 수 있는 32바이트 난수.
 *
 * base64url을 쓰는 이유: 그냥 base64는 `+` `/` `=`가 들어가 주소에서
 * 인코딩되어야 하고, 고객사에 메일로 전달되는 과정에서 깨지기 쉽다.
 */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

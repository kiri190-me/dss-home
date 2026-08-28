import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// dss-auth·A/S 시스템의 같은 파일과 동일한 이유로 "server-only"를 넣지 않는다 —
// standalone tsx 스크립트(scripts/*.ts)도 이 모듈을 직접 불러오는데, 그쪽은
// Next.js 번들러 밖에서 돌아 "react-server" 조건이 설정되지 않는다.
// 브라우저 번들 방지 가드는 ./client.ts에 둔다.

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL이 설정되지 않았습니다. .env.local을 확인하세요(.env.example 참고)."
  );
}

// 개발용 싱글턴: 이게 없으면 `next dev`가 핫리로드할 때마다 새 연결 풀이 열려
// 결국 max_connections를 소진한다.
const globalForDb = globalThis as unknown as {
  __dssHomePgClient?: postgres.Sql;
  __dssHomeDb?: ReturnType<typeof drizzle<typeof schema>>;
};

const queryClient =
  globalForDb.__dssHomePgClient ??
  postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

export const db = globalForDb.__dssHomeDb ?? drizzle(queryClient, { schema });

// 깔끔한 종료가 필요한 standalone 스크립트 전용
// (열린 풀이 있으면 postgres.js가 프로세스를 계속 살려둔다).
export const pgClient = queryClient;

if (process.env.NODE_ENV !== "production") {
  globalForDb.__dssHomePgClient = queryClient;
  globalForDb.__dssHomeDb = db;
}

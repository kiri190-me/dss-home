import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Drizzle CLI는 Next.js 밖에서 돌아 .env.local을 자동으로 읽지 않는다.
// 여기서 명시적으로 읽는다(dss-auth의 같은 파일과 같은 이유).
dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL이 설정되지 않았습니다. .env.local을 확인하세요(.env.example 참고)."
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});

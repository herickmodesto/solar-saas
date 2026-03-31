import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL para o CLI (migrate/generate) — sem pooler
    // DATABASE_URL é lido automaticamente pelo PrismaClient em runtime
    url: process.env["DIRECT_URL"],
  },
});

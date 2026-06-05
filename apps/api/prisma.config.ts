import path from "node:path";

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: path.resolve(__dirname, "../../.env") });

const defaultDatabaseUrl =
  "postgresql://food_delivery:food_delivery@localhost:5432/food_delivery?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? defaultDatabaseUrl
  }
});

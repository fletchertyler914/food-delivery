import "reflect-metadata";

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { Test } from "@nestjs/testing";
import { SwaggerModule } from "@nestjs/swagger";

process.env["NODE_ENV"] ??= "test";
process.env["DATABASE_URL"] ??=
  "postgresql://food_delivery:food_delivery@localhost:5432/food_delivery?schema=public";
process.env["API_PORT"] ??= "3000";
process.env["WEB_ORIGIN"] ??= "http://localhost:5173";
process.env["JWT_ACCESS_SECRET"] ??= "openapi-generation-secret-at-least-32-chars";
process.env["JWT_ACCESS_TTL"] ??= "15m";
process.env["JWT_REFRESH_TTL_DAYS"] ??= "30";

const outputPath = resolve(process.argv[2] ?? "../../packages/api-client/openapi.json");

async function main(): Promise<void> {
  const { AppModule } = await import("../app.module");
  const { configureApp } = await import("../bootstrap/configure-app");
  const { createOpenApiConfig } = await import("./openapi-document");

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);

  const document = SwaggerModule.createDocument(app, createOpenApiConfig());

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

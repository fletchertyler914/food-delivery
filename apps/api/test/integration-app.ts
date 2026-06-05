import { execFileSync } from "node:child_process";
import type { Server } from "node:http";
import { resolve } from "node:path";

import { type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";

import { configureApp } from "../src/bootstrap/configure-app";
import { PrismaService } from "../src/prisma/prisma.service";

const apiRoot = resolve(__dirname, "..");

export interface IntegrationApp {
  readonly app: INestApplication;
  readonly prisma: PrismaService;
  readonly databaseUrl: string;
  readonly baseUrl: string;
  close(): Promise<void>;
}

export async function createIntegrationApp(): Promise<IntegrationApp> {
  const externalDatabaseUrl = process.env["TEST_DATABASE_URL"];
  let container: StartedTestContainer | null = null;
  let databaseUrl = externalDatabaseUrl;

  if (!databaseUrl) {
    container = await startPostgres();
    databaseUrl = buildDatabaseUrl(container);
  }

  setTestEnv(databaseUrl);
  applyMigrations(databaseUrl);

  const { AppModule } = await import("../src/app.module");
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  await app.listen(0, "127.0.0.1");

  const address = (app.getHttpServer() as Server).address();
  if (!address || typeof address === "string") {
    throw new Error("Integration app did not bind to a TCP port.");
  }

  const baseUrl = `http://127.0.0.1:${String(address.port)}`;
  const prisma = app.get(PrismaService);

  return {
    app,
    prisma,
    databaseUrl,
    baseUrl,
    async close(): Promise<void> {
      await app.close();
      if (container) {
        await container.stop();
      }
    }
  };
}

async function startPostgres(): Promise<StartedTestContainer> {
  return new GenericContainer("postgres:16-alpine")
    .withEnvironment({
      POSTGRES_DB: "food_delivery_test",
      POSTGRES_PASSWORD: "food_delivery",
      POSTGRES_USER: "food_delivery"
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections", 2))
    .start();
}

function buildDatabaseUrl(container: StartedTestContainer): string {
  return [
    "postgresql://food_delivery:food_delivery@",
    `${container.getHost()}:${String(container.getMappedPort(5432))}`,
    "/food_delivery_test?schema=public"
  ].join("");
}

function setTestEnv(databaseUrl: string): void {
  process.env["NODE_ENV"] = "test";
  process.env["DATABASE_URL"] = databaseUrl;
  process.env["API_PORT"] = "3000";
  process.env["WEB_ORIGIN"] = "http://localhost:5173";
  process.env["JWT_ACCESS_SECRET"] = "integration-test-secret-at-least-32-chars";
  process.env["JWT_ACCESS_TTL"] = "15m";
  process.env["JWT_REFRESH_TTL_DAYS"] = "30";
}

function applyMigrations(databaseUrl: string): void {
  execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
    cwd: apiRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl
    },
    stdio: "pipe"
  });
}

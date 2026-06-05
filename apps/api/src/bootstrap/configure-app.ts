import {
  RequestMethod,
  ValidationPipe,
  VersioningType,
  type INestApplication
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import { json, urlencoded } from "express";
import helmet from "helmet";
import { Logger } from "nestjs-pino";

import { ProblemDetailsFilter } from "../common/filters/problem-details.filter";

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cookieParser());
  app.use(json({ limit: "64kb" }));
  app.use(urlencoded({ extended: false, limit: "16kb" }));
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.enableCors({
    origin: [...config.getOrThrow<readonly string[]>("WEB_ORIGIN")],
    credentials: true
  });
  app.setGlobalPrefix("api", {
    exclude: [
      { path: "health/live", method: RequestMethod.GET },
      { path: "health/ready", method: RequestMethod.GET }
    ]
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false }
    })
  );
  app.useGlobalFilters(new ProblemDetailsFilter());
}

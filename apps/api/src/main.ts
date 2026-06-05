import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { configureApp } from "./bootstrap/configure-app";
import { createOpenApiConfig } from "./openapi/openapi-document";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  configureApp(app);

  const swaggerEnabled = config.get<string>("ENABLE_SWAGGER", "true") !== "false";
  if (swaggerEnabled) {
    const document = SwaggerModule.createDocument(app, createOpenApiConfig());
    SwaggerModule.setup("docs", app, document);
  }

  await app.listen(config.get<number>("API_PORT", 3000));
}

void bootstrap();

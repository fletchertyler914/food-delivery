import { DocumentBuilder } from "@nestjs/swagger";

export function createOpenApiConfig(): ReturnType<DocumentBuilder["build"]> {
  return new DocumentBuilder()
    .setTitle("Food Delivery API")
    .setDescription("REST API for restaurants, meals, orders, coupons, and notifications.")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
}

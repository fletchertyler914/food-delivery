import { randomUUID } from "node:crypto";

import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

export const REQUEST_ID_HEADER = "x-request-id";

// Augments Express's Request with the canonical request id. `pino-http`
// already adds a numeric `id` per request; we lift it (or the inbound
// `X-Request-Id` header, when an upstream proxy set one) into a
// stable string so the filter, logs, and clients all agree.
type RequestWithId = Request & {
  id?: string | number;
  requestId?: string;
};

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const inbound = readHeader(req, REQUEST_ID_HEADER);
    const fromPino =
      typeof req.id === "string" || typeof req.id === "number" ? String(req.id) : undefined;
    const id = inbound ?? fromPino ?? randomUUID();

    req.requestId = id;
    // Keep `req.id` consistent so pino-http child loggers use the
    // same value if it wasn't already a string.
    req.id = id;
    res.setHeader(REQUEST_ID_HEADER, id);

    next();
  }
}

function readHeader(req: Request, header: string): string | undefined {
  const value = req.headers[header];
  if (typeof value === "string" && value.length > 0 && value.length <= 200) {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    if (typeof first === "string" && first.length > 0 && first.length <= 200) {
      return first;
    }
  }
  return undefined;
}

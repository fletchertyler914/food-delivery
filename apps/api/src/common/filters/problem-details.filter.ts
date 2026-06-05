import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from "@nestjs/common";
import type { Request, Response } from "express";

import { DomainError } from "../errors/domain-error";

interface ValidationErrorResponse {
  message?: string[] | string;
  error?: string;
}

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  errors?: { path: string; message: string }[];
  requestId?: string;
}

type RequestWithId = Request & {
  requestId?: string;
  id?: string | number;
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<RequestWithId>();
    const requestId = extractRequestId(request);
    const problem = this.toProblem(exception, requestId);

    response.status(problem.status).type("application/problem+json").json(problem);
  }

  private toProblem(exception: unknown, requestId: string | undefined): ProblemDetails {
    if (exception instanceof DomainError) {
      const problem: ProblemDetails = {
        type: `https://food-delivery.local/problems/${exception.code}`,
        title: exception.message,
        status: exception.status,
        code: exception.code
      };

      if (exception.detail) {
        problem.detail = exception.detail;
      }
      if (requestId) {
        problem.requestId = requestId;
      }
      return problem;
    }

    if (exception instanceof HttpException) {
      const status: HttpStatus = exception.getStatus();
      const body = exception.getResponse() as ValidationErrorResponse;
      const messages = Array.isArray(body.message)
        ? body.message
        : body.message
          ? [body.message]
          : [exception.message];

      const problem: ProblemDetails = {
        type: `https://food-delivery.local/problems/http-${String(status)}`,
        title: body.error ?? exception.message,
        status,
        code: status === HttpStatus.BAD_REQUEST ? "VALIDATION_FAILED" : `HTTP_${String(status)}`,
        errors: messages.map((message) => ({ path: "", message }))
      };
      if (requestId) {
        problem.requestId = requestId;
      }
      return problem;
    }

    this.logger.error(
      exception instanceof Error ? (exception.stack ?? exception.message) : String(exception),
      requestId ? { requestId } : undefined
    );

    const problem: ProblemDetails = {
      type: "https://food-delivery.local/problems/internal-server-error",
      title: "Internal server error",
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: "INTERNAL_SERVER_ERROR"
    };
    if (requestId) {
      problem.requestId = requestId;
    }
    return problem;
  }
}

function extractRequestId(request: RequestWithId | undefined): string | undefined {
  if (!request) {
    return undefined;
  }
  if (typeof request.requestId === "string" && request.requestId.length > 0) {
    return request.requestId;
  }
  if (typeof request.id === "string" && request.id.length > 0) {
    return request.id;
  }
  if (typeof request.id === "number") {
    return String(request.id);
  }
  return undefined;
}

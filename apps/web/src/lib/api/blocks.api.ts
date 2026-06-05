import type { Block } from "./types";
import { apiRequest } from "./client";

export interface BlockCandidate {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

interface PaginatedEnvelope<T> {
  readonly data: T[];
  readonly nextCursor?: string;
}

export async function listBlocks(): Promise<Block[]> {
  const response = await apiRequest<Block[] | PaginatedEnvelope<Block>>("/api/v1/blocks");
  return Array.isArray(response) ? response : response.data;
}

export async function listBlockCandidates(): Promise<BlockCandidate[]> {
  const response = await apiRequest<BlockCandidate[] | PaginatedEnvelope<BlockCandidate>>(
    "/api/v1/blocks/candidates"
  );
  return Array.isArray(response) ? response : response.data;
}

export function blockCustomer(customerId: string): Promise<undefined> {
  return apiRequest<undefined>(`/api/v1/blocks/${customerId}`, {
    method: "POST"
  });
}

export function unblockCustomer(customerId: string): Promise<undefined> {
  return apiRequest<undefined>(`/api/v1/blocks/${customerId}`, {
    method: "DELETE"
  });
}

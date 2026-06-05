import type { Coupon, CouponPreview, CreateCouponInput } from "./types";
import { apiRequest } from "./client";

interface PaginatedEnvelope<T> {
  readonly data: T[];
  readonly nextCursor?: string;
}

// Validate a coupon code against a restaurant and resolve its discount.
// Public on the API, so it works for guests previewing pricing in the
// cart before they sign in. Throws ApiError (404/400) for unknown or
// inactive codes — callers surface the problem+json detail.
export function previewCoupon(restaurantId: string, code: string): Promise<CouponPreview> {
  const query = new URLSearchParams({ code }).toString();
  return apiRequest<CouponPreview>(`/api/v1/restaurants/${restaurantId}/coupons/preview?${query}`);
}

export async function listCoupons(restaurantId: string): Promise<Coupon[]> {
  const response = await apiRequest<Coupon[] | PaginatedEnvelope<Coupon>>(
    `/api/v1/restaurants/${restaurantId}/coupons`
  );
  return Array.isArray(response) ? response : response.data;
}

export function createCoupon(restaurantId: string, input: CreateCouponInput): Promise<Coupon> {
  return apiRequest<Coupon>(`/api/v1/restaurants/${restaurantId}/coupons`, {
    method: "POST",
    body: input
  });
}

export function deactivateCoupon(id: string): Promise<undefined> {
  return apiRequest<undefined>(`/api/v1/coupons/${id}`, {
    method: "DELETE"
  });
}

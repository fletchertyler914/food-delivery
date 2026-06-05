# ADR 0008: Optional cover imagery via HTTPS URLs

## Status

Accepted

## Context

The food-delivery SPA needs a professional, visually rich experience for demos and portfolio deployments. Storing binary image blobs would require object storage (S3, GCS), upload endpoints, CDN invalidation, and access-control policies — disproportionate scope for this MVP.

## Decision

Add optional nullable `imageUrl` fields to `Restaurant` and `Meal` in Prisma. The API validates them as HTTPS URLs (max 2048 chars) on create/update. The web client renders them via a shared `CoverImage` component; when absent, a deterministic CSS gradient + initials fallback is shown (no third-party network call).

Demo seed data uses pinned Unsplash CDN URLs (`images.unsplash.com/photo-…`) so reseeds are idempotent and images are cached on Unsplash's CDN without an API key.

## Consequences

- **Positive:** Rich UI with minimal infra; owners can paste any HTTPS image URL; gradient fallback keeps lists usable without images.
- **Negative:** No upload UX; broken external URLs degrade to the gradient fallback after `onError`; seed/demo environments depend on Unsplash CDN availability (acceptable for demo scope).
- **Out of scope:** Image upload, resizing, CDN signing, or cuisine/location metadata.

-- Atomic refresh-token consumption requires `tokenHash` to be UNIQUE
-- so the read-and-revoke updateMany cannot match more than one row.
-- Two concurrent refresh requests with the same token now race to a
-- single update; the loser sees `count === 0` and rejects with 401.

-- DropIndex (no-op if it never existed; safe defensive guard)
-- (RefreshToken did not have a unique index on tokenHash before)

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

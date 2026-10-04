-- Keep the grant ledger independent of editable game progress. Historical
-- redemptions continue to count even if an account is removed in the future.
CREATE TABLE limited_code_redemptions (
 code TEXT NOT NULL,
 user_id TEXT NOT NULL,
 redeemed_at TEXT NOT NULL,
 PRIMARY KEY (code, user_id)
);

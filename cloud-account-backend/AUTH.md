# XaR Cloud accounts

The existing public Site, D1 database, R2 bucket, account IDs and origin are retained. The display name is XaR Cloud; the legacy hostname and storage names remain for compatibility. Brukivka, AppleIQ and HoMoW use the same username. Each game's saves remain separate.

## Registration and recovery

A user binds their existing ChatGPT identity once, using its Gmail address and a new 12–128 character password. This keeps the existing account ID and every save revision. The username is preserved for an existing account; a new username is protected by the database unique index. Gmail aliases are canonicalized; the Gmail column also has a unique index. Gmail association requires both the original platform identity and a matching platform email. Typed email alone never grants ownership, recovers another account, or merges accounts. No verification emails or codes are sent: the confirmation flow is through the existing ChatGPT sign-in. An account without a Gmail address must first use a ChatGPT account associated with Gmail.

Ordinary login needs only username and password. Recovery repeats the original Gmail/ChatGPT identity confirmation, sets a new password and revokes every old password session. Accounts without password setup retain legacy platform access; the updated portal guides them through one-time setup. Valid password sessions take precedence over any other platform account open in the browser.

## Passwords and sessions

Passwords use salted PBKDF2-HMAC-SHA256 at the Workerd WebCrypto ceiling of 100,000 iterations, preceded by HMAC with a server-only pepper. Each account gets an independent 128-bit random salt. This platform-constrained work factor is lower than OWASP's standalone PBKDF2 recommendation; the separate server pepper is required, with rate limiting and a minimum password length. Do not remove the pepper or silently fall back to a fast hash. The algorithm/version is stored per credential for future upgrades. Comparisons process fixed-size digests without early exit.

Runtime `XAR_AUTH_PEPPER` is a Sites secret, at least 32 characters; it must never be committed or placed in game code, save snapshots, test fixtures or logs. Preserve it across deployments. Changing it requires password recovery for existing users. The auth tables contain no plaintext passwords. Fake values in tests are not production secrets.

Sessions use 256-bit random tokens. D1 keeps SHA-256 token hashes, never bearer tokens. `__Host-xar_session` is Secure, HttpOnly, SameSite=Lax and Path=/, with a 30-day lifetime; no password or token is put in localStorage or game messages. Sessions are revocable and limited to eight devices. Logout revokes the current token and suppresses automatic platform fallback with a separate HttpOnly cookie. Opening a logout URL alone performs no mutation; the portal requires a click. Password recovery revokes all previous sessions.

All password mutations check the exact Origin, restrict request sizes, and use parameterized SQL. Persistent pseudonymous per-name/per-IP counters limit failed login attempts. Unknown users receive the same error and password derivation as wrong passwords. Existing cloud revision conflicts, per-user authorization and R2 namespaces remain in force.

## Deployment

Migration 0004 adds credential, session and attempt tables; it does not rewrite accounts or saves. Apply through normal Site publication. Run `npm test`, `npm run build`, then package/deploy with the source helper. No live user passwords are created by development or QA.

Primary references: [Cloudflare WebCrypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/), [Workerd PBKDF2 limit](https://github.com/cloudflare/workerd/issues/1346), [OWASP password storage and peppers](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

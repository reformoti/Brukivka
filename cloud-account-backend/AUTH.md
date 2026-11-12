# XaR Cloud accounts

The existing public Site, D1 database, R2 bucket, account IDs and origin are retained. The display name is XaR Cloud; the address is now https://xar-cloud.stunningherring.chatgpt.site and legacy storage names remain for compatibility. Brukivka, AppleIQ and HoMoW use the same username. Each game's saves remain separate.

## Registration and email recovery

Normal registration accepts username, password and email. Normal login accepts only username and password. No Google or ChatGPT login is required. Addresses are stored as recovery contact addresses, not falsely described as verified. Legacy Gmail aliases retain their canonical form. Existing account IDs and saved games remain unchanged; old authenticated owners can attach a password to their own legacy username without a separate redirect. Email alone never links an existing account.

Forgot-password requests use a random 256-bit token sent as a link to the account email. Only SHA-256 token hashes are stored. Tokens expire after 15 minutes, are single-use and are invalidated together after a successful reset. Password updates use an atomic version check, revoke all prior sessions, and cannot be replayed. Reset links put tokens in a URL fragment, not server query logs; the portal clears the fragment and sends the token only in the reset POST. Responses do not reveal whether the email exists.

Sending requires a configured transactional email provider. Set `XAR_EMAIL_PROVIDER` to `resend` or `brevo`, `XAR_EMAIL_API_KEY` as a Sites secret, and `XAR_EMAIL_FROM` to the provider's verified sender. Register/login work without it; the forgot-password form explicitly reports delivery as unavailable. No emails are claimed sent when the sender is unconfigured. Do not use the user's Gmail connection in ChatGPT as an automated transactional sender. The `XAR_EMAIL_TRANSPORT` function exists only as a server-side test injection; production configuration uses the provider API. Tests never deliver real messages.

The service may still accept legacy identity endpoints for backwards compatibility; these are absent from the normal registration, login and recovery UI.

## Passwords and sessions

Passwords use salted PBKDF2-HMAC-SHA256 at the Workerd WebCrypto ceiling of 100,000 iterations, preceded by HMAC with a server-only pepper. Each account gets an independent 128-bit random salt. This platform-constrained work factor is lower than OWASP's standalone PBKDF2 recommendation; the separate server pepper is required, with rate limiting and a minimum password length. Do not remove the pepper or silently fall back to a fast hash. The algorithm/version is stored per credential for future upgrades. Comparisons process fixed-size digests without early exit.

Runtime `XAR_AUTH_PEPPER` is a Sites secret, at least 32 characters; it must never be committed or placed in game code, save snapshots, test fixtures or logs. Preserve it across deployments. Changing it requires password recovery for existing users. The auth tables contain no plaintext passwords. Fake values in tests are not production secrets.

Sessions use 256-bit random tokens. D1 keeps SHA-256 token hashes, never bearer tokens. `__Host-xar_session` is Secure, HttpOnly, SameSite=Lax and Path=/, with a 30-day lifetime; no password or token is put in localStorage or game messages. Sessions are revocable and limited to eight devices. Logout revokes the current token and suppresses automatic platform fallback with a separate HttpOnly cookie. Opening a logout URL alone performs no mutation; the portal requires a click. Password recovery revokes all previous sessions.

All password mutations check the exact Origin, restrict request sizes, and use parameterized SQL. Persistent pseudonymous per-name/per-IP counters limit failed login attempts. Unknown users receive the same error and password derivation as wrong passwords. Existing cloud revision conflicts, per-user authorization and R2 namespaces remain in force.

## Deployment

Migration 0004 adds credential, session and attempt tables; migration 0005 adds password-reset tokens. It it does not rewrite accounts or saves. Apply through normal Site publication. Run `npm test`, `npm run build`, then package/deploy with the source helper. No live user passwords are created by development or QA.

Primary references: [Cloudflare WebCrypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/), [Workerd PBKDF2 limit](https://github.com/cloudflare/workerd/issues/1346), [OWASP password storage and peppers](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

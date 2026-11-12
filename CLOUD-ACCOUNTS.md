# XaR Cloud accounts

The in-game phone contains **Акаунт**. Sign in with the same XaR Cloud username and password on each computer. Bind Gmail once using the existing ChatGPT account; this keeps the original account ID and existing saves. Devices stay connected for 30 days. The deployed account service is https://brukivka-cloud.stunningherring.chatgpt.site. It starts with owner-only access; visibility is managed separately from per-user data authorization.

Use **Зберегти у хмару** on the source computer, then **Завантажити з хмари** on the destination. Saving is explicit, not automatic. Check the copy date before replacing progress. The confirmation takes place in the account window.

The snapshot includes all Brukivka localStorage records and HoMoW options: money (including intentional negative balances), purchases, PC, phone, garage, construction, auxiliary currencies, game saves, scores, Paint drawings, themes and audio preferences. Audio assets are shared repository files, not duplicated in saves. Snapshots exclude cloud identity metadata, restore locks and unrelated origin storage. Transient game actions that the game does not save are not campaign progress.

Before loading, the client writes an IndexedDB backup. Local restore is transactional and rolls back on quota errors. Export/import JSON is also available in the phone. Up to three local backups can be exported. A pagehide write guard prevents the old running game from overwriting restored progress during reload.

XaR Cloud uses revocable password sessions. Passwords are salted PBKDF2 hashes with a server-only pepper. Plain passwords are never stored in source, game saves, or browser storage. Gmail binding and recovery require the original ChatGPT identity; typing someone else's Gmail cannot claim that account. Logout revokes the current session, and recovery revokes every earlier session. Usernames normalize to lowercase ASCII (3–24 letters, numbers or underscore) and have a server-side unique database index. All record access is keyed by the authenticated platform user ID, never an ID supplied by the game. Conditional revision writes reject stale-device overwrites. The database retains three earlier cloud revisions. Snapshot JSON files (including large Paint galleries) live in private R2 object storage; D1 stores account and revision metadata.

Client code: cloud-core.js, cloud-guard.js, cloud-account.js and cloud-account.css. The authenticated Worker has a separate source repository; its reviewed source is mirrored under cloud-account-backend. Apply its schema migrations through deployment, not request handlers. Keep hosting audience restrictions intact unless the owner requests a change.


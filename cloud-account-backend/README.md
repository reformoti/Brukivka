Source mirror of XaR Cloud. The canonical Site keeps the existing D1/R2 resources and account IDs. Runtime XAR_AUTH_PEPPER is a Sites secret and is never mirrored here. See AUTH.md for one-time Gmail binding through the original ChatGPT identity, username/password sessions, recovery and deployment.

Run npm ci && npm test. The complete test command covers saves, HoMoW tickets, the portal and password sessions. Build with the canonical Site hosting manifest, not a new Site. App=AppleIQ uses separate save/history tables and object prefixes from Brukivka. Public hostname remains compatible; the displayed title is XaR Cloud.

Canonical deployed source: 075feacb9888e69ea2961271e0788765422060fb, service version 7. Existing migration files are immutable; migration 0004 adds auth tables without rewriting accounts or saves.

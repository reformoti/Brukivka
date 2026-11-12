Source mirror of the authenticated account service. Its canonical hosted repository uses Sites identity, the DB D1 binding and the BUCKET R2 binding. Never embed server credentials in the game.

The deployed service also accepts app=AppleIQ on account/save/history requests. It shares the ChatGPT identity and username, while appleiq_saves / appleiq_save_history and progress/appleiq/ objects keep AppleIQ separate from Brukivka. Requests without app retain Brukivka behavior. Migration 0003 adds AppleIQ tables without changing existing game data.

Tests: npm ci && node --test tests.mjs online-tests.mjs portal-tests.mjs. Builds require the canonical Site hosting manifest, kept with that Site and not copied here. Canonical deployed source: 31e6be5de291f76d63c4db0f792e3f14645f9f4b (service version 6). This mirror sync does not change the Brukivka game client or release.

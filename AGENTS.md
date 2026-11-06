# Brukivka update rules

- Every user-facing update must increment the game version in `release.js` (SemVer: patch for fixes, minor for new features, major for larger changes).
- Keep the visible version in the phone's Brukivka app and the main header, via `[data-game-version]`.
- Update the release date and the changelog, and change local asset cache query strings in `index.html` to the new version.
- Preserve existing saves and purchased items. Do not change intentional negative balances.
- Publish only changed repository files; do not produce a full-project ZIP unless requested.
- Keep legacy storage key names for compatibility, but do not use the removed personal name in the UI.
- Hide detailed instructions in closed help/details controls, leaving prices, status and transaction consequences visible.
- Run the applicable tests before publishing. For chess, label move analysis as the game's approximate bot evaluation.

- `homow.html` is the generated, self-contained HoMoW Steam entry. Edit `realms.html`, the `realms-*` / `homow-*` source modules, and shared CSS/fonts instead of the bundle. Run `python scripts/build-homow.py` after source changes, and verify both the source entry and the independent HTML before publishing. Keep the legacy RPG save key.

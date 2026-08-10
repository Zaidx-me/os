## Task 5 (test harness + CI) — 2026-08-10

- ENV: docker sandbox has NO browser system libraries and NO fontconfig/fonts. `npx playwright install chromium` completes the download but errors on host-requirement validation; e2e launch needs the LD_LIBRARY_PATH + FONTCONFIG_FILE workaround documented in learnings.md. CI on ubuntu-latest is unaffected. If the sandbox is ever recreated, the extracted libs/fonts live under /tmp/opencode/pwlibs and would need rebuilding (apt-get download + dpkg-deb -x + ldd loop).
- ENV: sudo requires a password (abc user) — no root apt-get; package lists not present, so apt needed `-o Dir::State::lists=/tmp/opencode/aptlists -o Dir::Cache=/tmp/opencode/aptcache` to work unprivileged.
- Vite emits a benign forward-looking warning: "configLoader: 'native' ... ESM syntax in a file loaded as CommonJS (vitest.config.ts)". Not an error today; may need `"type": "module"` or a `.mts` config in a future major.

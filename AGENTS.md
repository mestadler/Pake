# AGENTS.md

## Scope
- Work inside `Pake/` only; `/home/martin/Devops` is a multi-repo workspace.
- Built app artifacts are kept outside this repo in `/home/martin/Devops/pake/builds/`.

## Toolchain (trust CI config)
- Node `22`
- pnpm `10.26.2`
- Rust `1.93.0` (`rust-toolchain.toml`)

## Commands to use
- `pnpm install`
- `pnpm run cli:build` (generates `dist/cli.js`)
- `pnpm test` (CI path; already runs `cli:build` first)
- `npx vitest run tests/unit/<file>.test.ts` (focused unit run)
- `node dist/cli.js <url-or-html> --name <Name> [options]` (local packaging)
- `pake-mobile <url-or-html> --name <Name> --targets apk|apk-arm64-v8a` (Android APK packaging)

## Where things start
- CLI entry: `bin/cli.ts`
- CLI bundle wiring: `rollup.config.js` -> `dist/cli.js`
- Tauri runtime entry: `src-tauri/src/lib.rs` (`run_app`)

## Gotchas worth remembering
- `tests/index.js` hard-requires `dist/cli.js`.
- Packaging writes to the current working directory; run from your intended output folder.
- Linux packaging depends on WebKit/Tauri system libs; use `.github/actions/setup-env/action.yml` as source of truth.
- Avoid parallel packaging runs in one checkout (`node dist/cli.js ...`); shared temp state in `src-tauri/.pake/` can collide.
- Linux WebKit safe mode is opt-in in this branch: set `PAKE_LINUX_WEBKIT_SAFE_MODE=1` to force conservative WebKit flags.

## Defaults in this fork branch
- Build command artifact saving is enabled by default (`--save-build-command [path]`).
- Version scheme defaults to `date` with `versionPatch=1`, producing semver `YYYY.M.patch` (example `2026.4.1`).
- `--app-version` overrides the date scheme when explicitly provided.
- Package description is generated from app name + source URL/local file and includes Tauri/Pake attribution.

## Local workflow hygiene
- Keep reproducible build commands in `builds/*/*.build.txt` and rerun from those folders.
- `AGENTS.md`, `CLAUDE.md`, and `*.deb` are gitignored in this repo; do not try to commit them.
- See `README_LOCAL.md` for local/fork workflow details and examples.

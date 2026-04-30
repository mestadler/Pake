# Pake Mobile (Android APK)

This fork adds a dedicated mobile CLI for Android APK packaging:

- command: `pake-mobile`
- scope: Android only
- output: APK only

## Credits

All core credit goes to the upstream Pake project and contributors:

- https://github.com/tw93/Pake

Use upstream `README.md` and `docs/` for the main project documentation. This file only covers fork-local mobile behavior.

## Quick start

From `Pake/`:

```bash
pnpm install
pnpm run cli:build
```

Run mobile packaging:

```bash
node dist/cli.js "https://example.com" --name Example --targets apk
```

Or if globally linked:

```bash
pake-mobile "https://example.com" --name Example --targets apk
```

## Supported targets

- `apk` (generic APK)
- `apk-arm64-v8a` (explicit arm64 APK)

## Output naming

- generic: `<name>_<version>_android.apk`
- arm64: `<name>_<version>_arm64-v8a.apk`

## Reproducible build command artifact

Build command artifact is enabled by default and written next to output:

- `<name>.build.txt`

Use `--save-build-command [path]` to override location.

## Versioning defaults in this fork

Default version scheme is date-based and semver-safe:

- `YYYY.M.patch` (example: `2026.4.1`)

Override explicitly with `--app-version <semver>`.

## Mobile behavior notes

Desktop-only options are warned and ignored on `pake-mobile` (warn-and-continue).

Examples of desktop-only options on mobile:

- tray options
- global shortcut behavior
- macOS install/hide-title-bar options

## Prerequisites

You need Tauri Android prerequisites installed on the build host (Android SDK/JDK and required tooling).

If APK output directories are missing, initialize Android support first:

```bash
pnpm run tauri android init
```

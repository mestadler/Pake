# Pake Local Usage Guide

This document explains how to use this local/forked Pake setup for repeatable app packaging.

## Credits and upstream

Pake is created and maintained by the upstream project and contributors:

- Upstream repo: https://github.com/tw93/Pake
- Original documentation: `README.md` and `docs/` in upstream

This fork adds local workflow improvements (reproducible build command artifacts, Linux packaging fixes under test, and date-version defaults).

## What Pake does

- Packages a website or local HTML app into a desktop app using Tauri + Rust.
- Produces platform installers (Linux `.deb`/`.rpm`/AppImage, macOS `.dmg`/`.app`, Windows installers depending on target).
- Supports app naming, icons, dimensions, tray behavior, and many runtime options.

## What Pake does not do

- It does not convert a web app into a fully native app; rendering is still webview-based.
- It does not bypass website auth / CSP / browser compatibility limitations.
- It does not guarantee identical behavior across all Wayland/X11/compositor combinations.

## Prerequisites

- Node `22`
- pnpm `10.26.2`
- Rust toolchain (repo pins via `rust-toolchain.toml`)
- Linux system deps for Tauri/WebKitGTK (see `.github/actions/setup-env/action.yml`)

## Install and build this fork locally

From `Pake/`:

```bash
pnpm install
pnpm run cli:build
```

Optional global command from local source:

```bash
pnpm link --global
pake --version
```

## Run packaging (core usage)

```bash
node dist/cli.js <url-or-local-file> --name <AppName> [options]
```

Examples:

```bash
# Website -> Linux deb
node dist/cli.js "https://claude.ai/new" --name Claude --targets deb

# Local HTML -> Linux deb
node dist/cli.js "weather.html" --name Weather --use-local-file --icon "weather.png" --targets deb
```

## Reproducible build command artifacts (enabled by default)

This fork writes a build command artifact after successful build:

- Default path: `<app-name>.build.txt` in the current output directory
- Includes timestamp, platform, target, output filename, and exact command

Optional override:

```bash
node dist/cli.js "https://example.com" --name Example --save-build-command "./artifacts/example.build.txt"
```

## Versioning policy in this fork

Default behavior uses date versioning:

- `--version-scheme date` (default)
- `--version-patch <n>` (default `1`)
- Format: `YYYY.M.patch` (semver-safe)

Example output version: `2026.4.1`

If `--app-version` is passed, it overrides the scheme.

## Key options used often

- `--name <string>` app name
- `--targets <target>` packaging target(s)
- `--icon <path-or-url>` custom icon
- `--use-local-file` package local HTML/assets
- `--user-agent <string>` override UA
- `--app-version <semver>` explicit version override
- `--version-scheme <date|manual>` version strategy
- `--version-patch <number>` patch for date strategy
- `--save-build-command [path]` save command artifact (default on)

For full upstream options, see `docs/cli-usage.md` and upstream README.

## Local workflow recommendation

- Build each app from its own folder under `/home/martin/Devops/pake/builds/`.
- Keep one `.build.txt` per app and update it by rebuilding.
- Rebuild sequentially when using one checkout (avoid parallel builds in same repo state).

## Install generated packages on host (Linux)

Use a path readable by `_apt` to avoid sandbox warnings:

```bash
cp ./myapp.deb /tmp/
sudo apt install /tmp/myapp.deb
```

## Notes for maintainers

- Upstream README remains the primary product documentation.
- This file is intentionally local/fork-focused and should stay concise.
- Mobile APK-only workflow is documented in `README_MOBILE.md`.

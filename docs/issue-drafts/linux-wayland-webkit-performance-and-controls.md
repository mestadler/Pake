# Wayland/Linux: default WebKit safe flags can hurt responsiveness and decoration behavior

## Problem
On pure Wayland systems, apps packaged with Pake can feel laggy (text input delays, less snappy UI), and window controls (min/max/close) can become non-interactive depending on compositor/session timing.

Current Linux runtime path in `src-tauri/src/lib.rs` sets these env vars by default:
- `WEBKIT_DISABLE_DMABUF_RENDERER=1`
- `WEBKIT_DISABLE_COMPOSITING_MODE=1`

These help blank-screen cases, but on some Wayland setups they trade off too much interactivity/performance.

## Repro note
Launching with:

`WEBKIT_DISABLE_COMPOSITING_MODE=0 WEBKIT_DISABLE_DMABUF_RENDERER=0 pake-<app>`

improves responsiveness on the tested host.

## Suggested direction
Make conservative Linux WebKit flags opt-in (or dynamically gated), rather than always-on defaults.

One practical option:
- Only set those vars when a dedicated env toggle is present (example: `PAKE_LINUX_WEBKIT_SAFE_MODE=1`)

Also consider Linux-specific window visibility/state restore behavior for Wayland to avoid non-interactive decorations during startup.

## Local patch
Validated local patch includes:
- Linux WebKit safe mode made opt-in
- Linux state flags preserving `VISIBLE` during restore path

https://github.com/mestadler/Pake/commit/cf519dc

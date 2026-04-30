# Linux: duplicate desktop launchers and missing icon after `.deb` install

## Problem
On Debian/Ubuntu (GNOME), installing a Pake-built `.deb` can create two desktop launchers for one app:
- `/usr/share/applications/<app>.desktop`
- `/usr/share/applications/com.pake.<app>.desktop`

In GNOME search this appears as duplicate entries (for example, `claude` and `pake-claude`).

The `com.pake.<app>.desktop` entry can also show no icon because it references `Icon=<app>_512` while the bundled hicolor icon is registered as `pake-<app>.png`.

## Repro
1. Build Linux `.deb` (`--targets deb`)
2. Install package
3. Check `/usr/share/applications/` and search app in GNOME overview

## Root cause
`mergeLinuxConfig` injects a custom desktop override (`linuxBundle.deb.files`) in addition to Tauri's default desktop entry.

## Suggested fix
For Linux packaging, do not inject a second desktop file override. Let Tauri generate the single desktop entry and icon mapping.

## Validation
After removing the override, generated package contains only:
- `/usr/share/applications/<app>.desktop`
- `/usr/share/icons/hicolor/.../apps/pake-<app>.png`

No duplicate launcher entries in GNOME search.

## Local patch
https://github.com/mestadler/Pake/commit/cf519dc

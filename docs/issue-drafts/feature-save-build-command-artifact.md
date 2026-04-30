# Feature request: persist reproducible build command artifact

## Context
In local workflows, it is useful to keep a sidecar file (for example `<app>.build.txt`) containing the exact CLI command used to produce a package.

This makes rebuilds deterministic and easy to repeat later.

## Proposal
Add an optional CLI flag to save the fully resolved build invocation, for example:

- `--save-build-command`
- or `--save-build-command <path>`

Behavior idea:
- Writes command + timestamp + platform/target to a text file near output artifact.
- If URL/local file paths contain spaces, write shell-safe quoting.

## Why this helps
- Reproducible local rebuilds
- Easier debugging and sharing exact build inputs
- Better team handoff for app packaging workflows

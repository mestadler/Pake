#!/usr/bin/env node

process.env.PAKE_MOBILE_CLI = "1";
await import("../dist/cli.js");

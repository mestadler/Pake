# TODO (local fork workflow)

- [ ] Reinstall latest `claude.deb` and `weather.deb` on host and verify:
  - [ ] no duplicate launcher entries
  - [ ] launcher icons render correctly
  - [ ] titlebar controls work on Wayland
  - [ ] typing/input responsiveness is acceptable

- [ ] Decide date-version patch policy for repeated builds in same month:
  - [ ] manual increment per build (`2026.4.2`, `2026.4.3`, ...)
  - [ ] document rule in `README_LOCAL.md`

- [ ] Validate optional custom command artifact path flow:
  - [ ] test `--save-build-command ./artifacts/<app>.build.txt`

- [ ] Prepare upstream-sharing package:
  - [ ] trim/refine issue drafts in `docs/issue-drafts/`
  - [ ] discuss with upstream maintainer
  - [ ] open/reopen upstream issues as agreed

- [ ] Optional follow-up implementation:
  - [ ] add a dedicated flag to disable build artifact generation when desired
  - [ ] add tests for date version resolver behavior (`date` vs explicit `--app-version`)

- [x] Repo hygiene adjustment:
  - [x] allow tracking `AGENTS.md` in repo (update `.gitignore` accordingly)

- [x] Mobile CLI stabilization pass:
  - [x] add `pake-mobile` wrapper command
  - [x] support `apk` and `apk-arm64-v8a` targets
  - [x] run Android smoke builds for both targets
  - [x] handle arm64 artifact lookup fallback when output naming is `universal`

- [ ] Next test cycle:
  - [ ] run additional real-site mobile APK builds from `builds/mobile-smoke/`
  - [ ] confirm APK install/launch on physical Android device

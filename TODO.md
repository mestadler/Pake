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

- [ ] Repo hygiene adjustment:
  - [ ] allow tracking `AGENTS.md` in repo (update `.gitignore` accordingly)

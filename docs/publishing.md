# Distribution and publishing

This page is for the maintainer. Users read [Getting started](getting-started.md).

## Channels

| Channel | Who it reaches | Status | How |
| --- | --- | --- | --- |
| Own marketplace (this repository) | Anyone with the repo URL, in Claude Code | Available as soon as `.claude-plugin/marketplace.json` is on `main` | `claude plugin marketplace add hector-ae21/rup-flow` |
| GitHub release ZIP | claude.ai users (manual upload) | Published by the release workflow | Attach `rup-flow-skill.zip` |
| Anthropic directory | People browsing claude.ai and Claude Code | Manual submission, paid claude.ai plan | See below |

## Release

1. Update `CHANGELOG.md` (`Unreleased` → `## [x.y.z]`).
2. Bump `version` in `package.json` and `.claude-plugin/plugin.json` (they must match; `npm run validate` checks).
3. Merge to `main`.
4. `git tag vX.Y.Z && git push origin vX.Y.Z`.

The release workflow runs the checks, builds `dist/rup-flow-skill.zip` and creates the GitHub release with that file and the notes from the changelog. Because `plugin.json` sets `version`, users get an update only when it changes.

Never rename the plugin: installs are recorded by `name@marketplace`.

## Submit to Anthropic's directory

1. Validate: `claude plugin validate . --strict` (the portal applies more rules than the CLI).
2. Open the developer portal at <https://claude.ai/directory/manage> (requires a paid claude.ai plan) and follow *Submit a plugin*.
3. Fill the listing in the portal, not in `plugin.json` (the fields would be reported as findings by the scan):
   - Icon: download <https://raw.githubusercontent.com/hector-ae21/rup-flow/docs-assets/icon.png> (512 × 512) and upload it.
   - Documentation: `https://github.com/hector-ae21/rup-flow/blob/main/docs/getting-started.md`
   - Support: `https://github.com/hector-ae21/rup-flow/issues`
   - Privacy policy, if requested: the plugin collects no data; link [PRIVACY.md](../PRIVACY.md).
4. Reviewed versions reach users after publication; new versions go through the same portal.

The listing reaches Claude Code users as `rup-flow@synced`. The web-only parts of the plugin are the skill (Markdown and scripts); the Docker rendering is Claude Code and local only.

## Verify before announcing

```bash
npm run check
claude plugin validate . --strict
claude plugin marketplace add ./
claude plugin install rup-flow@rup-flow
```

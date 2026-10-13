# Contributing

## Setup

Node.js 18+ is the only requirement; there are no dependencies to install. Docker is needed only to render diagrams.

```bash
npm run check        # skill/plugin validation + CLI tests
node tools/make-icon.mjs
node tools/package-web.mjs
node tools/build-gallery.mjs   # regenerates docs/images (needs Docker and, for screenshots, Chrome or Edge)
```

Run the gallery build whenever templates, themes or the explorer change, and commit the images.

## Layout

| Path | What it is |
| --- | --- |
| `skills/rup-flow/` | The skill: `SKILL.md`, `references/`, `templates/`, `scripts/rup.mjs`, `runtime/compose.yaml` |
| `agents/` | `rup-architect` and `rup-reviewer` |
| `.claude-plugin/` | Plugin and marketplace manifests |
| `docs/` | User documentation |
| `examples/` | Generated sample documentation |
| `tools/` | Repository tooling (icon, web package, validation) |
| `test/` | CLI tests |

## Rules

- `SKILL.md` stays short; detail goes in `references/` and is loaded on demand.
- The `description` in `SKILL.md` is at most 200 characters (claude.ai limit); `npm run validate` enforces it.
- A new template needs an entry in `init` or `new use-case` in `rup.mjs` and a test.
- Templates and references are written in English. Generated documentation language is the user's `docLanguage`.
- Keep the version equal in `package.json`, `.claude-plugin/plugin.json` and `SKILL.md` (`metadata.version`).
- Keep agent-specific behaviour out of `skills/rup-flow/`; adapters are listed in [docs/architecture.md](docs/architecture.md), which also explains how to add a client.

## Pull requests

Work on a branch, use [Conventional Commits](https://www.conventionalcommits.org/) (`feat(cli): ...`), and open a pull request. CI must pass (`CI complete`). Describe the why in the body.

## Releasing

1. Move `Unreleased` entries to a new `## [x.y.z]` section in `CHANGELOG.md`.
2. Bump the version in `package.json` and `.claude-plugin/plugin.json`.
3. Merge to `main`, then tag: `git tag vX.Y.Z && git push origin vX.Y.Z`.
4. The release workflow publishes `rup-flow-skill.zip` (the file users upload to claude.ai).

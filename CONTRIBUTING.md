# Contributing

## Setup

Node.js 18+ is the only requirement; there are no dependencies to install. Docker is needed only to render diagrams.

```bash
npm run check        # skill/plugin validation + CLI tests
node tools/make-icon.mjs --png dist/icon-512.png   # SVG into assets/, PNG only where you ask for it
node tools/package-web.mjs
node tools/build-gallery.mjs   # regenerates docs/images (needs Docker and, for screenshots, Chrome or Edge)
```

Run the gallery build whenever templates, themes or the explorer change and commit the SVGs.

## No binary files in the plugin tree

The directory scan holds a plugin for manual review when its tree has PNG, JPEG or font files, so the repository keeps none (`npm run validate` fails on them). The explorer screenshots and the PNG icon live on the orphan branch `docs-assets` and the docs link to them by URL. To refresh them:

```bash
node tools/build-gallery.mjs            # screenshots land in dist/gallery/explorer
node tools/make-icon.mjs --png dist/icon-512.png
git clone --branch docs-assets --single-branch https://github.com/hector-ae21/rup-flow.git dist/docs-assets
cp dist/gallery/explorer/*.png dist/docs-assets/explorer/ && cp dist/icon-512.png dist/docs-assets/icon.png
cd dist/docs-assets && git add -A && git commit -m "docs: refresh images" && git push
```

Do not add `icon`, `documentationUrl`, `supportUrl`, `privacyPolicyUrl` or `termsOfServiceUrl` to `plugin.json`: Claude Code does not read them and the scan reports each as a finding. Set them in the submission portal.
Also keep environment reads and sensitive-looking names (see `RISKY` in `tools/validate.mjs`) out of code, workflows and manifests: the directory scan reads them as a credential that could leave the machine, and `npm run validate` fails on them.

## Layout

| Path | What it is |
| --- | --- |
| `skills/rup-flow/` | The skill: `SKILL.md`, `references/`, `templates/`, `scripts/rup.mjs`, `runtime/compose.yaml` |
| `agents/` | `rup-architect` and `rup-reviewer` |
| `.claude-plugin/` | Plugin and marketplace manifests |
| `docs/images/` | Gallery images; the user documentation lives in the [wiki](https://github.com/hector-ae21/rup-flow/wiki) |
| `examples/` | Generated sample documentation |
| `tools/` | Repository tooling (icon, web package, validation) |
| `test/` | CLI tests |

## Rules

- `SKILL.md` stays short; detail goes in `references/` and is loaded on demand.
- The `description` in `SKILL.md` is at most 200 characters (claude.ai limit); `npm run validate` enforces it.
- A new template needs an entry in `init` or `new use-case` in `rup.mjs` and a test.
- Templates and references are written in English. Generated documentation language is the user's `docLanguage`.
- Keep the version equal in `package.json`, `.claude-plugin/plugin.json` and `SKILL.md` (`metadata.version`).
- Keep agent-specific behaviour out of `skills/rup-flow/`; adapters are listed in [the wiki page Architecture](https://github.com/hector-ae21/rup-flow/wiki/Architecture), which also explains how to add a client.

## Pull requests

Work on a branch, use [Conventional Commits](https://www.conventionalcommits.org/) (`feat(cli): ...`), and open a pull request. CI must pass (`CI complete`). Describe the why in the body.

## Releasing

1. Move `Unreleased` entries to a new `## [x.y.z]` section in `CHANGELOG.md`.
2. Bump the version in `package.json` and `.claude-plugin/plugin.json`.
3. Merge to `main`, then tag: `git tag vX.Y.Z && git push origin vX.Y.Z`.
4. The release workflow publishes `rup-flow-skill.zip` (the file users upload to claude.ai).

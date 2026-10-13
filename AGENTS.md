# AGENTS.md

Instructions for coding agents (Codex, Claude Code, Cursor, Copilot, Gemini CLI and others) working **on this repository**. To *use* the skill in your own project, read [docs/other-agents.md](docs/other-agents.md).

## What this repository is

`rup-flow` is a portable skill in the open [Agent Skills](https://agentskills.io/specification) format: it moves a project between requirements, RUP documentation and code. The portable core is `skills/rup-flow/`. Everything else is an adapter or tooling around it.

| Path | Role |
| --- | --- |
| `skills/rup-flow/SKILL.md` | The skill. Keep it short; detail lives in `references/` |
| `skills/rup-flow/references/` | Methodology, loaded on demand |
| `skills/rup-flow/templates/` | Artifact templates (`mermaid/` holds the Mermaid variants) |
| `skills/rup-flow/scripts/rup.mjs`, `scripts/lib/` | Dependency-free CLI (Node 18+) |
| `agents/` | Claude Code subagents (`rup-architect`, `rup-reviewer`) |
| `.claude-plugin/` | Claude Code plugin and marketplace manifests |
| `install.mjs` | Installer for Claude Code and for `.agents/skills` clients |
| `tools/` | Repository tooling: validation, web ZIP, icon, gallery |
| `docs/`, `examples/` | User documentation and a rendered example |
| `test/` | `node:test` suites |

## Commands

```bash
npm run check          # validation + tests; must pass before a commit
npm test               # tests only
npm run validate       # skill, plugin and link consistency
node tools/package-web.mjs    # builds dist/rup-flow-skill.zip
node tools/build-gallery.mjs  # regenerates docs/images (needs Docker; Chrome or Edge for screenshots)
```

There are no runtime dependencies and nothing to install.

## Rules

- Keep the plugin tree free of binary files (PNG, JPEG, fonts), of `process.env` reads in `skills/`, and of `icon`/`documentationUrl`/`supportUrl` in `plugin.json`: the directory scan reports them as findings. Images that need a binary format live on the `docs-assets` branch (see CONTRIBUTING.md). `npm run validate` enforces the binary and manifest rules.
- Do not add dependencies. The CLI must run with a plain Node.js 18+ installation.
- `SKILL.md` frontmatter follows the Agent Skills spec: `name` equals the folder name, `description` is at most 200 characters (the claude.ai limit; the spec allows 1024), `license` is present. `npm run validate` enforces this.
- The same version appears in `package.json`, `.claude-plugin/plugin.json` and `SKILL.md` (`metadata.version`).
- The theme is applied at render time: never write colors or theme blocks into diagram sources.
- Keep behaviour that is specific to one agent out of `skills/rup-flow/`. Put it in an adapter (`agents/`, `.claude-plugin/`, `install.mjs` targets, `instructions.mjs` targets) and document it in `docs/other-agents.md`.
- Templates and references are written in English; generated documentation follows the user's `docLanguage`.
- Add or update a test for every CLI behaviour change.

## Pull requests

Work on a branch, use Conventional Commits (`feat(cli): ...`), and open a pull request; CI must pass (`CI complete`). Describe the why. Do not push to `main`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Shell note

Some agent shells strip backslashes from heredocs and `node -e` strings. When a change involves regular expressions or escapes, edit the file with the agent's file-editing tool instead.

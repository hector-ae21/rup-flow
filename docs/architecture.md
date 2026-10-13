# Architecture

rup-flow has three layers. Only the first one holds behaviour; the others adapt it to a client.

```
┌─────────────────────────────────────────────────────────────┐
│ 3. Distribution       plugin · web ZIP · release · installer │
├─────────────────────────────────────────────────────────────┤
│ 2. Adapters           subagents · instruction files · targets │
├─────────────────────────────────────────────────────────────┤
│ 1. Portable core      skills/rup-flow  (Agent Skills format) │
│                       SKILL.md · references · templates · CLI │
└─────────────────────────────────────────────────────────────┘
```

## 1. Portable core: `skills/rup-flow/`

| Part | Responsibility | Change it when |
| --- | --- | --- |
| `SKILL.md` | When to use the skill, operating rules, workflow routing, CLI table | The behaviour or routing changes |
| `references/` | Methodology and rules, loaded on demand | A method, rule or convention changes |
| `templates/` | The artifacts a project starts from, in PlantUML and Mermaid | An artifact format changes |
| `scripts/rup.mjs` | Command dispatch and the document pipeline | A command or the structure changes |
| `scripts/lib/themes.mjs` | Palettes and theme application | A preset or style rule changes |
| `scripts/lib/mermaid.mjs` | Mermaid rendering in a container | The Mermaid renderer changes |
| `scripts/lib/explorer.*` | The interactive viewer | The viewer changes |
| `scripts/lib/instructions.mjs` | Instruction blocks for agent files | A client gets or changes an instruction file |

Constraints that keep it portable: Node.js built-ins only, no network access except to the configured renderers, and no client-specific wording in `SKILL.md` or `references/`.

## 2. Adapters

| Adapter | Where | For |
| --- | --- | --- |
| Subagents | `agents/` | Claude Code |
| Plugin manifests | `.claude-plugin/` | Claude Code plugin marketplace and Anthropic directory |
| Install targets | `TARGETS` in `install.mjs` | Where each client looks for skills (`.claude/`, `.agents/`) |
| Instruction targets | `INSTRUCTION_TARGETS` in `scripts/lib/instructions.mjs` | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Copilot, Cursor |

## 3. Distribution

| Channel | Built by |
| --- | --- |
| Claude Code marketplace | `.claude-plugin/marketplace.json` |
| claude.ai upload | `tools/package-web.mjs` → `rup-flow-skill.zip` |
| GitHub release | `.github/workflows/release.yml` on a `vX.Y.Z` tag |
| Folder install | `install.mjs` |

## Data flow of a render

```
rup.config.json ─► theme + language + outputs
sources (.puml / .mmd) ─► renderer (PlantUML server | mermaid-cli container) ─► themed .svg
.svg files ─► explorer.html (optional)
```

The theme is applied at render time and sources never carry colors, so a palette change re-renders everything without editing a diagram.

## Adding a client

1. **Reads Agent Skills from `.agents/skills`** (Codex and similar): nothing to change. Add a row to the compatibility table in [other-agents.md](other-agents.md).
2. **Reads Agent Skills from another folder**: add an entry to `TARGETS` in `install.mjs` (label, folder, whether it takes subagents), a test in `test/agents.test.mjs`, and a row in `other-agents.md`.
3. **Reads an instruction file**: add an entry to `INSTRUCTION_TARGETS` (file, default skill path, optional frontmatter), a test, and a row in `other-agents.md`.
4. **Needs a bespoke package**: create it as a distribution channel that is generated from `skills/rup-flow/` (like `package-web.mjs`), never a fork of the skill.
5. Run `npm run check`.

## Versioning

One version, in `package.json`, `.claude-plugin/plugin.json` and `SKILL.md` (`metadata.version`); `npm run validate` fails if they differ. Releases are tags `vX.Y.Z` built by the release workflow. Tags are protected and never moved: a bad release is fixed by a new patch version, and a deleted release is recreated from the same tag with `gh workflow run release.yml -f tag=vX.Y.Z`.

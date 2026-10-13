---
name: rup-flow
description: Generate RUP docs (domain model, use cases, analysis, design, PlantUML) from requirements or code, and generate code from the models. Audits gaps and traceability.
license: MIT
compatibility: Needs Node.js 18+. Docker is optional and only renders diagrams and builds the explorer. Works with any agent that reads Agent Skills.
metadata:
  author: hector-ae21
  version: "0.3.2"
  repository: https://github.com/hector-ae21/rup-flow
---

# rup-flow

Two-way bridge between RUP documentation and code, with one fixed documentation structure and configurable output paths.

```
requirements ──► RUP models + diagrams ──► code
      ▲                  │  ▲                 │
      └── questions ◄────┘  └── reverse ◄─────┘
```

## Operating rules

1. Read `rup.config.json` in the project root first. If it does not exist, run `init` (see CLI) and ask only for what is missing: project objective, direction of work and output directory.
2. Every statement in a document carries one provenance: **confirmed** (the user said it), **observed** (found in code, with `path:line`), **assumed** (proposed by you) or **open** (a question). Never present an assumption or an inference as confirmed. Unknown business rules go to `open-questions.md`, not into the model.
3. Never invent permissions, rules, states or attributes to make a document look complete.
4. Output goes where the config says (`outDir` and `paths`). Do not hard-code folder names; resolve them from the config. A path given by the user in the request overrides the config for that run.
5. Diagrams are `.puml` (PlantUML, default) or `.mmd` (Mermaid) sources rendered to `.svg` next to them, in the language and theme of the config; never style a diagram by hand, the theme is applied at render time. Markdown references the SVG with a relative path. Do not claim a diagram is rendered or visually checked unless you ran the render and looked at the result.
6. Write documents in `docLanguage`; keep file names, IDs, front-matter keys and PlantUML identifiers in English.
7. Keep a single source of truth per artifact (`sourceOfTruth` in front matter) and update dependent artifacts and the traceability table in the same change.

## Pick the workflow

| User intent | Read | Direction |
| --- | --- | --- |
| Requirements or idea to documentation | [methodology](references/methodology.md), [domain-model](references/domain-model.md), [use-cases](references/use-cases.md), [analysis-design](references/analysis-design.md) | requirements → RUP |
| Existing code to documentation | [code-to-rup](references/code-to-rup.md) | code → RUP |
| Models or diagrams to code | [rup-to-code](references/rup-to-code.md) | RUP → code |
| Code and docs already exist and may disagree | [sync](references/sync.md) | both |
| Review, gaps, audit | [quality](references/quality.md) | review |
| Draw or fix a diagram | [diagram-conventions](references/diagram-conventions.md) | any |
| Mermaid, color palette, theme, font, PNG, interactive explorer | [formats-and-themes](references/formats-and-themes.md) | any |
| Folder layout, config, front matter | [structure](references/structure.md) | any |

Load only the references the task needs.

## CLI

All commands run from the project root. `RUP` below means `node <skill-dir>/scripts/rup.mjs`, where `<skill-dir>` is the directory that contains this SKILL.md (use its absolute path).

| Command | Effect |
| --- | --- |
| `RUP init [--out docs/rup] [--lang es] [--project name] [--diagram-language mermaid] [--theme ocean]` | Create `rup.config.json` and the documentation skeleton. Never overwrites. |
| `RUP new use-case createOrder --title "Create order" --actor Admin --package Ordering --goal "..." [--includes a,b] [--extends c]` | Scaffold the use case (cards for requirements, analysis, design and implementation/tests), add its traceability row and refresh the index. |
| `RUP index` | Regenerate the use-case index table and the use-case diagrams (general and per actor) from the cards. Run it after editing a card's front matter. |
| `RUP scan [--code-root src] [--write]` | Inventory of the code base to start code → RUP. |
| `RUP server up` / `down` / `health` | PlantUML server in Docker (default `http://127.0.0.1:8085`). |
| `RUP render [--path dir] [--force] [--outputs svg,png,html] [--theme name]` | Render every `.puml` (PlantUML server) and `.mmd` (Mermaid container) to a themed `.svg`; optional PNG previews and explorer. |
| `RUP explore` | Build `explorer.html`, an interactive viewer of every rendered diagram. |
| `RUP themes` | List the color presets. |
| `RUP check [--strict]` | Structure, links, diagrams and traceability gaps. |
| `RUP config` | Show the resolved configuration. |
| `RUP instructions --target agents,cursor,...` | Add or refresh the rup-flow block in an agent instruction file (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Copilot, Cursor). |

Flags override `rup.config.json`.

## Standard loop

```
understand → list gaps and questions → model → write artifacts → render → check → review
```

Finish each run by reporting: files created or changed, open questions, checks that were not executed, and the next step.

## Subagents

If the agent supports subagents (Claude Code does), delegate generation to `rup-architect` and an independent pass to `rup-reviewer`, and do not nest them. Without subagents, do the review as a separate pass after generating, following `references/quality.md`, and keep it read-only.

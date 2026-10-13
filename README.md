<p align="center"><img src="assets/icon.png" alt="rup-flow" width="120"></p>

<h1 align="center">rup-flow</h1>

<p align="center">A Claude skill that moves a project between <b>requirements, RUP documentation and code</b>, in both directions.<br>One fixed documentation structure, PlantUML diagrams rendered to SVG, every path configurable.</p>

```
requirements ──► domain model · use cases · analysis · design ──► code
                                  ▲                                │
                                  └────────── reverse ◄────────────┘
```

## What you can do

| You say | You get |
| --- | --- |
| "Document this system: ..." | Domain model by importance level, actors, requirements, use cases (card + specification + wireframes), analysis, design, traceability |
| "Add the use case cancelOrder" | The use case across requirements, analysis and design, dictionary and traceability updated |
| "Reverse engineer `src/`" | The same documentation derived from code, each statement cited with `path:line` |
| "Implement UC-001 from the design" | Code, tests and `@rup` trace links generated from the models |
| "Does the code still match the docs?" | A table of differences (model ahead, code ahead, conflict, dead) |
| "Audit the documentation" | Findings with evidence, severity, impact and fix |

It never invents business rules: unknowns become questions, and each statement is marked confirmed, observed, assumed or open. See a finished set in [examples/shop](examples/shop/README.md).

## Install

Pick one. Full step-by-step guides are linked.

| Where | Command | Guide |
| --- | --- | --- |
| **Claude Code** (recommended) | `claude plugin marketplace add hector-ae21/rup-flow` then `claude plugin install rup-flow@rup-flow` | [Install in Claude Code](docs/install-claude-code.md) |
| Claude Code, without plugins | `git clone https://github.com/hector-ae21/rup-flow && cd rup-flow && node install.mjs` | same guide, option B |
| **Claude on the web** | Upload `rup-flow-skill.zip` from the [latest release](https://github.com/hector-ae21/rup-flow/releases/latest) in **Customize → Skills** | [Install on the web](docs/install-claude-web.md) |
| **Codex and other Agent Skills clients** | `node install.mjs --target agents` (installs into `.agents/skills`) | [Other agents](docs/other-agents.md) |
| Cursor, Copilot, Gemini CLI | `node <skill>/scripts/rup.mjs instructions --target agents,cursor,copilot,gemini` | [Other agents](docs/other-agents.md) |

The skill is written once in the open [Agent Skills](https://agentskills.io/specification) format and adapted per client; tested with Claude Code, Codex and Gemini CLI; Cursor and Copilot follow the vendors' documented layouts and are not yet tested (see the [compatibility table](docs/other-agents.md#compatibility)).

Requirements: Node.js 18+. Docker is optional and only renders `.svg` diagrams and builds the explorer (not available on the web: render locally).

## What it looks like

Diagrams in **PlantUML** or **Mermaid**, in any of eight color presets or your own palette, and an **interactive explorer** you can open by double-click.

<p align="center"><img src="docs/images/explorer/explorer-overview.png" alt="Interactive explorer: selecting Order highlights its relations" width="860"></p>

| ocean | forest | dark |
| --- | --- | --- |
| <img src="docs/images/themes/ocean.svg" width="230"> | <img src="docs/images/themes/forest.svg" width="230"> | <img src="docs/images/themes/dark.svg" width="230"> |

| Use-case specification | Sequence | Mermaid domain model |
| --- | --- | --- |
| <img src="docs/images/diagrams/specification.svg" width="230"> | <img src="docs/images/diagrams/sequence.svg" width="230"> | <img src="docs/images/mermaid/domain-model.svg" width="230"> |

All eleven diagram types explained with images: [diagram types](docs/diagram-types.md). Languages, outputs and palettes: [formats and themes](docs/formats-and-themes.md). The viewer: [explorer](docs/explorer.md).

```bash
node rup.mjs init --diagram-language mermaid --theme ocean --outputs svg,html
```

## First use

```
Use rup-flow to document this system in docs/rup, in English:
<what it is, who uses it, what they do>
```

Claude creates `rup.config.json`, the documentation tree, asks about what it cannot know, renders the diagrams and runs the checks. Start at `docs/rup/README.md`.

## What it generates

```
<outDir>/                      default docs/rup, configurable
├── 00-domain-model/           levels, dictionary, rules, diagrams
├── 01-requirements/           actors, RF/RNF, use-cases/<name>/{README, specification, wireframes}
├── 02-analysis/               analysis classes, use-cases/<name>/collaboration
├── 03-design/                 design classes, sequences, data model, deployment, configuration
├── 04-implementation/         code map, code inventory
└── 05-quality/                profile, traceability, open questions, audit, decisions
```

Output folder, folder names, language, identifier prefixes and target stack are set in `rup.config.json`, by flag, by environment variable, or in your prompt. See the [reference](docs/reference.md).

## Documentation

| Read | For |
| --- | --- |
| [Getting started](docs/getting-started.md) | The shortest path |
| [Usage guide](docs/usage.md) | Every workflow with copy-paste prompts |
| [Reference](docs/reference.md) | Configuration, CLI, artifacts, front matter |
| [Diagram types](docs/diagram-types.md) | The eleven diagrams, with images |
| [Formats and themes](docs/formats-and-themes.md) | PlantUML or Mermaid, outputs, palettes |
| [Explorer](docs/explorer.md) | The interactive viewer |
| [Rendering](docs/rendering.md) | The PlantUML and Mermaid Docker renderers |
| [Troubleshooting](docs/troubleshooting.md) | Symptoms and fixes |
| [Other agents](docs/other-agents.md) | Codex, Cursor, Copilot, Gemini CLI |
| [Architecture](docs/architecture.md) | Layers, adapters, how to add a client |
| [Publishing](docs/publishing.md) | Releases and listing (maintainers) |
| [Contributing](CONTRIBUTING.md) | Development and PRs |

## Included

- Skill `rup-flow` with methodology references, 30+ templates and a dependency-free CLI
- Agents `rup-architect` (generates) and `rup-reviewer` (read-only audit)
- Plugin and marketplace manifests, an installer, web ZIP packaging, CI, releases

## Limits

`check` validates structure, links and traceability gaps. It does not prove UML is semantically correct or that diagrams have no crossing lines: look at the rendered images. Generated code is only as good as the reviewed models and the project's tests; Claude reports what it could not build or run.

## License

[MIT](LICENSE)

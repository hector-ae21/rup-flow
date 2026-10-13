# Reference

## Configuration — `rup.config.json`

Created by `init` in the project root. Every key is optional.

| Key | Default | Meaning |
| --- | --- | --- |
| `project` | folder name | Name used in the documents |
| `outDir` | `docs/rup` | Root of the generated documentation, relative to the project |
| `paths.domain` | `00-domain-model` | Folder of the domain model |
| `paths.requirements` | `01-requirements` | Folder of requirements |
| `paths.analysis` | `02-analysis` | Folder of analysis |
| `paths.design` | `03-design` | Folder of design |
| `paths.implementation` | `04-implementation` | Folder of the code map |
| `paths.quality` | `05-quality` | Folder of profile, traceability, audit |
| `useCaseDir` | `use-cases` | Subfolder holding one folder per use case |
| `docLanguage` | `en` | Language of generated prose (file names, IDs and keys stay English) |
| `codeRoot` | `.` | Where `scan` reads and where generated code goes |
| `plantuml.url` | `http://127.0.0.1:8085` | PlantUML server |
| `plantuml.timeoutMs` | `30000` | Request timeout |
| `diagrams.language` | `plantuml` | `plantuml` or `mermaid`: language of the diagram sources and templates |
| `diagrams.outputs` | `["svg"]` | Any of `svg`, `png` (previews, PlantUML only), `html` (interactive explorer) |
| `theme.preset` | `default` | `default`, `ocean`, `forest`, `sunset`, `grape`, `mono`, `dark`, `high-contrast` |
| `theme.colors` | `{}` | Overrides: `background`, `text`, `line`, `border`, `primary`, `secondary`, `accent`, `note` (`#RRGGBB`), `levels` (four colors) |
| `theme.font`, `theme.fontSize`, `theme.roundCorner` | Verdana, 14, 6 | Typography and corners |
| `mermaid.image` | pinned mermaid-cli image | Container that renders `.mmd` |
| `ids.*` | `RF`, `RNF`, `UC`, `RN`, `DEC`, `TC` | Identifier prefixes |
| `targetStack` | empty | `language`, `framework`, `persistence`, `testing` for code generation |
| `traceTag` | `@rup` | Doc-comment tag that links code to the model |

Precedence, highest first: command-line flags, environment variables, the config file, defaults. Environment variables: `RUP_OUT_DIR`, `RUP_LANG`, `RUP_PLANTUML_URL`. A path stated in your prompt overrides the config for that run.

If you change `outDir` or `paths` on a project that already has documentation, move the folders and fix the links as one step.

## CLI

```
node <skill-dir>/scripts/rup.mjs <command> [flags]
```

| Command | Effect |
| --- | --- |
| `init` | Creates the config and the skeleton. Never overwrites. |
| `new use-case <camelName>` | Scaffolds requirements, analysis and design for a use case, next free ID, traceability row |
| `scan [--write] [--limit n]` | Inventory: extensions, manifests, entities, entry points, services, persistence, tests, contracts |
| `render [--path dir] [--force] [--outputs svg,png,html] [--theme name]` | `.puml` and `.mmd` → themed `.svg`; up-to-date files are skipped, a theme change re-renders all |
| `explore` | Build `explorer.html`, an interactive viewer of every rendered diagram |
| `themes [--json]` | List the color presets |
| `check [--strict]` | Diagram balance, missing SVGs, broken links, front matter, missing realizations, traceability gaps. `--strict` fails on warnings |
| `server up\|down` | Start or stop the PlantUML container |
| `health` | Render a test diagram through the configured server |
| `config` | Print the resolved configuration |

Flags: `--root <dir>`, `--out <dir>`, `--lang <code>`, `--project <name>`, `--code-root <dir>`, `--plantuml-url <url>`, `--force`, `--diagram-language <plantuml|mermaid>`, `--outputs <list>`, `--preview-png`, `--theme <preset>`, `--font <name>`, `--font-size <n>`, `--color-<key> "#RRGGBB"` (see [formats and themes](formats-and-themes.md)). For `new use-case`: `--title`, `--actor`, `--requirement`, `--discipline requirements,analysis,design`, `--id`.

Exit codes: `0` success; `1` errors (or warnings with `--strict`, or failed renders).

## Generated artifacts

| Folder | Files |
| --- | --- |
| Domain | `README.md` (levels, dictionary, rules), `domain-model.puml`, `domain-model-simple.puml`, `entity-states/` |
| Requirements | `README.md`, `actors.md`, `requirements.md`, `use-cases/<name>/{README.md, specification.puml, wireframes.puml}` |
| Analysis | `README.md`, `class-diagram.puml`, `use-cases/<name>/{README.md, collaboration.puml}` |
| Design | `README.md`, `class-diagram.puml`, `project-configuration.md`, `data-model/`, `deployment/`, `use-cases/<name>/{README.md, sequence.puml}` |
| Implementation | `README.md`, `code-map.md`, `code-inventory.json` |
| Quality | `project-profile.md`, `traceability.csv`, `open-questions.md`, `audit.md`, `decisions/` |

## Front matter

Every document starts with `id`, `name`, `status` (`draft`, `reviewed`, `approved`), `origin` (`requirements`, `code`, `diagram`) and `sourceOfTruth` (`model` or `code`). Identifiers: `RF-001`, `RNF-001`, `UC-001`, `RN-001`, `DEC-001`, `TC-001`, `Q-001`. They are never reused.

## Domain levels

| Level | Meaning |
| --- | --- |
| 1 Core | The objective cannot be met without it |
| 2 Structural | Depends directly on level 1 |
| 3 Detail | Qualifies or breaks down level 2 |
| 4 Support | Catalogues, audit, configuration |

Level is drawn top to bottom. It is a reading aid, not inheritance or composition.

## Provenance marks

confirmed (you said it) · observed (`path:line` in code) · assumed (proposed, needs confirmation) · open (a question).

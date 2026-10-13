# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.0]

### Added

- One card per discipline for every use case (requirements, analysis, design, implementation and tests), each starting with the same navigation table, plus the implementation card with code and tests tables.
- `index` command and generated block in the requirements README: use-case table with links to every discipline, the general use-case diagram (actors outside the system boundary, use cases grouped in packages, `include` and `extend`) and one diagram per actor. `new use-case` takes `--package`, `--goal`, `--includes` and `--extends`; `check` warns when the index is stale.
- Component diagram template (PlantUML and Mermaid) and its section in the design README.
- Explorer: global search across the text of every diagram, grouping by discipline or by use case, previous and next navigation, links between the diagrams of one use case, a Document tab that renders the cards and follows their links, relation tracing with direct or all-reachable depth, PNG and SVG export, copy source and link, full screen, keyboard shortcuts and richer deep links.

### Changed

- The example shop now has four use cases in two packages and two actors, and a component diagram.

## [0.2.0]

### Changed

- The user documentation moved to the GitHub wiki; the README is now a short pitch with install steps that links to it. The repository keeps only the gallery images.

## [0.1.5]

### Changed

- Removed the gallery browser option and turned the repository commands in AGENTS.md into npm scripts, the last two texts the directory scan read as a credential leaving the machine.

## [0.1.4]

### Changed

- Renamed identifiers and literals that the directory scan misread as credential handling (variables named key, the SVG namespace URL, the --chrome option).

## [0.1.3]

### Changed

- The plugin tree has no binary files, no `process.env` reads and no listing-only fields in `plugin.json`, so the directory scan has nothing to report: the icon PNG and explorer screenshots moved to the `docs-assets` branch, the icon and URLs are set in the submission portal, the CLI reads only flags and `rup.config.json`, PlantUML requests live in their own module, and the release workflow no longer runs Node. Validation enforces these rules. Added PRIVACY.md.

## [0.1.2]

### Changed

- Compatibility table: Codex and Gemini CLI are marked as tested by the maintainer; Cursor and Copilot remain untested.

## [0.1.1]

### Added

- Portable across agents: `install.mjs --target claude|agents|codex|all` (installs into `.claude` or the `.agents/skills` location used by Codex and similar clients) and `rup.mjs instructions --target ...` (marked, idempotent blocks for `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Copilot and Cursor).
- `AGENTS.md` for agents working on the repository, `docs/other-agents.md` with a compatibility table, and `docs/architecture.md` with the layers and how to add a client.
- `SKILL.md` frontmatter now carries `license`, `compatibility` and `metadata`, and validation enforces the Agent Skills naming rules and a single version across files.

### Fixed

- Directory validation holds that were avoidable: the Docker server command no longer forwards the whole environment, CI waits for the server through the CLI instead of `curl`, and gallery SVGs have short path lines.
- Release title is the tag alone, and a deleted release can be recreated from its tag with `workflow_dispatch`.

## [0.1.0]

### Added

- `rup-flow` skill: requirements → RUP, code → RUP, RUP → code, sync and audit workflows.
- Fixed documentation structure with configurable output directory, folder names, language and identifier prefixes.
- CLI (`init`, `new use-case`, `scan`, `render`, `check`, `server`, `health`, `config`) with no dependencies.
- PlantUML rendering to SVG through a Docker server (sandbox profile, loopback only).
- Mermaid as an alternative diagram language (`diagrams.language`), rendered by a pinned mermaid-cli container.
- Eight color presets plus custom palettes, fonts and level colors (`theme`), applied at render time.
- `diagrams.outputs`: `svg`, `png` previews and an interactive `explorer.html` (pan, zoom, search, relation highlighting, source, dark view, deep links).
- `explore` and `themes` commands; `tools/build-gallery.mjs` regenerates the documentation images.
- Agents `rup-architect` and `rup-reviewer`.
- Claude Code plugin and marketplace manifests, installer, web ZIP packaging and icon generator.

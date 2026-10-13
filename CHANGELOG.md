# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

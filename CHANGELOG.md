# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

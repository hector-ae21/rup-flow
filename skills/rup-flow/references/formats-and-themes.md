# Diagram languages, outputs and themes

Read this when the user mentions Mermaid, a color palette, a theme, fonts, interactive diagrams, PNG, or "how it looks".

## Settings in `rup.config.json`

| Key | Values | Effect |
| --- | --- | --- |
| `diagrams.language` | `plantuml` (default), `mermaid` | Language of the diagram sources you write and of the templates `init` and `new use-case` create |
| `diagrams.outputs` | any of `svg`, `png`, `html` | What `render` produces. `svg` is what Markdown embeds. `png` writes `.preview.png` (PlantUML only). `html` builds `explorer.html` |
| `theme.preset` | `default`, `ocean`, `forest`, `sunset`, `grape`, `mono`, `dark`, `high-contrast` | Palette |
| `theme.colors` | `background`, `text`, `line`, `border`, `primary`, `secondary`, `accent`, `note` as `#RRGGBB`; `levels` as four `#RRGGBB` | Overrides on top of the preset |
| `theme.font`, `theme.fontSize`, `theme.roundCorner` | font family, number, number | Typography and corners |

Flags with the same meaning: `--diagram-language`, `--outputs`, `--theme`, `--color-<key>`, `--font`, `--font-size`. Ask the user once, at `init`, which language and theme they want if it is not already in the config or the prompt.

## Writing sources

- The theme is applied at render time. **Never write colors, `skinparam` color lines, `%%{init}%%` blocks or `classDef` color definitions into a diagram** to style it; that overrides the user's palette.
- Domain model bands: in PlantUML tag each level package `<<level1>>`…`<<level4>>`; in Mermaid tag each class `:::level1`…`:::level4`. The renderer colors them from `theme.colors.levels`.
- Keep stereotypes `<<boundary>>`, `<<control>>`, `<<entity>>` in analysis diagrams: they are content.
- Wireframes are always PlantUML salt (`wireframes.puml`), also when `diagrams.language` is `mermaid`; Mermaid has no wireframe diagram.
- `render` handles `.puml` and `.mmd` together. Do not mix languages for the same diagram.

## Mermaid equivalents

| Artifact | Mermaid type | Notes |
| --- | --- | --- |
| Domain model, analysis classes, design classes | `classDiagram` with `direction TB` | Levels via `:::levelN` |
| Entity states, specification | `stateDiagram-v2` | The composite state carries the use-case name; narrate Actor/System with notes |
| Collaboration | `flowchart TB` | Number the edge labels |
| Sequence | `sequenceDiagram` | `alt`/`else` for failure paths |
| Data model | `erDiagram` | |
| Deployment | `flowchart TB` with `subgraph` | |

Quote labels containing parentheses, colons or `<br/>`: `A -->|"2: createOrder(lines)"| B`.

## Rendering

- PlantUML: server in Docker (`server up`).
- Mermaid: mermaid-cli in Docker, pulled on first use (about 1 GB); no `server up` needed. Docker must be running.
- Changing the theme re-renders everything on the next `render`.

## Explorer

`render --outputs svg,html` or `explore` writes `<outDir>/explorer.html`: pan, zoom, search, element and relation highlighting (PlantUML), source tab, SVG download, dark view, deep links. It is built from rendered SVGs; run `render` first. Mention it to the user when they ask for interactive or navigable diagrams.

## Reporting

After rendering say which language, outputs and theme were used, how many diagrams rendered, and that the visual check is still the user's unless you looked at the images.

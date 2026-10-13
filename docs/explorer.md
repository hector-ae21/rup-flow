# Interactive explorer

`explorer.html` is one self-contained page that opens every rendered diagram of the project in a viewer. No server, no internet, no install: double-click it. It works for PlantUML and Mermaid diagrams alike because it is built from the rendered SVGs.

## Build it

```bash
node rup.mjs render --outputs svg,html     # render and build
node rup.mjs explore                       # rebuild from the SVGs that already exist
```

Or set `"diagrams": { "outputs": ["svg", "html"] }` once and every `render` refreshes it. The file is written to `<outDir>/explorer.html` and uses the project's theme.

## What you can do

![Explorer overview](https://raw.githubusercontent.com/hector-ae21/rup-flow/docs-assets/explorer/explorer-overview.png)

| Action | How |
| --- | --- |
| Open any diagram | Click it in the sidebar, grouped by discipline |
| Filter diagrams | Type in the filter box (`/` focuses it) |
| Pan | Drag |
| Zoom | Mouse wheel, `+` / `−`, or the buttons |
| Fit to window / actual size | `Fit` (`f`) / `100%` |
| Highlight an element and its relations | Click a class, entity, state or participant; everything unrelated fades and the panel lists what it is connected to. `Esc` clears |
| Find text | Type in "Find in diagram": matches are marked and elements without a match fade |
| Read the source | `Source` tab shows the `.puml` or `.mmd` |
| Download | `Download SVG` saves the diagram without the highlight state |
| Go to the document | `Open document` opens the Markdown next to the diagram |
| Dark view | `Dark` inverts the page and the diagram |

Highlighting uses the relations PlantUML records in its SVG. In Mermaid diagrams pan, zoom, search and selection of a node work; the relation panel is a PlantUML feature.

### Specification and sequence diagrams

![Specification in the explorer](https://raw.githubusercontent.com/hector-ae21/rup-flow/docs-assets/explorer/explorer-specification.png)

### Searching inside a diagram

![Search in the explorer](https://raw.githubusercontent.com/hector-ae21/rup-flow/docs-assets/explorer/explorer-search.png)

### The source tab

![Source tab](https://raw.githubusercontent.com/hector-ae21/rup-flow/docs-assets/explorer/explorer-source.png)

### Dark view

![Dark view](https://raw.githubusercontent.com/hector-ae21/rup-flow/docs-assets/explorer/explorer-dark.png)

## Deep links

The page reads its state from the URL hash, so you can link to a view:

```
explorer.html#d=00-domain-model/domain-model.svg&select=Order
explorer.html#d=03-design/class-diagram.svg&find=Service
explorer.html#d=...&tab=source
explorer.html#d=...&dark=1
```

`d` is the path of the SVG relative to the documentation root.

## Sharing

The file embeds everything. Attach it to an email, drop it in a wiki or publish it with the rest of the site. It makes no network requests.

## Limits

- The explorer shows what was rendered: run `render` first.
- It is a viewer, not an editor. Change the `.puml` or `.mmd` and render again.
- Very large projects produce a large HTML file (the SVGs are embedded).

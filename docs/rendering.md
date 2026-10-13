# Rendering diagrams

Diagrams are written as `.puml` and rendered to `.svg` by a PlantUML server in Docker. Markdown embeds the `.svg`, so documentation reads without the server running.

## Start the server

```bash
node <skill-dir>/scripts/rup.mjs server up
node <skill-dir>/scripts/rup.mjs health      # expect: OK: http://127.0.0.1:8085 rendered a test SVG
```

`<skill-dir>` is `~/.claude/skills/rup-flow` for an installer or manual install; for the plugin, ask Claude to start the server. Stop it with `server down`.

Without the CLI:

```bash
docker run -d --name rup-flow-plantuml -p 127.0.0.1:8085:8080 -e PLANTUML_SECURITY_PROFILE=SANDBOX plantuml/plantuml-server:jetty
```

## Render

```bash
node <skill-dir>/scripts/rup.mjs render              # whole documentation tree
node <skill-dir>/scripts/rup.mjs render --path docs/rup/03-design --force
node <skill-dir>/scripts/rup.mjs render --preview-png
```

A file with several `@start…/@end…` blocks produces `name-01.svg`, `name-02.svg`. Failures list the file and error; a syntax error is reported as a failure, not saved as an image.

## Mermaid

Mermaid sources (`.mmd`) are rendered by the mermaid-cli container; there is nothing to start. The first render pulls the image (about 1 GB) and later renders reuse it. Docker must be running. All `.mmd` files of one run share a single container start.

Wireframes are always PlantUML, so a Mermaid project still needs the PlantUML server (`server up`) to render `wireframes.puml`. Everything else renders without it.

## Themes and outputs

Both renderers apply the project theme at render time. `--outputs svg,png,html` also writes PNG previews (PlantUML) and the interactive explorer. See [formats and themes](formats-and-themes.md).

## Another port or an existing server

Set `plantuml.url` in `rup.config.json`, or use `--plantuml-url`. For a different host port when starting: `server up --plantuml-url http://127.0.0.1:9000`.

## Security

The container binds to `127.0.0.1` only and runs with the `SANDBOX` profile: diagrams cannot read files or fetch URLs, so do not use `!include` of local files or URLs. Do not publish the port to a network without authentication.

## Visual check

`check` confirms the SVGs exist and the links resolve; it cannot see crossing lines. Open the SVGs (or ask Claude to inspect the previews) and see [diagram conventions](../skills/rup-flow/references/diagram-conventions.md) for how to fix layout.

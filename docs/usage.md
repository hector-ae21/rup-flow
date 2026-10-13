# Usage guide

Every prompt below works as written; replace the parts in `<...>`. You can name the output folder or language in any prompt and it overrides `rup.config.json` for that run. To make it permanent, edit the config (see [Reference](reference.md)).

## 1. Requirements → documentation

```
Use rup-flow to document this system in docs/rup.
Language: English.
Objective: <one sentence>
Users: <actors and what each wants>
Needs: <requirements, rules, constraints>
```

What Claude does: creates the config, asks only blocking questions, writes the domain model with levels, actors and requirements, one use case per goal (card, specification, wireframes), then analysis and design realizations, renders and checks.

You get: the tree described in [Getting started](getting-started.md), with traceability rows for every use case.

Tip: the more you say about the objective, the better the levels in the domain model. Level 1 is whatever the objective cannot do without.

## 2. Add or change one use case

```
Use rup-flow to add the use case <name> for <actor>: <what they achieve>. Update the domain model if it needs new entities.
```

It runs `new use-case`, fills the three disciplines, updates the dictionary and the traceability table.

## 3. Existing code → documentation (reverse engineering)

```
Use rup-flow to reverse engineer <src folder> into RUP documentation in docs/rup. Ask me for the project objective first.
```

Claude inventories the code (`scan`), derives entities from persistence and models, use cases from entry points, and cites `path:line` for each. What it cannot understand becomes a question, never a guess. Large code bases are done by module; the audit lists what was not read.

## 4. Models → code (forward engineering)

```
Use rup-flow to implement UC-001 and UC-002 from the design. Stack: <language, framework, persistence, tests>. Put the code in <folder>.
```

Claude checks the use cases are `reviewed` (or asks), plans the files, generates entities, handlers, persistence, contracts and tests (one per flow and business rule), tags classes with `@rup UC-001`, runs your build and tests, and updates the code map and traceability. If the model lacks a decision, it stops and asks.

Save the stack once in `rup.config.json` (`targetStack`) and you will not be asked again.

## 5. Keep code and documentation aligned

```
Use rup-flow to check whether the code still matches the documentation and list the differences.
```

Each difference is classified (model ahead, code ahead, conflict, dead) with evidence, and nothing is rewritten until you choose a direction. The `sourceOfTruth` field of each artifact sets the default direction.

## 6. Audit

```
Use rup-reviewer to audit the documentation in docs/rup.
```

Read-only. Returns a findings table (severity, evidence, impact, fix) covering completeness, consistency, domain hierarchy, behaviour, traceability, diagrams, provenance and drift. It states which checks it could not run.

## 7. Diagrams

| Ask | Result |
| --- | --- |
| "Render the diagrams" | `.puml` and `.mmd` → `.svg` for the whole tree |
| "Use Mermaid instead of PlantUML" | Sources are written as `.mmd` (wireframes stay PlantUML) |
| "Use the ocean theme" / "make the primary color #FFE4E6" | The palette changes and every diagram re-renders |
| "Give me an interactive version" | Builds `explorer.html` |
| "Fix the crossing lines in the domain model" | Applies layout rules (bands, hidden links, splitting) and re-renders |
| "Split the design class diagram by module" | Several focused diagrams instead of one crowded one |

## 8. Look and format

```
Use rup-flow with Mermaid diagrams, the forest theme and an interactive explorer.
```

See [diagram types](diagram-types.md) for what each diagram looks like, [formats and themes](formats-and-themes.md) for languages, outputs and palettes, and [the explorer](explorer.md).

## Prompts for the CLI (optional)

You rarely need it, but every command is available; see [Reference](reference.md).

## What Claude will not do

- Present an assumption as a confirmed fact.
- Claim a diagram was visually checked unless it looked at the rendered image.
- Write outside the configured documentation and code folders.
- Overwrite your existing documents when initialising.

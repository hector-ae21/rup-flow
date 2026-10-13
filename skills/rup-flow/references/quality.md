# Quality and review

Run `RUP render` then `RUP check` before reviewing. Review is read-only unless the user asks for fixes.

## Review dimensions

| Dimension | Looks for |
| --- | --- |
| Completeness | RF without use case, use case without RF, missing analysis or design realization, missing wireframes or specification |
| Consistency | Names, attributes and rules differing between domain, use cases, analysis, design and data model |
| Domain hierarchy | Levels without justification, everything at level 1, relations that contradict the levels, positional meaning used as UML meaning |
| Behaviour | Flows without failure paths, preconditions not checked, states unreachable or without exit |
| Traceability | Empty cells in `traceability.csv`, IDs reused, `code-map` locations that do not exist |
| Non-functional | RNF without measure, security/permission rules missing for actors |
| Diagrams | Missing SVG, syntax errors, crossing or overlapping lines, unreadable labels, diagrams with too many elements |
| Provenance | Assumptions written as facts, rules without source |
| Drift | Differences with the code (see [sync](sync.md)) |

## Finding format

```
| ID | Severity | Finding | Evidence | Impact | Fix | Status |
```

Severity: **blocker** (artifact cannot be trusted or built), **major** (wrong or missing content), **minor** (style, clarity). Evidence is a file path and the quoted element; no finding without evidence.

## Visual check

The `check` command validates structure, not legibility. Look at the rendered images (previews if available) and report: crossing lines, overlapping labels, unbalanced layout. If you could not inspect the images, write that under "Checks not executed" in `audit.md`.

## Not claimed

Never state that the project "is complete RUP", that UML is semantically correct, or that a diagram is clean unless it was inspected. State what was checked and how.

# Keeping model and code aligned

Use when documentation and code already exist and either may have moved.

## Drift detection

For every row of `traceability.csv` and `code-map.md`:

1. Does the cited code location exist?
2. Do the entity attributes, relations and constraints in code match the dictionary and the data model?
3. Does the handler of the use case follow the branches of `specification.puml` and the order of `sequence.puml`?
4. Are the business rules present, and tested?
5. Is there code behaviour (endpoints, jobs, events) with no use case?

Classify each difference:

| Type | Meaning | Default resolution |
| --- | --- | --- |
| Model ahead | Model says something code lacks | Implement (RUP → code) if `sourceOfTruth: model` |
| Code ahead | Code does something the model lacks | Document (code → RUP) if `sourceOfTruth: code`, otherwise ask |
| Conflict | Both exist but disagree | Ask which one is right; record a decision |
| Dead | Code or model element nobody uses | Report; do not delete without approval |

## Rules

- `sourceOfTruth` decides the default direction; a conflict is never resolved silently.
- After resolving, update both sides and the traceability row in the same change.
- Record each resolved conflict as `DEC-xxx`.
- Output of a sync run is a table of differences with evidence, then the chosen action, never a rewrite of everything.

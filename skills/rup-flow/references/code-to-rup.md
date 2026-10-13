# Code → RUP (reverse engineering)

Goal: documentation that describes what the code **does**, with evidence. `origin: code`, `sourceOfTruth: code`, provenance **observed** with `path:line`.

## Procedure

1. `RUP scan --code-root <dir> --write`. Read the inventory: manifests, entry points, entities, services, persistence, contracts, tests.
2. Identify the stack and architecture from manifests and folder layout. Record in `project-configuration.md`.
3. **Domain model.** Read persistence first (schema, migrations, ORM models), then entity classes. One entity per business concept, not per table: join tables and technical tables are support or omitted with a note.
4. **Levels.** Ask for the project objective (or infer it from README and entry points and mark it `assumed`) and assign levels.
5. **Use cases.** Derive them from entry points: each controller route, command handler, job, message consumer or CLI command that achieves a user goal. Group technical endpoints into one use case when they serve the same goal.
6. **Specification.** Follow the code path of each use case: validation, branching, errors, side effects. The statechart shows only behaviour found in code. A branch that cannot be understood is `open`, not guessed.
7. **Analysis and design.** Classes, sequences, data model and deployment are drawn from the real call graph, configuration and deployment files (Dockerfile, compose, CI, IaC).
8. **Code map.** Fill `04-implementation/code-map.md` with every model element and its location. Update `traceability.csv` `code` column.
9. **Tests.** Existing tests are listed in the `test` column; use cases without tests are gaps.
10. Render, `check`, then review.

## Rules

- Do not write intent. Write behaviour. Intent that code does not reveal (why a rule exists) is a question.
- Dead code, TODOs and inconsistent behaviour are recorded as findings in `audit.md`, not silently fixed in the model.
- Do not paste large code; cite `path:line`.
- Read files fully before describing them; do not describe from names only.
- On large code bases work by module and keep a coverage list of what was and was not read in `audit.md` ("Checks not executed").

## Output of a run

Files created, entities and use cases found, parts not covered, open questions.

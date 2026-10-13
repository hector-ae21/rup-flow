# RUP → code (forward engineering)

Goal: code that implements the models, traceable back to them. Requires reviewed (or explicitly accepted) artifacts.

## Preconditions

- The use cases to implement are at least `reviewed`; list drafts and ask before generating from them.
- `targetStack` is set in `rup.config.json`; if empty, ask for language, framework, persistence and testing, and save the answers.
- The output location is `codeRoot` unless the user passes another path; never write outside the project.
- Blocking items in `open-questions.md` that affect the use case stop generation of that use case.

## Mapping

| Model element | Code element |
| --- | --- |
| Domain entity / design class | Type or class with the same name; attributes from the dictionary |
| Relation with multiplicity | Typed reference or collection; foreign key in persistence |
| Business rule `RN-xxx` | Validation or domain method; one test per rule |
| Use case `UC-xxx` | One application service or handler named after the use case |
| `<<boundary>>` | Controller, route or screen |
| `<<control>>` / sequence | Application service orchestrating the steps in the sequence order |
| Repository interface | Interface in domain/application, implementation in persistence |
| Data model table | Migration plus mapping |
| Specification states | Branches and error results of the handler |
| Wireframe fields | Request/response contract and form fields |
| Deployment | Dockerfile, compose or manifests |

## Procedure

1. Plan: list files to create or change per use case and show the plan before writing when more than ~5 files.
2. Create types and persistence from the design data model.
3. Implement each use case following its `sequence.puml` step by step, including the failure paths of `specification.puml`.
4. Generate tests: one per main flow, per alternative flow and per business rule. Test names cite the flow or rule ID.
5. Add the trace link in the doc comment of each class or handler using `traceTag`:

   ```
   /** Creates an order. @rup UC-001 RF-001 */
   ```

   Use the comment syntax of the language; keep it to the doc comment, no narrative comments.
6. Run build, tests and linters of the project. Report results as they are.
7. Update `code-map.md` and the `code` and `test` columns of `traceability.csv`. Set `sourceOfTruth` to `code` for artifacts that were deliberately changed in code, or fix the model; never leave them divergent.

## Rules

- Follow the conventions already present in the code base (naming, layering, error handling) over generic ones.
- If implementation needs a decision the model does not contain, stop, record a `Q-xxx` and propose options; do not decide silently.
- Do not generate beyond the requested use cases.
- Generated code that cannot be built or tested in the environment is reported as unverified.

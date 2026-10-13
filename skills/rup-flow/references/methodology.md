# Methodology

The skill follows the RUP disciplines relevant to analysis and design and keeps them in a fixed order of dependency.

```
Domain model → Requirements → Analysis → Design → Implementation
                       ▲                              │
                       └──────── Quality / trace ◄────┘
```

## Phases of work on one request

1. **Intake.** Restate the objective in one sentence, list actors, goals, constraints and the direction of work. Everything not said by the user is `assumed` or `open`.
2. **Gap scan.** Before modelling, list blocking questions (rules that change the model) and non-blocking ones (details). Ask the blocking ones; continue with the rest marked.
3. **Domain model.** Entities, relations, levels. See [domain-model](domain-model.md).
4. **Requirements.** Actors, RF/RNF, use-case cards, specifications and wireframes. See [use-cases](use-cases.md).
5. **Analysis.** Analysis classes and one collaboration per use case. See [analysis-design](analysis-design.md).
6. **Design.** Design classes, sequences, data model, deployment, project configuration.
7. **Implementation link.** Code map and, when asked, code. See [rup-to-code](rup-to-code.md).
8. **Quality.** Traceability, render, `check`, review. See [quality](quality.md).

Do not skip ahead: design artifacts that rest on an unreviewed domain model are `draft` and say so.

## Granularity

- Small request (one feature): update the affected artifacts only, add the use case with `new use-case`, update traceability.
- New system: run the whole sequence, but stop after phase 3 for confirmation if the objective was ambiguous.
- Existing system: start in [code-to-rup](code-to-rup.md); never document by guessing.

## Language and tone

Precise, short, business vocabulary in the domain and requirements, technical vocabulary only from design on. One term per concept across all artifacts; record the term in the entity dictionary.

# Use cases

## Granularity

One use case = one user goal achievable in one sitting by one primary actor. Prefer verb + object (`createOrder`, `cancelBooking`). CRUD operations on a business entity are separate use cases only if their rules differ; otherwise one card with variants. Distinguish summary, user-goal and subfunction levels in the card.

## Artifacts per use case (requirements)

| File | Role |
| --- | --- |
| `README.md` | Card: actor, goal, type, level, requirement, pre/postconditions, flows, rules, pending |
| `specification.puml` | **Behaviour source of truth.** Statechart of the Actor/System conversation |
| `wireframes.puml` | Interface prototype (PlantUML salt). Kept even when there is one screen |

Create them with `RUP new use-case <name>`. The same command creates the realization cards: analysis (`collaboration`), design (`sequence`) and implementation (code and tests tables).

## One card per discipline, linked by a table

Every card of a use case starts with the same navigation table, so a reader can move between disciplines without hunting for files:

```
| Overview | Requirements | Analysis | Design | Implementation | Tests |
```

The current discipline is bold; the others are links; Overview opens the general use-case diagram and Tests opens the tests table of the implementation card. The table is generated, do not retype it.

## Index and general diagram

The requirements README holds, between `rup-flow:use-cases` markers, a generated table (ID, use case, actor, package, requirement, links to analysis, design and implementation, status) and the use-case diagrams: one general diagram with every actor, and one per actor when there are several. Packages group related use cases inside the system boundary; `<<include>>` and `<<extend>>` come from the front matter. Run `RUP index` after changing any card's front matter and never edit the block by hand (`check` warns when it is stale).

Front matter of a requirements card: `title`, `actor` (comma separated for several), `package`, `includes` and `extends` (use-case names), plus `id`, `requirement`, `status`. An actor is linked only to the use cases no other use case of that actor includes, as is usual in use-case diagrams.

## Card rules

- Front matter carries `id`, `title`, `actor`, `package`, `requirement` and `sourceOfTruth`; `includes`/`extends` when the use case reuses or extends another.
- Flows are tables with Actor and System columns. One step = one interaction.
- Every alternative flow names the step where it starts, its condition and where it ends.
- Postconditions are split into success and failure.
- Every business rule used is listed with its `RN-xxx`, which must exist in the domain model.
- Anything the user did not state goes to **Pending** with the question; do not fill flows with plausible behaviour.

## Specification diagram

- A composite state named after the use case; inner states without visible label.
- Transitions are the events of the conversation; notes on transitions narrate what the Actor does and what the System answers.
- Error and cancel paths are explicit transitions.
- `skinparam linetype polyline`.
- The card flows and the diagram must describe the same paths; if they diverge the specification wins and the card is corrected.

## Wireframes

Salt sketch per screen of the flow. Every field shown must map to a domain attribute or a parameter of the use case; every attribute the use case needs must appear in some screen.

## Actors and catalogue

`actors.md` lists actors and the use cases they trigger. `requirements.md` lists RF/RNF with priority, origin and confirmation. Each RF has at least one use case; each use case has at least one RF.

## Checklist before marking `reviewed`

- Main flow reaches the goal; each step has a system response.
- Failure and alternative paths exist for each input and each precondition.
- Entities, attributes and rules referenced exist in the domain model.
- Wireframes cover the fields of the flow.
- The row exists in `traceability.csv`.

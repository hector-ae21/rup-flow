# Example: online shop

A small, complete RUP documentation set produced with rup-flow. It is what you get from this prompt:

```
Use rup-flow to document an online shop in docs. Objective: let customers buy products and let the shop
fulfil orders. Actor: Customer. Requirement RF-001: a customer can place an order for one or more
products. Rules: an order has at least one line; a line quantity cannot exceed stock.
```

Start at [docs/README.md](docs/README.md). Things worth opening:

| To see | Open |
| --- | --- |
| Entities arranged by importance level | [docs/00-domain-model](docs/00-domain-model/README.md) |
| A use case: card, specification (Actor/System statechart), wireframe | [docs/01-requirements/use-cases/createOrder](docs/01-requirements/use-cases/createOrder/README.md) |
| The same use case as collaboration and as sequence | [analysis](docs/02-analysis/use-cases/createOrder/README.md), [design](docs/03-design/use-cases/createOrder/README.md) |
| Provenance and unknowns kept honest | [open questions](docs/05-quality/open-questions.md), [project profile](docs/05-quality/project-profile.md) |
| The traceability table with its gaps | [traceability.csv](docs/05-quality/traceability.csv) |

The `code` and `test` cells are empty on purpose: the next step is "Use rup-flow to implement UC-001", which fills them.

## Reproduce and verify

```bash
node ../../skills/rup-flow/scripts/rup.mjs server up
node ../../skills/rup-flow/scripts/rup.mjs render --root .
node ../../skills/rup-flow/scripts/rup.mjs check --root .
```

`check` reports the two empty traceability cells as warnings and nothing else.

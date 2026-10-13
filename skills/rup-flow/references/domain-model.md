# Domain model

## Hierarchy of entities

The model is organised in horizontal bands. The higher the band, the more central the entity is to the **project objective** written in `project-profile.md`.

| Level | Meaning | Test |
| --- | --- | --- |
| 1 Core | The reason the project exists | Without it the objective is not met |
| 2 Structural | Depend directly on level 1 and give it shape | Cannot exist or make sense without a level-1 entity |
| 3 Detail | Qualify, specialise or break down level 2 | Removing it loses precision, not purpose |
| 4 Support | Catalogues, audit, configuration | Replaceable without changing the business meaning |

Rules:

- Levels are justified per project in the README table. The same concept can be level 1 in one project and level 4 in another.
- Position is a **reading aid**. It never implies inheritance or composition. Relations are chosen by meaning: composition only when the part cannot live without the whole.
- At most 3–5 entities per level in the full model. If a band grows beyond that, split a sub-model and keep the simple model as the map.
- Level 1 has the fewest entities. If everything is level 1, the objective is not defined; go back to intake.

## Producing the diagram

- `top to bottom direction`, one `package "Level N - <name>"` per band, level 1 on top.
- Keep inter-band relations pointing downwards where meaning allows; a relation pointing upwards is legitimate but is a signal to re-check the levels.
- Use hidden links to hold the order of bands or of entities inside a band; see [diagram-conventions](diagram-conventions.md).
- Two files: `domain-model.puml` (attributes that matter, multiplicities, relation names) and `domain-model-simple.puml` (entities and relations only).

## Attributes

Show attributes that carry business meaning or are needed by a use case. Omit trivial ones (a `name` repeated everywhere) **and say so** in the "Omitted attributes and why" column. An attribute that a wireframe or use case reads but the model lacks is a defect, not an omission.

## Entity dictionary

For each entity: level, one-sentence business definition, key attributes, omissions, source (confirmed / observed / assumed).

## Lifecycles

Only entities whose state changes behaviour get a state diagram in `entity-states/`. Each transition names the use case that causes it.

## Business rules

IDs `RN-xxx`, written as a testable sentence, with the entities they constrain and their source. A rule without a source is `assumed` until confirmed.

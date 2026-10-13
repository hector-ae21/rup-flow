---
id: DOM
status: draft
origin: requirements
sourceOfTruth: model
---

# Domain model

## Purpose

What business problem this model covers and which part of the system it feeds.

## Hierarchy of entities

The vertical position of an entity expresses its importance to the project objective. It is not UML inheritance or composition.

| Level | Meaning | Entities | Why they are here |
| --- | --- | --- | --- |
| 1 | Core: the project cannot exist without them | | |
| 2 | Structural: depend directly on the core | | |
| 3 | Detail: qualify or specialise level 2 | | |
| 4 | Support: catalogues, audit, configuration | | |

## Diagrams

![Domain model](./domain-model.svg)

![Simplified domain model](./domain-model-simple.svg)

## Entity dictionary

| Entity | Level | Definition | Key attributes | Omitted attributes and why |
| --- | --- | --- | --- | --- |
| | | | | |

## Business rules

| ID | Rule | Entities | Source |
| --- | --- | --- | --- |
| RN-001 | | | |

## Lifecycles

State diagrams live in [entity-states](./entity-states/entity-states.svg).

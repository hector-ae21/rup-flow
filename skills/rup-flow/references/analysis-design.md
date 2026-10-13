# Analysis and design

## Analysis

Purpose: decide **what** collaborates, without technology.

- `class-diagram.puml`: analysis classes with `<<boundary>>`, `<<control>>`, `<<entity>>`. Entities come from the domain model with the same names.
- Per use case, `collaboration.puml`: the actor, the boundary used, the control that coordinates, and the entities touched, with numbered messages.
- Rules: boundaries talk only to controls, controls talk to entities and other controls, entities never call upward. One control per use case unless a responsibility is shared.
- README lists participating classes with a one-line responsibility each.

## Design

Purpose: decide **how**, in the chosen stack.

- `class-diagram.puml`: packages by layer or feature (as recorded in a decision), design classes with the operations they expose. Interfaces where a dependency must be inverted.
- Per use case, `sequence.puml`: messages between concrete design elements, including the failure path and the transaction boundary.
- `data-model/data-model.puml`: tables or collections, keys, relations, constraints; mapped from entities and listed with the mapping.
- `deployment/deployment.puml`: nodes, containers, external systems and protocols.
- `project-configuration.md`: stack, build, run, environment variables.
- Each non-obvious choice becomes a `DEC-xxx` in `05-quality/decisions/` from the decision template.

## Realization table

Every analysis class maps to one or more design elements and every design element traces to a use case. Keep the mapping in the use case `design.md` ("Elements" table) so that [rup-to-code](rup-to-code.md) can read it.

## Typical defects to avoid

- Design classes with no use case behind them.
- Controls that contain business rules that belong in entities.
- Data model fields with no origin in the domain model.
- Sequences that skip validation or error replies shown in the specification.

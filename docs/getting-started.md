# Getting started

rup-flow is a Claude skill. You describe a system (or point Claude at existing code) and Claude produces RUP documentation with PlantUML diagrams, or generates code from that documentation. You do not need to learn the CLI: Claude runs it for you.

## 1. Pick where you use Claude

| You use | Install guide | Diagrams rendered to SVG automatically |
| --- | --- | --- |
| Claude Code (terminal, VS Code, desktop) | [Install in Claude Code](install-claude-code.md) | Yes, with Docker |
| Claude on the web (claude.ai) | [Install in Claude on the web](install-claude-web.md) | No: Claude writes the `.puml` files, you render them locally |
| Both | Do both guides; the same skill runs in each | |
| Codex, Cursor, Copilot, Gemini CLI | [Using rup-flow with other agents](other-agents.md) | Yes, with Docker; depends on whether the client can run commands |

## 2. The five-minute path (Claude Code)

1. Install: `claude plugin marketplace add hector-ae21/rup-flow` then `claude plugin install rup-flow@rup-flow`.
2. Start Docker and the PlantUML server (once): ask Claude "start the rup-flow PlantUML server", or run the command in [Rendering](rendering.md).
3. Open your project and ask:

   ```
   Use rup-flow to document this system in docs/architecture, in English:
   <describe the system, its users and what they do>
   ```

4. Claude creates `rup.config.json` and the documentation tree, asks about anything it cannot know, renders the diagrams and runs the checks.
5. Open `docs/architecture/README.md` and follow the links.

## 3. What you can ask for

| Goal | Example prompt |
| --- | --- |
| Document a new idea | "Use rup-flow to analyse and document these requirements: ..." |
| Add one feature | "Use rup-flow to add the use case cancelOrder for the Customer actor" |
| Document existing code | "Use rup-flow to reverse engineer `src/` into RUP documentation" |
| Generate code from the models | "Use rup-flow to implement UC-001 and UC-002 from the design in TypeScript with NestJS" |
| Find gaps | "Use rup-reviewer to audit the documentation" |
| Check docs against code | "Use rup-flow to check whether the code still matches the documentation" |
| Change where things go | "Use rup-flow and write the documentation to `documentation/rup` instead" |

More, with what each produces: [Usage guide](usage.md). What the diagrams look like: [diagram types](diagram-types.md). Languages, palettes and the interactive viewer: [formats and themes](formats-and-themes.md). A finished sample: [examples/shop](../examples/shop/README.md).

## 4. What gets created

```
docs/rup/                      (the folder is configurable)
├── 00-domain-model/           entities by importance level, dictionary, rules
├── 01-requirements/           actors, requirements, use cases (card, specification, wireframes)
├── 02-analysis/               analysis classes, collaborations
├── 03-design/                 design classes, sequences, data model, deployment
├── 04-implementation/         code map, code inventory
└── 05-quality/                profile, traceability, questions, audit, decisions
```

Every diagram is a `.puml` source with its `.svg` next to it; Markdown embeds the SVG.

## 5. Ground rules the skill follows

- It never invents business rules; unknowns become questions in `05-quality/open-questions.md`.
- Each statement is marked confirmed, observed in code (`path:line`), assumed or open.
- It tells you which checks it did not run (for example, visual inspection of diagrams).
- It writes only inside the configured documentation folder, and inside the configured code folder when generating code.

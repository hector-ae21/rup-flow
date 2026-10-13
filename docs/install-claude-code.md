# Install in Claude Code

Works in the Claude Code terminal, the VS Code extension and the desktop app: they share the same skills and plugins.

## Requirements

| Requirement | Needed for | Check |
| --- | --- | --- |
| Claude Code | everything | `claude --version` |
| Node.js 18 or later | the bundled CLI (`init`, `new`, `check`, `render`, `scan`) | `node --version` |
| Docker with Compose | rendering diagrams to SVG | `docker --version` and `docker compose version` |

Node.js and Docker are not installed by the skill. If you skip Docker you still get all the Markdown and `.puml` files; only the `.svg` rendering is missing.

## Option A — Plugin from GitHub (recommended)

One-time, from any terminal:

```bash
claude plugin marketplace add hector-ae21/rup-flow
claude plugin install rup-flow@rup-flow
```

Inside a Claude Code session you can do the same with `/plugin marketplace add hector-ae21/rup-flow` and `/plugin install rup-flow@rup-flow`.

Verify:

```bash
claude plugin list
```

You should see `rup-flow@rup-flow` as enabled. Start a new session (or run `/reload-plugins`).

Use it: the skill loads automatically when you ask for RUP documentation, diagrams or code from models. To force it, name it in the prompt ("Use rup-flow to ...") or run `/rup-flow:rup-flow`. Plugin skills are prefixed with the plugin name.

Update:

```bash
claude plugin update rup-flow@rup-flow
```

Uninstall:

```bash
claude plugin uninstall rup-flow@rup-flow
claude plugin marketplace remove rup-flow
```

## Option B — Installer script (no plugin system)

Copies the skill and the two agents into `~/.claude`, so they are available in every project.

```bash
git clone https://github.com/hector-ae21/rup-flow.git
cd rup-flow
node install.mjs
```

PowerShell is the same (`git clone ...`, `cd rup-flow`, `node install.mjs`).

| Flag | Effect |
| --- | --- |
| `--project <dir>` | Install into `<dir>/.claude` instead, for that project only (commit it to share with your team) |
| `--force` | Replace an existing install; the previous one is kept as `.bak-<timestamp>` |

Use it: type `/rup-flow` or say "Use rup-flow to ...". Update by pulling the repository and running `node install.mjs --force`. Uninstall by deleting `~/.claude/skills/rup-flow` and `~/.claude/agents/rup-architect.md` and `rup-reviewer.md`.

## Option C — Manual copy

Copy `skills/rup-flow/` to `~/.claude/skills/rup-flow/` (Windows: `%USERPROFILE%\.claude\skills\rup-flow\`) and the files in `agents/` to `~/.claude/agents/`.

## Start the PlantUML server

Needed once per machine boot (it restarts automatically after that unless you stop it):

```bash
node <skill-dir>/scripts/rup.mjs server up
```

`<skill-dir>` is where the skill lives: `~/.claude/skills/rup-flow` for options B and C. For option A just ask Claude: "start the rup-flow PlantUML server". Check it with `server health`. Details and alternatives: [Rendering](rendering.md).

## Add it to a project (optional)

Add this to the project's `CLAUDE.md` so Claude reaches for the skill by itself:

```markdown
## RUP documentation

For requirements, use cases, domain model, UML, analysis and design documentation, code-to-docs
or docs-to-code work, use the rup-flow skill. Documentation lives in docs/rup (see rup.config.json).
```

## First check that it works

In a project folder, start `claude` and ask:

```
Use rup-flow: initialise the documentation in docs/rup and add a use case called createOrder
```

Expected: `rup.config.json` and `docs/rup/...` appear, and Claude summarises the files it created. If not, see [Troubleshooting](troubleshooting.md).

## Which agents come with it

| Agent | Use it for |
| --- | --- |
| `rup-architect` | Generating and updating documentation, and generating code from reviewed models |
| `rup-reviewer` | A read-only audit that cannot change files |

Ask for them by name: "Use rup-reviewer to audit the documentation".

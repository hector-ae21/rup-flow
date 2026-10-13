# Using rup-flow with other agents

rup-flow is written once, in the open [Agent Skills](https://agentskills.io/specification) format, and adapted per client. The skill folder `skills/rup-flow/` contains a `SKILL.md` with `name` and `description`, a `scripts/` CLI and `references/` loaded on demand. Any client that reads that format can use it.

## Compatibility

| Client | How it uses rup-flow | Status |
| --- | --- | --- |
| Claude Code | Plugin, or `.claude/skills` plus two subagents | Plugin validated by the directory scanner; install by marketplace not yet tested end to end |
| Claude on the web | Upload `rup-flow-skill.zip` | Format follows the documented rules; upload not yet tested |
| Codex (CLI, IDE, app) | Skill in `.agents/skills/rup-flow` | **Tested by the maintainer: works** |
| Gemini CLI | Skill and/or the `GEMINI.md` instruction block | **Tested by the maintainer: works** |
| Cursor, GitHub Copilot, others | Instruction file that points the agent to the skill | Files generated in the documented locations; **not yet tested in those tools** |

"Not yet tested" means the layout follows the vendor documentation but nobody has run it there. "Tested" means a person ran a real task with it; it is not a guarantee for every version of the client. Please report what you find in an [issue](https://github.com/hector-ae21/rup-flow/issues/new/choose).

## One universal location

Most clients other than Claude Code look for skills in `.agents/skills/`. Install there, for one project or for your user:

```bash
git clone https://github.com/hector-ae21/rup-flow.git
cd rup-flow
node install.mjs --target agents --project /path/to/your/project   # project: <project>/.agents/skills/rup-flow
node install.mjs --target agents                                    # user: ~/.agents/skills/rup-flow
node install.mjs --target all                                       # Claude Code and .agents/skills
```

`codex` is an alias of `agents`. Add `--force` to replace an existing install (a backup is kept). `--list` shows the targets.

## Codex

1. Install into `.agents/skills` as above.
2. Start Codex in the project. Check the skill is found with `/skills`.
3. Ask for it explicitly or let Codex pick it by its description:

   ```
   $rup-flow document this system in docs/rup, in English: <what it is, who uses it, what they do>
   ```

4. Optional: add the repository instructions so the behaviour is also in `AGENTS.md`:

   ```bash
   node .agents/skills/rup-flow/scripts/rup.mjs instructions --target agents
   ```

Codex has no equivalent of the two Claude subagents. The skill covers it: after generating, it runs the read-only review pass described in `references/quality.md`.

## Cursor, Copilot, Gemini CLI and other instruction-file clients

These tools read a project instruction file. The CLI writes a short, marked block that points the agent to the skill and states the ground rules. It is idempotent: running it again refreshes the block and never touches the rest of the file.

```bash
node .agents/skills/rup-flow/scripts/rup.mjs instructions --list
node .agents/skills/rup-flow/scripts/rup.mjs instructions --target agents,cursor,copilot,gemini
```

| Target | File written | Read by |
| --- | --- | --- |
| `agents` | `AGENTS.md` | Codex, Cursor, Copilot coding agent, Gemini CLI, Zed, Jules and others that follow [AGENTS.md](https://agents.md) |
| `claude` | `CLAUDE.md` | Claude Code |
| `gemini` | `GEMINI.md` | Gemini CLI |
| `copilot` | `.github/copilot-instructions.md` | GitHub Copilot |
| `cursor` | `.cursor/rules/rup-flow.mdc` | Cursor |

If the skill lives somewhere else, pass `--skill-path <folder>`.

## What is portable and what is not

| Portable (any client) | Client specific |
| --- | --- |
| The skill, its references and templates | Claude Code subagents `rup-architect`, `rup-reviewer` |
| The CLI (`init`, `new use-case`, `scan`, `render`, `explore`, `check`, `themes`, `instructions`) | Claude plugin and marketplace manifests |
| Docker rendering for PlantUML and Mermaid | `/rup-flow:rup-flow` command naming |
| Configuration in `rup.config.json` | |

The CLI needs Node.js 18+ and runs the same everywhere. Rendering needs Docker, which is outside the agent's sandbox in some clients; then run `render` yourself and let the agent continue.

## Adding another client

See [Architecture](architecture.md#adding-a-client). In short: if it reads Agent Skills, nothing changes; if it needs a different folder, add one entry to `TARGETS` in `install.mjs`; if it reads an instruction file, add one entry to `INSTRUCTION_TARGETS` in `scripts/lib/instructions.mjs`; document it here and add a test.

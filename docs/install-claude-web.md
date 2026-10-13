# Install in Claude on the web (claude.ai)

## What you need

- A Claude plan that includes skills (Free, Pro, Max, Team or Enterprise) with **code execution and file creation** enabled.
- The file `rup-flow-skill.zip`.

## Step 1 — Get the ZIP

Either:

- Download `rup-flow-skill.zip` from the [latest release](https://github.com/hector-ae21/rup-flow/releases/latest), or
- Build it from a clone: `node tools/package-web.mjs` creates `dist/rup-flow-skill.zip`.

The ZIP must contain the folder `rup-flow/` at its root (it does). Do not rezip its contents yourself.

## Step 2 — Enable code execution

Open **Settings → Capabilities** and turn on **Code execution and file creation**.

## Step 3 — Upload the skill

1. Open **Customize → Skills** (claude.ai/customize/skills).
2. Click **+**, choose **Create skill → Upload a skill**.
3. Select `rup-flow-skill.zip`.
4. Make sure the `rup-flow` skill is enabled.

On Team and Enterprise plans an owner may need to allow custom skills first.

## Step 4 — Use it

Start a conversation, attach your requirements or code (or paste them) and ask:

```
Use the rup-flow skill to analyse and document this system.
Documentation language: English. Output folder: docs/rup.
<requirements here>
```

Claude generates the files in its workspace. Download them from the files Claude presents, and unzip into your project.

## What works on the web, and what does not

| Capability | On the web |
| --- | --- |
| Domain model, use cases, analysis, design as Markdown and `.puml` | Yes |
| Folder structure, front matter, traceability table | Yes |
| Code → RUP, when you attach the code | Yes |
| RUP → code, delivered as files to download | Yes |
| Audit of gaps (a second pass in the same chat) | Yes |
| `scan` and `check` commands | Yes, if the sandbox has Node.js; otherwise Claude does it by reading |
| **Rendering `.svg`** | **No**: Claude's sandbox cannot reach the Docker PlantUML server on your computer |
| Read-only `rup-reviewer` agent | No: agents are a Claude Code feature |

To get the SVGs, download the output and render locally:

```bash
node rup.mjs render --root <project>      # needs Docker, see rendering.md
```

or paste a `.puml` into any PlantUML viewer. The Markdown already links to the `.svg` names, so the links work as soon as the images exist.

## Update or remove

Upload a new ZIP over the old skill (or delete the old one first) from **Customize → Skills**. To remove it, delete it there.

## If Claude does not use the skill

Say "Use the rup-flow skill" explicitly. If it still does not appear, check that it is enabled and that code execution is on.

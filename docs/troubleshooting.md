# Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Claude does not use the skill | Not loaded or not triggered | Start a new session (`/reload-plugins`), name it: "Use rup-flow to ..."; check `claude plugin list` or that `~/.claude/skills/rup-flow/SKILL.md` exists |
| `/rup-flow` not found after installing the plugin | Plugin skills are prefixed | Use `/rup-flow:rup-flow` |
| `node: command not found` | Node.js missing | Install Node.js 18 or later |
| `docker compose failed. Is Docker running?` | Docker Desktop/engine stopped | Start Docker, retry `server up` |
| `PlantUML server not usable at http://127.0.0.1:8085` | Server not running or other port | `server up`, then `health`; check `plantuml.url` |
| Port 8085 already in use | Another service | Use `--plantuml-url http://127.0.0.1:<free port>` with `server up`, and save it in the config |
| Render error `PlantUML reported a syntax error` | The `.puml` is invalid | Open the file and fix the line; common cause: an alias equal to a PlantUML keyword (`actor`, `class`) |
| `check`: `diagram not rendered yet` | SVG missing | Run `render` |
| `check`: `empty "code"` / `empty "test"` | Traceability gaps | Expected before implementation; fill when code and tests exist |
| `Output directory not found` | `init` not run, or `outDir` changed | Run `init`, or fix `outDir` in the config |
| Plugin install says plugin not found in marketplace | Entry/manifest name mismatch or stale cache | `claude plugin marketplace update rup-flow`, reinstall |
| Web: the skill upload is rejected | ZIP structure or description length | Use the release ZIP; the root must be the `rup-flow/` folder |
| Web: no SVG files | The sandbox cannot reach your Docker | Render locally, see [Install on the web](install-claude-web.md) |

## Windows notes

- Use PowerShell or Git Bash; `node` and `docker` must be on `PATH`.
- Paths in `rup.config.json` use forward slashes.
- The installer writes to `%USERPROFILE%\.claude`.

## Still stuck

Open an [issue](https://github.com/hector-ae21/rup-flow/issues/new/choose) with your OS, `node --version`, `docker --version`, the command or prompt, and the full output.

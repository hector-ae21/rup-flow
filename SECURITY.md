# Security policy

## Reporting a vulnerability

Use GitHub's private vulnerability reporting: **Security → Report a vulnerability** on this repository. Do not open a public issue for a vulnerability.

## Scope and design choices

- The CLI has no runtime dependencies and only talks to the PlantUML server you configure.
- The bundled `compose.yaml` publishes the server on `127.0.0.1` only and runs it with `PLANTUML_SECURITY_PROFILE=SANDBOX`, which blocks file and URL access from diagrams. Do not expose that port to a network without adding authentication.
- Generated documentation can contain whatever you or the code base contain. Review it before publishing, especially output produced from code (`path:line` references, configuration, table names).

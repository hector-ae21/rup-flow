# Privacy

rup-flow does not collect, store or transmit personal data, usage data or telemetry. It has no account, no analytics and no remote service of its own.

What it does on your machine:

- Reads and writes files inside the folders you point it at (your documentation folder and, when you ask for code, your code folder).
- Sends diagram sources to the PlantUML server you run locally (default `http://127.0.0.1:8085`) and runs the Mermaid renderer in a local Docker container. Nothing is sent anywhere else.
- Pulls the PlantUML and Mermaid container images from their public registries the first time you use them, which is standard Docker behaviour.

The AI agent you use with the skill (Claude, Codex, Gemini or another) processes your prompts and files according to that provider's own terms and privacy policy, not this project's.

Questions: open an [issue](https://github.com/hector-ae21/rup-flow/issues).

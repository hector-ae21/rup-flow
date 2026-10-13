# Structure, configuration and front matter

## Default tree

```
<outDir>/                              default docs/rup
├── README.md                          index
├── 00-domain-model/
│   ├── README.md                      levels, dictionary, rules
│   ├── domain-model.puml/.svg         full model
│   ├── domain-model-simple.puml/.svg  entities and relations only
│   └── entity-states/
├── 01-requirements/
│   ├── README.md                      use-case index
│   ├── actors.md
│   ├── requirements.md                RF / RNF
│   └── use-cases/<name>/
│       ├── README.md                  card
│       ├── specification.puml/.svg    behaviour (source of truth)
│       └── wireframes.puml/.svg       interface prototype
├── 02-analysis/
│   ├── README.md
│   ├── class-diagram.puml/.svg
│   └── use-cases/<name>/{README.md, collaboration.puml/.svg}
├── 03-design/
│   ├── README.md
│   ├── class-diagram.puml/.svg
│   ├── project-configuration.md
│   ├── data-model/data-model.puml/.svg
│   ├── deployment/deployment.puml/.svg
│   └── use-cases/<name>/{README.md, sequence.puml/.svg}
├── 04-implementation/
│   ├── README.md
│   ├── code-map.md                    model element → code location
│   └── code-inventory.json            from `scan --write`
└── 05-quality/
    ├── project-profile.md
    ├── traceability.csv
    ├── open-questions.md
    ├── audit.md
    └── decisions/DEC-001-*.md
```

A use case is named in camelCase (`createOrder`) and keeps the same folder name in the three disciplines.

## rup.config.json

```json
{
  "project": "my-project",
  "outDir": "docs/rup",
  "docLanguage": "en",
  "codeRoot": "src",
  "paths": {
    "domain": "00-domain-model",
    "requirements": "01-requirements",
    "analysis": "02-analysis",
    "design": "03-design",
    "implementation": "04-implementation",
    "quality": "05-quality"
  },
  "useCaseDir": "use-cases",
  "plantuml": { "url": "http://127.0.0.1:8085", "previewPng": false, "timeoutMs": 30000 },
  "ids": { "requirement": "RF", "nonFunctional": "RNF", "useCase": "UC", "rule": "RN", "decision": "DEC", "test": "TC" },
  "targetStack": { "language": "", "framework": "", "persistence": "", "testing": "" },
  "traceTag": "@rup"
}
```

| Key | Meaning |
| --- | --- |
| `outDir` | Root of the generated documentation, relative to the project root |
| `paths.*` | Folder name of each discipline under `outDir` |
| `useCaseDir` | Subfolder that holds per-use-case folders |
| `codeRoot` | Where `scan` looks and where generated code goes unless the user says otherwise |
| `targetStack` | Stack used by RUP → code; ask when empty |
| `traceTag` | Doc-comment tag that links code to a model element |
| `ids.*` | Prefixes of the stable identifiers |

Changing `paths` or `outDir` on an existing project means moving the folders and fixing links; do it as one explicit step.

## Front matter

Every Markdown artifact (except index READMEs) starts with:

```yaml
---
id: UC-001
name: createOrder
status: draft
origin: requirements
sourceOfTruth: model
requirement: RF-001
---
```

| Key | Values |
| --- | --- |
| `status` | `draft`, `reviewed`, `approved` |
| `origin` | `requirements`, `code`, `diagram` |
| `sourceOfTruth` | `model` (code must follow it) or `code` (model describes it) |

## Identifiers

`RF-001` functional requirement, `RNF-001` non-functional, `UC-001` use case, `RN-001` business rule, `DEC-001` decision, `TC-001` test case, `Q-001` question. Never reuse or renumber an ID; mark it `retired`.

## Traceability

`05-quality/traceability.csv`, one row per use case: `requirement,use_case,name,analysis,design,code,test`. Cells hold paths or IDs. A row with empty `code` or `test` is a gap that `check` reports.

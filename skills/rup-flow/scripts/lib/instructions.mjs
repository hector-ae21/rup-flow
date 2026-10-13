import fs from 'node:fs';
import path from 'node:path';

export const BLOCK_START = '<!-- rup-flow:start -->';
export const BLOCK_END = '<!-- rup-flow:end -->';

/**
 * Instruction files read by common coding agents. Each target names the file
 * the agent loads from the project root and the skill folder it usually has.
 */
export const INSTRUCTION_TARGETS = {
  agents: { file: 'AGENTS.md', skillPath: '.agents/skills/rup-flow', label: 'AGENTS.md (Codex, Cursor, Copilot agent, Gemini CLI, Zed, Jules and others)' },
  claude: { file: 'CLAUDE.md', skillPath: '.claude/skills/rup-flow', label: 'CLAUDE.md (Claude Code)' },
  gemini: { file: 'GEMINI.md', skillPath: '.agents/skills/rup-flow', label: 'GEMINI.md (Gemini CLI)' },
  copilot: { file: '.github/copilot-instructions.md', skillPath: '.agents/skills/rup-flow', label: 'GitHub Copilot instructions' },
  cursor: {
    file: '.cursor/rules/rup-flow.mdc',
    skillPath: '.agents/skills/rup-flow',
    label: 'Cursor project rule',
    frontmatter: '---\ndescription: RUP documentation, UML diagrams and code generation with rup-flow\nalwaysApply: false\n---\n\n',
  },
};

export function instructionBlock(skillPath) {
  return [
    BLOCK_START,
    '## RUP documentation (rup-flow)',
    '',
    `For requirements, use cases, domain model, UML diagrams, analysis and design documentation, and for code-to-docs or docs-to-code work, follow \`${skillPath}/SKILL.md\` and load its \`references/\` files on demand.`,
    '',
    '- Settings live in `rup.config.json`; documentation goes to its `outDir`. A path given in the request overrides it for that run.',
    `- CLI: \`node ${skillPath}/scripts/rup.mjs <init | new use-case | scan | render | explore | check | themes>\`.`,
    '- Mark every statement as confirmed, observed (`path:line`), assumed or open. Do not invent business rules; unknowns go to `05-quality/open-questions.md`.',
    '- Do not claim a diagram was rendered or visually checked unless you ran the render and looked at it.',
    BLOCK_END,
    '',
  ].join('\n');
}

/** Inserts the block, or replaces the previous one between its markers. */
export function applyBlock(existing, block) {
  const start = existing.indexOf(BLOCK_START);
  const end = existing.indexOf(BLOCK_END);
  if (start >= 0 && end > start) {
    return `${existing.slice(0, start)}${block}${existing.slice(end + BLOCK_END.length).replace(/^\r?\n/, '')}`;
  }
  const separator = existing === '' ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
  return `${existing}${separator}${block}`;
}

export function writeInstructions(root, targetName, skillPathOverride) {
  const target = INSTRUCTION_TARGETS[targetName];
  if (!target) throw new Error(`Unknown instruction target "${targetName}". Available: ${Object.keys(INSTRUCTION_TARGETS).join(', ')}`);
  const file = path.join(root, target.file);
  const existed = fs.existsSync(file);
  const current = existed ? fs.readFileSync(file, 'utf8') : (target.frontmatter ?? '');
  const next = applyBlock(current, instructionBlock(skillPathOverride ?? target.skillPath));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next);
  return { file, created: !existed, changed: next !== current };
}

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { applyMermaidTheme, mermaidConfig } from './themes.mjs';

export const DEFAULT_MERMAID_IMAGE = 'ghcr.io/mermaid-js/mermaid-cli/mermaid-cli@sha256:2c5d27365df71da06c288beebe531ea3637cf9b422b871239a3b016233591d24';

/**
 * Renders Mermaid sources to SVG with one container run for the whole batch.
 * @param {{ id: string, source: string }[]} jobs
 * @returns {Map<string, { svg?: Buffer, error?: string }>}
 */
export function renderMermaidBatch(jobs, theme, settings) {
  const results = new Map();
  if (jobs.length === 0) return results;
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'rup-mermaid-'));
  try {
    fs.mkdirSync(path.join(work, 'in'));
    fs.mkdirSync(path.join(work, 'out'));
    fs.writeFileSync(path.join(work, 'config.json'), JSON.stringify(mermaidConfig(theme)));
    fs.writeFileSync(path.join(work, 'puppeteer.json'), JSON.stringify({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-gpu'] }));
    jobs.forEach((job, index) => {
      fs.writeFileSync(path.join(work, 'in', `${index}.mmd`), applyMermaidTheme(job.source, theme));
    });
    const script = 'for f in /data/in/*.mmd; do n=$(basename "$f" .mmd); mmdc -q -i "$f" -o "/data/out/$n.svg" -c /data/config.json -p /data/puppeteer.json 2>"/data/out/$n.err" || true; done';
    const run = spawnSync('docker', ['run', '--rm', '-v', `${work}:/data`, '--entrypoint', 'sh', settings.image || DEFAULT_MERMAID_IMAGE, '-c', script], {
      encoding: 'utf8', timeout: settings.timeoutMs ?? 180000,
    });
    if (run.error || (run.status !== 0 && !fs.readdirSync(path.join(work, 'out')).length)) {
      const reason = run.error ? run.error.message : (run.stderr || '').trim().split('\n').slice(-2).join(' ');
      jobs.forEach((job) => results.set(job.id, { error: `Mermaid container failed: ${reason || 'unknown error'}` }));
      return results;
    }
    jobs.forEach((job, index) => {
      const svgFile = path.join(work, 'out', `${index}.svg`);
      if (fs.existsSync(svgFile)) results.set(job.id, { svg: fs.readFileSync(svgFile) });
      else {
        const errFile = path.join(work, 'out', `${index}.err`);
        const text = fs.existsSync(errFile) ? fs.readFileSync(errFile, 'utf8') : '';
        const line = text.split('\n').find((l) => /error/i.test(l)) ?? text.split('\n')[0];
        results.set(job.id, { error: `Mermaid could not render this diagram: ${line.trim() || 'no output'}` });
      }
    });
    return results;
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

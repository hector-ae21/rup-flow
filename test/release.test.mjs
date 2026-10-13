import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const release = createRequire(import.meta.url)('../.github/scripts/release.cjs');

function fakeGitHub({ existing = false } = {}) {
  const calls = [];
  return {
    calls,
    github: {
      rest: {
        repos: {
          getReleaseByTag: async (args) => {
            calls.push(['get', args.tag]);
            if (existing) return { data: { id: 1 } };
            throw Object.assign(new Error('Not Found'), { status: 404 });
          },
          createRelease: async (args) => { calls.push(['create', args.tag_name, args.name, args.body]); return { data: { id: 7, html_url: 'https://example.test/r/7' } }; },
          uploadReleaseAsset: async (args) => { calls.push(['upload', args.release_id, args.name, args.data.length, args.headers['content-type']]); return {}; },
        },
      },
    },
    context: { repo: { owner: 'o', repo: 'r' } },
  };
}

function files() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rup-flow-rel-'));
  const zipPath = path.join(dir, 'a.zip');
  const changelogPath = path.join(dir, 'CHANGELOG.md');
  fs.writeFileSync(zipPath, 'zipbytes');
  fs.writeFileSync(changelogPath, '# Changelog\n\n## [Unreleased]\n\n## [1.2.3]\n\n### Added\n\n- thing\n\n## [1.2.2]\n\n- old\n');
  return { zipPath, changelogPath };
}

test('the release is titled with the tag, carries its changelog section and the package', async () => {
  const fake = fakeGitHub();
  const url = await release({ ...fake, tag: 'v1.2.3', ...files() });
  assert.equal(url, 'https://example.test/r/7');
  assert.deepEqual(fake.calls[1].slice(0, 3), ['create', 'v1.2.3', 'v1.2.3']);
  assert.match(fake.calls[1][3], /- thing/);
  assert.doesNotMatch(fake.calls[1][3], /old/);
  assert.deepEqual(fake.calls[2], ['upload', 7, 'rup-flow-skill.zip', 8, 'application/zip']);
});

test('an existing release is never overwritten and bad tags are rejected', async () => {
  const fake = fakeGitHub({ existing: true });
  await assert.rejects(release({ ...fake, tag: 'v1.2.3', ...files() }), /already exists/);
  assert.equal(fake.calls.filter((c) => c[0] === 'create').length, 0);
  await assert.rejects(release({ ...fakeGitHub(), tag: 'latest', ...files() }), /not a vMAJOR/);
});

test('every version has a section in the changelog', () => {
  const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  assert.ok(release.changelogSection(fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8'), version).length > 0, `CHANGELOG.md has no section for ${version}`);
});

test('the release workflow publishes through the official script action, not the command line client', () => {
  const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/release.yml'), 'utf8');
  assert.match(workflow, /actions\/github-script@/);
  assert.doesNotMatch(workflow, /gh release|GH_/);
});

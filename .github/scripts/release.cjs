const fs = require('node:fs');

const SEMVER_TAG = /^v\d+\.\d+\.\d+$/;

/** Returns the CHANGELOG section of a version, without its heading. */
function changelogSection(changelog, version) {
  const lines = changelog.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
  if (start < 0) return '';
  const end = lines.findIndex((line, index) => index > start && line.startsWith('## ['));
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim();
}

/**
 * Creates the GitHub release of a tag and attaches the web skill package.
 * Fails when the release already exists so a release is never overwritten.
 */
module.exports = async function release({ github, context, tag, zipPath, changelogPath }) {
  if (!SEMVER_TAG.test(tag)) throw new Error(`"${tag}" is not a vMAJOR.MINOR.PATCH tag`);
  const { owner, repo } = context.repo;
  const existing = await github.rest.repos.getReleaseByTag({ owner, repo, tag }).catch((error) => {
    if (error.status === 404) return null;
    throw error;
  });
  if (existing) throw new Error(`Release ${tag} already exists`);

  const body = changelogSection(fs.readFileSync(changelogPath, 'utf8'), tag.slice(1));
  const created = await github.rest.repos.createRelease({ owner, repo, tag_name: tag, name: tag, body: body || `Release ${tag}` });
  await github.rest.repos.uploadReleaseAsset({
    owner,
    repo,
    release_id: created.data.id,
    name: 'rup-flow-skill.zip',
    data: fs.readFileSync(zipPath),
    headers: { 'content-type': 'application/zip' },
  });
  return created.data.html_url;
};

module.exports.changelogSection = changelogSection;

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const DIR = '.pipeline';
export const STAGED = `${DIR}/staged.json`;
export const VERIFIED = `${DIR}/verified.json`;

export async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function writeJson(file, data) {
  await mkdir(DIR, { recursive: true });
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}

// An article may go to production only if this exact content passed the browser
// check on staging. Editing a file after verification changes its hash and blocks it.
export function blockedFromProduction(articles, verified) {
  const passed = verified?.hashes ?? {};
  return articles
    .filter((article) => passed[article.slug] !== article.hash)
    .map((article) => ({
      slug: article.slug,
      reason: passed[article.slug]
        ? 'changed after it was verified on staging'
        : 'never verified on staging',
    }));
}

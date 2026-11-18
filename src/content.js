import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';

// The hash identifies exactly what the gate saw. Staging stores it on the post,
// the browser check reads it back, and promote refuses anything with a different one.
export function hashArticle({ slug, title, description, html }) {
  return createHash('sha256')
    .update(JSON.stringify([slug, title, description, html]))
    .digest('hex');
}

export function parseArticle(source, file = 'inline.md') {
  const { data, content } = matter(source);
  const article = {
    file,
    slug: String(data.slug ?? path.basename(file, '.md')),
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    keyword: String(data.keyword ?? ''),
    html: marked.parse(content, { async: false }).trim(),
  };
  return { ...article, hash: hashArticle(article) };
}

export async function loadArticles(dir = 'content') {
  const files = (await readdir(dir)).filter((name) => name.endsWith('.md')).sort();
  return Promise.all(
    files.map(async (name) => parseArticle(await readFile(path.join(dir, name), 'utf8'), name)),
  );
}

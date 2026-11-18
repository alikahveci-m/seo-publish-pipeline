import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { loadArticles, parseArticle } from '../src/content.js';
import { checkArticle } from '../src/gate/index.js';

const good = await readFile('content/find-redirect-loops.md', 'utf8');
const rulesHit = (source) => new Set(checkArticle(parseArticle(source, 'sample.md')).map((f) => f.rule));

test('every article in content/ passes the gate', async () => {
  for (const article of await loadArticles()) {
    assert.deepEqual(checkArticle(article), [], article.file);
  }
});

test('a machine-written draft is blocked on every count', async () => {
  const hit = rulesHit(await readFile('tests/fixtures/ai-draft.md', 'utf8'));
  for (const rule of [
    'title-length',
    'description-length',
    'slug-format',
    'single-h1',
    'heading-order',
    'word-count',
    'internal-link',
    'empty-link',
    'image-alt',
    'keyword-placement',
    'draft-leftover',
    'stock-phrase',
    'not-just-but',
    'repeated-opener',
  ]) {
    assert.ok(hit.has(rule), `expected ${rule} to fire`);
  }
});

// One change to a passing article should trip exactly the rule that covers it.
const cases = {
  'stock-phrase': (md) => md.replace('Start with', 'Let us delve into'),
  'draft-leftover': (md) => md.replace('Start with', 'TODO: rewrite. Start with'),
  'dash-density': (md) => md.replace(/, /g, ' — '),
  'internal-link': (md) => md.replace('(/technical-seo-checklist/)', '(https://example.com/)'),
  'single-h1': (md) => md.replace('## Where the loop hides', '# Where the loop hides'),
  'heading-order': (md) => md.replace('## Where the loop hides', '### Where the loop hides'),
  'image-alt': (md) => `${md}\n![](/chart.png)\n`,
  'keyword-placement': (md) => md.replace('keyword: redirect loop', 'keyword: crawl budget'),
  'title-length': (md) => md.replace(/^title: .*$/m, 'title: Redirect loop'),
};

for (const [rule, breakIt] of Object.entries(cases)) {
  test(`${rule} fires alone`, () => {
    assert.deepEqual([...rulesHit(breakIt(good))], [rule]);
  });
}

test('the hash follows the content', () => {
  const before = parseArticle(good, 'a.md');
  assert.equal(parseArticle(good, 'a.md').hash, before.hash);
  assert.notEqual(parseArticle(good.replace('two weeks', 'three weeks'), 'a.md').hash, before.hash);
});

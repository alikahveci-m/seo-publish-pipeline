#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { connect } from './config.js';
import { loadArticles } from './content.js';
import { checkArticle } from './gate/index.js';
import { STAGED, VERIFIED, blockedFromProduction, readJson, writeJson } from './release.js';

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

function gate(articles) {
  let total = 0;
  for (const article of articles) {
    const findings = checkArticle(article);
    total += findings.length;
    console.log(`${findings.length ? 'FAIL' : 'ok  '}  ${article.file}`);
    for (const finding of findings) console.log(`      ${finding.rule}: ${finding.message}`);
  }
  if (total) fail(`Gate blocked the release: ${total} finding(s). Nothing was published.`);
}

async function publish(site, articles) {
  const target = connect(site);
  const results = [];
  for (const article of articles) {
    const result = await target.upsert(article);
    console.log(`${result.action.padEnd(9)} ${result.url}`);
    results.push({ ...article, ...result });
  }
  return results;
}

const commands = {
  async check() {
    gate(await loadArticles());
  },

  async stage() {
    const articles = await loadArticles();
    gate(articles);
    const staged = await publish('staging', articles);
    await writeJson(STAGED, {
      articles: staged.map(({ slug, title, description, hash, url }) => ({
        slug,
        title,
        description,
        hash,
        url,
      })),
    });
  },

  async verify() {
    const staged = await readJson(STAGED);
    if (!staged) fail('Nothing is staged. Run `npm run stage` first.');
    const { status } = spawnSync('npx', ['playwright', 'test'], { stdio: 'inherit' });
    if (status !== 0) fail('Staging check failed. Nothing was marked as verified.');
    await writeJson(VERIFIED, {
      hashes: Object.fromEntries(staged.articles.map(({ slug, hash }) => [slug, hash])),
    });
    console.log(`\nVerified ${staged.articles.length} article(s) on staging.`);
  },

  async promote() {
    const articles = await loadArticles();
    const blocked = blockedFromProduction(articles, await readJson(VERIFIED));
    if (blocked.length) {
      for (const { slug, reason } of blocked) console.error(`BLOCKED  ${slug}: ${reason}`);
      fail('Production was not touched. Run `npm run stage` and `npm run verify` again.');
    }
    await publish('production', articles);
  },
};

const command = commands[process.argv[2]];
if (!command) fail(`Usage: node src/cli.js <${Object.keys(commands).join('|')}>`);
await command().catch((error) => fail(error.message));

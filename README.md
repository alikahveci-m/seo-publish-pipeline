# seo-publish-pipeline

Publishes Markdown articles to WordPress through the REST API, with one rule:
**nothing reaches production unless that exact content passed a content gate and a browser check on staging.**

I built it as a small, complete version of a problem I care about: when content is
published to client sites by a script instead of a person, the script has to be
stricter than the person was.

```
content/*.md ──▶ gate ──▶ staging ──▶ Playwright ──▶ production
                  │                       │              │
          blocks on any finding    desktop + mobile   refuses content whose
          (SEO and writing rules)  on the real page   hash was not verified
```

## What each step does

**Gate** (`src/gate/`). Fifteen rules, every finding blocks.
SEO rules cover title and description length, slug format, a single H1, heading order,
word count, internal links, empty links, image alt text and keyword placement.
Writing rules catch model leftovers ("as an AI language model", `TODO:`), stock phrases
readers recognise as machine-written, heavy em dash use, repeated "not just X but Y"
and runs of sentences that start with the same word.

**Staging** (`npm run staging`). A throwaway WordPress started with WordPress Playground,
so it needs Node and nothing else. It is rebuilt from `staging/blueprint.json` on every start.

**Publish** (`src/adapters/wordpress.js`). An upsert by slug. A hash of the content is
stored on the post, so running the pipeline twice changes nothing and reports `unchanged`.

**Browser check** (`tests/e2e/`). Playwright opens every staged page on desktop and on a
phone and checks what a visitor and a crawler actually get: status, title, meta description,
canonical, Article JSON-LD, one H1, no leaked Markdown, no broken images or internal links,
no console errors, no horizontal scroll. It also reads the content hash from the page to
prove it is looking at the content the gate approved.

**Promote** (`npm run promote`). Publishes to production only if every article's current
hash was verified on staging. Edit a file after verification and it is blocked again.

## Try it

Needs Node 24 or newer.

```bash
npm install
npx playwright install chromium
cp .env.example .env

npm run staging        # terminal 1: WordPress on http://127.0.0.1:9400
npm run stage          # terminal 2: gate, then publish to staging
npm run verify         # Playwright against the staged pages
```

To see the gate block a draft, copy the fixture in and run the check:

```bash
cp tests/fixtures/ai-draft.md content/bad.md && npm run check; rm content/bad.md
```

To try `promote` without a real site, run `npm run production:local` in a third terminal
and point the `PRODUCTION_WP_*` variables at `http://127.0.0.1:9401` with the staging credentials.

## Why the browser check exists

While building this, the publish step reported `created`, and the article URL answered `200`.
The page behind that URL was the blog index: the test site's rewrite rules had not been
flushed, so WordPress served its home page for every path. The API and a status check both
said everything was fine. The Playwright check failed on the H1 and caught it.

## CI

Every pull request runs the full path in GitHub Actions: unit tests, then staging, gate,
publish, browser check, and a promote against a second throwaway WordPress that stands in
for production. It also asserts that production refuses content before verification.

## Limits

- One adapter, WordPress. The adapter interface is a single `upsert(article)`; Shopify and
  Webflow are not written, and I would not call one done before it passed `verify` against a
  real test store.
- One site per environment. Publishing to many client sites needs a site registry and
  per-site results, which this does not have.
- The writing rules are phrase lists and simple counts, tuned for English. They catch the
  obvious cases cheaply. They do not replace a model-based review or an editor.
- Meta description and JSON-LD come from the small plugin in `staging/mu-plugins/`. On a
  client site an SEO plugin usually owns those fields and the adapter would write to it.

## How it was built

With Claude Code, working in this repository. `CLAUDE.md` is the context file it reads:
the commands, and the invariants it is not allowed to weaken.

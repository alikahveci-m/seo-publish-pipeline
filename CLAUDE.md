# seo-publish-pipeline

Publishes Markdown articles in `content/` to WordPress over the REST API.
The whole point of the repo is one guarantee: nothing reaches production unless
that exact content passed the gate and the browser check on staging.

## Commands

- `npm test`: unit tests (node:test) for the gate and the release rules
- `npm run staging`: throwaway WordPress on :9400 (WordPress Playground, no Docker)
- `npm run check`: run the gate only
- `npm run stage`: gate, then publish to staging
- `npm run verify`: Playwright against the staged pages, desktop and mobile
- `npm run promote`: publish verified content to production

Run `npm test` after every change. Run `stage` and `verify` after any change to
`src/adapters/`, `staging/` or `tests/e2e/`.

## Invariants: do not weaken these

- Every gate finding blocks. Do not add a warning level or a skip flag.
- `promote` only accepts content whose hash is in `.pipeline/verified.json`.
  Do not add a way to publish to production that bypasses it.
- Adapters are idempotent. A second run with the same content must return `unchanged`.
- Credentials come from the environment. Never write one into a file that git tracks.
  The staging password in `staging/blueprint.json` is the one exception: it belongs to
  a site that is rebuilt on every start.

## Adding things

- New gate rule: add it to `src/gate/seo.js` or `src/gate/voice.js` with an id and a
  `check` that returns a message, a list of messages, or nothing. Add a case to
  `tests/gate.test.js` proving it fires alone on an otherwise passing article.
- New platform (Shopify, Webflow): add `src/adapters/<name>.js` exporting a factory
  that returns `{ upsert(article) }` with the same return shape as the WordPress one,
  and select it in `src/config.js`. It is not done until `verify` passes against a
  real test store.
- New article: front matter needs `title`, `description`, `keyword`. The file name is the slug.

## Style

Plain ES modules, no build step, no TypeScript. Keep dependencies to what is in
`package.json` unless there is a strong reason. Thresholds live as named constants
at the top of the rule files.

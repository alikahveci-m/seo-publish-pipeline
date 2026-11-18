import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// Checks the pages a visitor and a crawler actually get, on desktop and on a phone.
// The API saying "201 Created" proves nothing about what the theme rendered.
const { articles } = JSON.parse(readFileSync('.pipeline/staged.json', 'utf8'));

for (const article of articles) {
  test.describe(article.slug, () => {
    let browserErrors;
    let response;

    test.beforeEach(async ({ page }) => {
      browserErrors = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') browserErrors.push(message.text());
      });
      response = await page.goto(article.url);
    });

    test('is the content the gate approved', async ({ page }) => {
      expect(response.status()).toBe(200);
      await expect(page.locator('meta[name="pipeline-hash"]')).toHaveAttribute('content', article.hash);
    });

    test('has a correct head', async ({ page }) => {
      await expect(page).toHaveTitle(new RegExp(`^${RegExp.escape(article.title)}`));
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', article.description);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', article.url);
      await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);

      const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
      const articleSchema = schemas.map((json) => JSON.parse(json)).find((s) => s['@type'] === 'Article');
      expect(articleSchema).toMatchObject({
        headline: article.title,
        description: article.description,
        mainEntityOfPage: article.url,
      });
    });

    test('has a clean body', async ({ page }) => {
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(article.title);

      // Markdown that leaked through unrendered.
      const body = await page.locator('main').innerText();
      expect(body).not.toMatch(/^#{1,6} |\*\*|\]\(/m);

      for (const image of await page.locator('main img').all()) {
        await expect(image).toHaveAttribute('alt', /\S/);
        expect(await image.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
      }
      expect(browserErrors).toEqual([]);
    });

    test('has no broken internal links', async ({ page, request }) => {
      const origin = new URL(article.url).origin;
      const hrefs = await page.locator('main a[href]').evaluateAll((links) => links.map((a) => a.href));
      const internal = [...new Set(hrefs)].filter((href) => href.startsWith(origin));
      expect(internal.length).toBeGreaterThan(0);

      for (const href of internal) {
        const linked = await request.get(href);
        expect(linked.status(), href).toBe(200);
      }
    });

    test('fits the screen', async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}

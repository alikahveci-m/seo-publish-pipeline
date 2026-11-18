import { parse } from 'node-html-parser';
import { seoRules } from './seo.js';
import { voiceRules } from './voice.js';

export const rules = [...seoRules, ...voiceRules];

// Every finding blocks. There is no warning level: a warning nobody has to act on
// is how bad pages end up on client sites.
export function checkArticle(article) {
  const root = parse(article.html);
  const paragraphs = root.querySelectorAll('p').map((p) => p.text.replace(/\s+/g, ' ').trim());
  const text = root.text.replace(/\s+/g, ' ').trim();
  const context = { article, root, paragraphs, text, words: text ? text.split(' ') : [] };

  // A rule returns a message, a list of messages, or nothing when the article is fine.
  return rules.flatMap((rule) =>
    [rule.check(context)]
      .flat()
      .filter(Boolean)
      .map((message) => ({ rule: rule.id, message })),
  );
}

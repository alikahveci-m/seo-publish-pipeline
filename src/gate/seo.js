const TITLE = { min: 30, max: 60 };
const DESCRIPTION = { min: 70, max: 160 };
const MIN_WORDS = 300;

const outside = (value, { min, max }) => value.length < min || value.length > max;

export const seoRules = [
  {
    id: 'title-length',
    check: ({ article }) =>
      outside(article.title, TITLE) &&
      `Title is ${article.title.length} characters; keep it between ${TITLE.min} and ${TITLE.max}.`,
  },
  {
    id: 'description-length',
    check: ({ article }) =>
      outside(article.description, DESCRIPTION) &&
      `Meta description is ${article.description.length} characters; keep it between ${DESCRIPTION.min} and ${DESCRIPTION.max}.`,
  },
  {
    id: 'slug-format',
    check: ({ article }) =>
      !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(article.slug) &&
      `Slug "${article.slug}" must be lowercase words joined by hyphens.`,
  },
  {
    id: 'single-h1',
    check: ({ root }) =>
      root.querySelector('h1') && 'Body contains an H1. The theme prints the title as the only H1.',
  },
  {
    id: 'heading-order',
    check: ({ root }) => {
      let previous = 1;
      const problems = [];
      for (const heading of root.querySelectorAll('h2, h3, h4, h5, h6')) {
        const level = Number(heading.tagName[1]);
        if (level > previous + 1) {
          problems.push(`"${heading.text.trim()}" jumps from H${previous} to H${level}.`);
        }
        previous = level;
      }
      return problems;
    },
  },
  {
    id: 'word-count',
    check: ({ words }) =>
      words.length < MIN_WORDS && `Body has ${words.length} words; the minimum is ${MIN_WORDS}.`,
  },
  {
    id: 'internal-link',
    check: ({ root }) =>
      !root.querySelectorAll('a').some((a) => /^\/[^/]/.test(a.getAttribute('href') ?? '')) &&
      'No internal link. Link to at least one other page on the site with a root-relative URL.',
  },
  {
    id: 'empty-link',
    check: ({ root }) =>
      root
        .querySelectorAll('a')
        .filter((a) => ['', '#'].includes((a.getAttribute('href') ?? '').trim()) || !a.text.trim())
        .map((a) => `Link "${a.text.trim() || a.getAttribute('href')}" has no target or no text.`),
  },
  {
    id: 'image-alt',
    check: ({ root }) =>
      root
        .querySelectorAll('img')
        .filter((img) => !(img.getAttribute('alt') ?? '').trim())
        .map((img) => `Image ${img.getAttribute('src')} has no alt text.`),
  },
  {
    id: 'keyword-placement',
    check: ({ article, words }) => {
      const keyword = article.keyword.toLowerCase();
      if (!keyword) return 'Front matter has no keyword.';
      const problems = [];
      if (!article.title.toLowerCase().includes(keyword)) {
        problems.push(`Keyword "${keyword}" is not in the title.`);
      }
      if (!words.slice(0, 100).join(' ').toLowerCase().includes(keyword)) {
        problems.push(`Keyword "${keyword}" is not in the first 100 words.`);
      }
      return problems;
    },
  },
];

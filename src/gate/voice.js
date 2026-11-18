// Text that should never reach a client site: model leftovers and unfinished drafts.
const LEFTOVERS = [
  'as an ai language model',
  'as a large language model',
  'i hope this helps',
  'lorem ipsum',
  '[insert',
  'todo:',
];

// Stock phrases readers recognise as machine-written. Zero tolerance: one is enough to block.
const STOCK_PHRASES = [
  'delve into',
  "in today's fast-paced",
  "in today's digital landscape",
  'ever-evolving',
  "it's important to note",
  'it is important to note',
  "it's worth noting",
  'unlock the power',
  'unlock the full potential',
  'game-changer',
  'game changer',
  'navigate the complexities',
  'in conclusion,',
  'a testament to',
  'rich tapestry',
  'look no further',
  'in the realm of',
  'elevate your',
  'to the next level',
  'seamlessly',
];

const MAX_DASHES_PER_500_WORDS = 2;
const MAX_NOT_JUST_BUT = 1;
const SAME_OPENER_RUN = 3;

const normalise = (text) => text.toLowerCase().replace(/[‘’]/g, "'");
const found = (text, phrases) => phrases.filter((phrase) => normalise(text).includes(phrase));

export const voiceRules = [
  {
    id: 'draft-leftover',
    check: ({ text }) => found(text, LEFTOVERS).map((phrase) => `Contains "${phrase}".`),
  },
  {
    id: 'stock-phrase',
    check: ({ text }) => found(text, STOCK_PHRASES).map((phrase) => `Contains "${phrase}".`),
  },
  {
    id: 'dash-density',
    check: ({ text, words }) => {
      const dashes = (text.match(/—/g) ?? []).length;
      const allowed = Math.max(1, Math.floor((words.length / 500) * MAX_DASHES_PER_500_WORDS));
      return dashes > allowed && `${dashes} em dashes in ${words.length} words; at most ${allowed}.`;
    },
  },
  {
    id: 'not-just-but',
    check: ({ text }) => {
      const count = (text.match(/\bnot (just|only)\b[^.?!]{0,80}\bbut\b/gi) ?? []).length;
      return count > MAX_NOT_JUST_BUT && `"not just X but Y" appears ${count} times.`;
    },
  },
  {
    id: 'repeated-opener',
    check: ({ paragraphs }) => {
      const openers = paragraphs
        .flatMap((paragraph) => paragraph.split(/(?<=[.?!])\s+/))
        .map((sentence) => normalise(sentence).match(/^[a-z']+/)?.[0])
        .filter(Boolean);
      for (let i = 0; i + SAME_OPENER_RUN <= openers.length; i++) {
        const run = openers.slice(i, i + SAME_OPENER_RUN);
        if (run.every((word) => word === run[0])) {
          return `${SAME_OPENER_RUN} sentences in a row start with "${run[0]}".`;
        }
      }
    },
  },
];

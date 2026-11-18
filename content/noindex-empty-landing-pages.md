---
title: Noindex empty landing pages without losing them
description: Empty landing pages should leave the index when they have nothing to show and return when they do. Here is a rule that handles both without manual work.
keyword: empty landing pages
---

Programmatic sites collect empty landing pages over time. A city page is created for every city, a category page for every category, and some of them never get a single listing. Others had listings last month and have none today.

Deleting them is the wrong fix. The page for a small city may be empty in March and have five listings in April. If you delete it, you throw away the URL, its internal links and whatever history it had. If you leave it indexed, you are asking Google to rank a page with nothing on it.

## One rule instead of a list

On a pet marketplace with landing pages for every city and district, I replaced a static list of noindexed URLs with a single rule evaluated on every request:

- the page is active and has at least one live listing: index it
- anything else: `noindex, follow`

The count comes from live listings, so nobody maintains anything. When the last listing in a city expires, the page drops out on the next crawl. When a new listing arrives, the page is indexable again without a deploy. At the time of the change, 147 city pages and 162 district pages had no listings at all.

`follow` matters here. An empty city page still links to its region and to nearby cities that do have listings, and those links should keep working for crawlers.

## Keep the sitemap consistent

A sitemap that lists noindexed URLs sends two opposite signals. The sitemap query has to use the same condition as the robots tag, so a page with zero listings is left out of the sitemap in the same moment it becomes noindex.

Put the condition in one function and call it from both places. If the rule lives in two queries, they drift apart within a few months.

## Test the rule, not the pages

A rule like this is small enough to test completely: active with listings, active without, inactive with listings, inactive without. Four cases cover it, and they run in milliseconds. That is cheaper than discovering in Search Console that a few thousand pages have been excluded for the wrong reason.

For the checks that come before and after a change like this, see the [technical SEO checklist](/technical-seo-checklist/).

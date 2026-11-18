---
title: How to find a redirect loop that is costing you clicks
description: A redirect loop rarely shows up as an error in your reports. Here is how to find one in Search Console and server data, and how to fix it for good.
keyword: redirect loop
---

A redirect loop is easy to miss because nothing looks broken from the inside. The page exists in the CMS, the redirect rule looks correct on its own, and the dashboard is green. Meanwhile a browser asking for the URL gets sent from A to B and back to A until it gives up.

I once found a set of these on a marketplace with redirects managed in two places: the application and a bulk redirect list at the CDN. Each rule was fine alone. Together, a handful of them pointed at each other. The pages had been losing about 1,430 clicks a month and no report said why.

## Where the loop hides

Start with the pages that lost clicks without losing rankings first. In Search Console, filter the Pages report by "Redirect error" and export the list. That list is usually short and incomplete, so treat it as a starting point.

Then request every URL in your redirect rules and follow the chain yourself. Three things are worth recording for each one:

- the number of hops before a 200
- whether any URL appears twice in the chain
- which system answered each hop

The third point matters most. A loop almost always crosses a boundary between two systems that each believe they own the URL.

## Fixing it so it stays fixed

Removing one rule ends today's loop. It does not stop the next one. What does:

1. Keep one source of truth for redirects and generate the other from it.
2. Before any new rule ships, resolve its target against the existing rules and reject it if the chain is longer than one hop.
3. Run the full chain check on a schedule and fail loudly when a URL repeats.

After the fix, every old URL should reach its final page in a single 301. Check that with a fresh crawl instead of trusting the rule list, then watch clicks on the affected pages for the next two weeks.

If you are working through a larger cleanup, the [technical SEO checklist](/technical-seo-checklist/) covers the order I do these checks in.

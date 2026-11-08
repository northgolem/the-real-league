# SEO and sharing improvements — 8 November 2026

Owner explicitly approved implementation of SEO and sharing improvements in chat.
Budget: no new expenditure. No new analytics, cookies, outreach or commercial services.

Changes: crawlable Spanish homepage at /es/ with reciprocal hreflang and canonical URLs; real language links; homepage and article social PNG cards; article metadata with organizational author; native sharing/clipboard fallback; related journal links from the Norwich and Espanyol season pages; sitemap includes Spanish homepage (233 URLs).

Rebuild commands: `python scripts/build_discovery.py`, `python scripts/build_seo.py`. To edit social graphics: `python scripts/build_social_cards.py` (Pillow and DejaVu fonts required). Keep current standings out of social cards to avoid stale live scores. Historical cards explicitly describe alternative competitions.

Validated: existing home, bilingual table and archive navigation tests; sitemap validator; local HTML links, canonical uniqueness and 1200x630 social assets; native share/clipboard/cancel/error tests. Local graphical browser execution was unavailable due to environment restrictions; mobile visual verification is not claimed.

Search Console ownership/access is not verified. No sitemap submission or Google indexing outcome is claimed. Existing robots.txt points to the sitemap. Ranking and traffic impact remain unmeasured.

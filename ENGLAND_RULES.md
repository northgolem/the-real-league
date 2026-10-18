# England — changing the guest list

The **single source of truth** for the English league's excluded clubs is:

`public/config/england.json`

The default list is Arsenal, Chelsea, Liverpool, Manchester City, Manchester United and Tottenham Hotspur ("Big Six").

## To change it

1. Edit `excludedClubs` in `public/config/england.json`. Each entry needs:
   - `name`: how the club appears on the site (for example `Newcastle United`)
   - `id`: its stable **football-data.org** club ID (e.g. Newcastle United is `67`)
   - `aliases`: alternative historical spellings found in the CC0 archives (e.g. `Newcastle United FC`)
2. Change `exclusionLabel` if it is no longer the Big Six. For example `The Rich Kids`.
3. Commit that file to GitHub. **No need to edit historic scores, live results, tables or the archive by hand.**

Our GitHub Actions rebuild:
- Today's Premier League table from finished real football-data.org fixtures.
- Every historic Premier League season from cached CC0 match results.
- 34 year-by-year pages and the English historical honours board.
- The combined Google sitemap, if historical winners change.

The live English page and home-page current-leader preview read this same configuration.
They **refuse to show mismatched/stale standings** during regeneration.

### Guardrails

- A currently excluded team must play in the current Premier League; otherwise the live calculation refuses to publish instead of generating a broken table.
- A historical excluded club may have been absent from the top division. Such a club has no fixtures removed from that season. This is intentional.
- The archive validates full home-and-away match coverage before publishing a season.
- Each historic source fixture is preserved in `public/england/history/matches/<season>.json` with its CC0 licence and source credit.
- Each historical table is recalculated using *only* the actual matches between surviving clubs.
- There is no artificial redistribution of points or modified scores.

### Editorial and SEO

If the meaning of the exclusion group changes substantially, review the permanent headline and description in `public/england/index.html` and `public/index.html`. The runtime standings, excluded-club list, teaser and primary table explanation adapt automatically, but fixed marketing/SEO copy deserves a human pass.

The recalculated historical champions will change whenever the guest list changes. This is not a bug; it's the point.

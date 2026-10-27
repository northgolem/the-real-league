#!/usr/bin/env python3
"""Static England history pages from validated CC0 fixtures and exclusion config.

Called by scripts/build_seo.py so both leagues share a single sitemap.
No network calls, generated sports photographs, crests or manually typed scores.
"""
from collections import Counter
from season_story import season_facts
from html import escape
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]/"public"
ARCHIVE=ROOT/"england/history"
CFG=ROOT/"config/england.json"
BASE="https://usurperleague.com"


def e(value):
    return escape(str(value),quote=True)


def write_if_changed(path,text):
    path.parent.mkdir(parents=True,exist_ok=True)
    if not path.exists() or path.read_text(encoding="utf8")!=text:
        path.write_text(text,encoding="utf8")


def html_page(title,description,canonical,body):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#102e25">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>{e(title)}</title>
<meta name="description" content="{e(description)}">
<link rel="canonical" href="{e(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Usurper League">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{e(canonical)}">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="/archive.css">
</head>
<body>
<header class="site-header"><div class="page-width header-flex">
<a class="site-brand" href="/"><img src="/favicon.svg" width="35" height="35" alt=""> THE USURPER LEAGUE</a>
<nav aria-label="Choose league or historical archive">
<a href="/">Home</a><a href="/spain/">Spain</a><a href="/england/">England</a>
<a href="/england/history/">English archive</a></nav>
</div></header>
<main class="page-width">{body}</main>
<footer class="footer"><div class="page-width footer-grid"><span><b>The Usurper League — England.</b> Let the rich kids keep the sandpit. We're having a league.</span><span>Independent alternative Premier League calculations. No official affiliation. No club logos. Results from cited public-domain match archives.</span></div></footer>
</body>
</html>"""


def table(data,heading):
    cols=["#","Club","P","W","D","L","GF","GA","GD","Pts"]
    rows=[]
    for row in data:
        vals=[row["position"],row["name"]]+[row[k] for k in ("P","W","D","L","GF","GA","GD","Pts")]
        tds="".join(
            f'<th scope="row">{e(value)}</th>' if i==0 else f"<td>{e(value)}</td>"
            for i,value in enumerate(vals))
        rows.append(f'<tr{" class=champion" if row["position"]==1 else ""}>{tds}</tr>')
    return ('<div class="table-scroll"><table aria-label="'+e(heading)+'"><thead><tr>'+
            "".join(f'<th scope="col">{c}</th>' for c in cols)+'</tr></thead><tbody>'+
            "".join(rows)+'</tbody></table></div>')


def year_page(data, index, p, i, cfg):
    season = data["season"]
    sid = data["seasonId"]
    facts = season_facts(data)
    champion, runner = facts["winner"], facts["runner"]
    full_leader = facts["full_leader"]
    label = cfg["exclusionLabel"]
    excluded = data["excludedInSeason"]
    missing = sorted(set(data["excluded"]) - set(excluded))
    url = f"{BASE}/england/history/{sid}/"
    title = f"Premier League {season} Without the {label} | {champion['name']} Win"
    desc = (f"Premier League {season} recalculated without the {label}: "
            f"{champion['name']} finish first on {champion['Pts']} points, "
            f"{facts['margin']} ahead of {runner['name']}. "
            f"{facts['removed']} real fixtures removed.")

    if facts["same_champion"]:
        shift_title = "Even without the usual suspects, the leader stays put."
        comparison = (
            f"<strong>{e(champion['name'])}</strong> led our calculation with all clubs "
            "included too. The guest list changes. The first name on the table doesn't. "
            "That happens. We don't fiddle with the results to make a better punchline."
        )
    else:
        shift_title = f"{e(champion['name'])} take the lead. Different company."
        comparison = (
            f"<strong>{e(full_leader['name'])}</strong> led the all-club calculation. "
            f"Remove the {e(label)} and all the fixtures they played, and "
            f"<strong>{e(champion['name'])}</strong> top the table instead."
        )
    lead = facts["margin"]
    if lead:
        race = (f"<strong>{e(champion['name'])}</strong> finish {lead} points ahead "
                f"of <strong>{e(runner['name'])}</strong>, who have {runner['Pts']}. "
                + ("Not much room for complacency." if lead <= 2 else
                   "A healthier lead than the arguments in the comments, probably."))
    else:
        race = (
            f"<strong>{e(champion['name'])}</strong> and <strong>{e(runner['name'])}</strong> "
            f"finish level on {champion['Pts']} points. "
            "Goal difference and then goals scored decide our ordering."
        )
    biggest = facts["biggest_gain"]
    if biggest:
        gain, team, before, after = biggest
        moving = (
            f"<strong>{e(team['name'])}</strong> make the biggest climb among the "
            f"clubs still in the division: from {before} to {after}, up {gain} "
            f"{'place' if gain == 1 else 'places'}. "
            "That's a comparison against the same surviving teams, not a free jump "
            "just because we deleted six names."
        )
    else:
        moving = (
            "The surviving clubs finish in the same relative order as in our "
            "all-club calculation. Points and games change. The pecking order doesn't. "
            "We promise not to fake a twist."
        )
    if missing:
        phrase = "wasn't" if len(missing)==1 else "weren't"
        missing_text = (
            f"<aside class=\"notice\"><strong>Not in the division:</strong> "
            f"{e(', '.join(missing))} {phrase} playing in the Premier League "
            "that year. So there were no fixtures involving those clubs to remove.</aside>"
        )
    else:
        missing_text = ""
    prev = index[i + 1]["id"] if i + 1 < len(index) else None
    next = index[i - 1]["id"] if i > 0 else None
    season_links = '<nav class="season-siblings" aria-label="Other seasons">'
    season_links += (f'<a href="/england/history/{e(prev)}/">← {e(prev.replace("-", "/"))}</a>'
                     if prev else '<span></span>')
    season_links += '<a href="/england/history/">All English seasons ↑</a>'
    season_links += (f'<a href="/england/history/{e(next)}/">{e(next.replace("-", "/"))} →</a>'
                     if next else '<span></span>')
    season_links += '</nav>'
    content = f"""
<div class="breadcrumbs"><a href="/">Home</a> / <a href="/england/">England</a> / <a href="/england/history/">Premier League archive</a> / {e(season)}</div>
<section class="page-hero season-story-hero">
  <div class="kicker">THE USURPER LEAGUE / ENGLAND / {e(season)} / NOT THE OFFICIAL TABLE</div>
  <h1>Premier League {e(season)}.<br><em>Minus the {e(label)}.</em></h1>
  <p class="season-rule"><strong>The rules:</strong> We take the excluded clubs out <em>and delete every match they played</em>. Then we recalculate the standings from actual results between the clubs left. No extra points for beating nobody.</p>
  <p class="standfirst"><strong>{e(champion['name'])}</strong> win our alternative {e(season)} Premier League on <strong>{champion['Pts']} points</strong> from {champion['P']} matches. <strong>{e(runner['name'])}</strong> finish second on {runner['Pts']}. It's a thought experiment, not a forgotten trophy.</p>
  <div class="season-duel" aria-label="Full and alternative league leaders">
    <div class="duel-card"><span class="kicker">ALL CLUBS INCLUDED / CALCULATED LEADER</span><strong>{e(full_leader["name"])}</strong><span>{full_leader["Pts"]} pts · {full_leader["P"]} matches</span></div>
    <div class="duel-card alternative"><span class="kicker">WITHOUT THE {e(label.upper())} / OUR CHAMPION</span><strong>{e(champion["name"])}</strong><span>{champion["Pts"]} pts · {champion["P"]} matches</span></div>
  </div>
  <p class="duel-note">These tables contain different numbers of games; compare the leaders, not the points as though they're the same competition.</p>
  <p class="season-result"><strong>{shift_title}</strong> {comparison}</p>
  <div class="season-hero-links"><a class="primary-link" href="#historic-table">Read the alternative table ↓</a>
    <a class="secondary-link" href="/england/?season={e(sid)}#the-table">Change who's excluded in {e(season)} ↗</a>
  </div>
  <div class="facts">
    <div><span>Our champion</span><strong>{e(champion['name'])}</strong></div>
    <div><span>Points</span><strong>{champion['Pts']}</strong></div>
    <div><span>Clubs remaining</span><strong>{len(data['alternativeTable'])}</strong></div>
    <div><span>Matches kept</span><strong>{facts["kept"]}</strong></div>
  </div>
</section>
<section class="panel" aria-labelledby="historic-table">
  <div class="panel-intro"><span class="kicker">{e(label.upper())} EXCLUDED / {e(season)}</span>
    <h2 id="historic-table">The alternative Premier League table</h2>
    <p>Every match involving an excluded club vanishes for both teams. These are the real results between the clubs still playing.</p></div>
  {table(data["alternativeTable"], f"Premier League {season} without the {label}")}
</section>
<section class="season-findings" aria-labelledby="season-findings-heading">
  <div class="findings-head"><span class="kicker">THREE THINGS FROM {e(season)}</span>
    <h2 id="season-findings-heading">What actually changed?</h2>
    <p>These observations come from the standings for this season. No alternate-universe scorelines required.</p></div>
  <div class="findings-grid">
    <article class="finding"><span class="finding-index">01 / THE TITLE RACE</span><h3>{e(champion['name'])} vs {e(runner['name'])}</h3><p>{race}</p></article>
    <article class="finding"><span class="finding-index">02 / WHO MOVED?</span><h3>The biggest climb</h3><p>{moving}</p></article>
    <article class="finding"><span class="finding-index">03 / THE MISSING MATCHES</span><h3>{facts["removed"]} fixtures deleted</h3>
      <p>We kept {facts["kept"]} of the {data["completedMatches"]} real results. {e(champion['name'])} had {facts["winner_full_points"]} points with everybody included; {facts["winner_excluded_points"]} came from matches we've now removed. Nobody inherited them.</p></article>
  </div>
</section>
{missing_text}
<details class="panel comparison"><summary>See our calculated all-club table for {e(season)}</summary>
{table(data["officialTableApproximation"], f"Full league comparison for {season}")}</details>
<section class="sources"><h2>About the numbers</h2>
<p>These are <b>not official Premier League standings</b>. Wins earn three points; ties are ranked by goal difference and goals scored. Historic official deductions and further tiebreakers aren't necessarily reproduced.</p>
<p>Original completed results: <a href="{e(data['sourceUrl'])}" rel="noopener noreferrer">{e(data['source'])}</a>, CC0-licensed data. The exclusion rule applies only to clubs actually in the top division for that season.</p>
<p>If you'd have kicked someone else out, good news: that's now an option.</p></section>
<aside class="discovery-cta" aria-label="Make your own league">
  <div><span class="kicker">THE RULES ARE YOURS NOW</span><h2>Think we've kicked out the wrong clubs?</h2>
    <p>Choose any, all or none of the Big Six. Watch the {e(season)} league rebuild from the same real match results and send your version to a friend who disagrees.</p></div>
  <div class="discovery-links"><a class="primary-link" href="/england/?season={e(sid)}#the-table">Build your own {e(season)} league ↗</a>
    <a href="/la-liga/">Or explore 94 seasons of Spain →</a></div>
</aside>
{season_links}
"""
    return html_page(title, desc, url, content)


def index_page(rows,cfg):
    counts=Counter(x["champion"] for x in rows)
    leaderboard="".join(f'<tr><th scope="row">{e(name)}</th><td>{count}</td></tr>'
        for name,count in sorted(counts.items(),key=lambda item:(-item[1],item[0])))
    by_decade={}
    for row in rows:
        decade=row["id"][:3]+"0s"
        by_decade.setdefault(decade,[]).append(row)
    decades=[]
    for decade,items in sorted(by_decade.items(),reverse=True):
        table_rows="".join(
            f'<tr><th scope="row"><a href="/england/history/{e(x["id"])}/">{e(x["label"])}</a></th>'
            f'<td>{e(x["champion"])}</td><td>{x["points"]}</td><td>{x["clubs"]}</td></tr>'
            for x in items)
        decades.append(f'<section class="decade-section"><h3>{e(decade)}</h3><div class="table-scroll"><table>'
        '<thead><tr><th scope="col">Season</th><th scope="col">Alternative champion</th>'
        '<th scope="col">Pts</th><th scope="col">Clubs</th></tr></thead>'
        f'<tbody>{table_rows}</tbody></table></div></section>')
    label=cfg["exclusionLabel"]
    n=len(rows)
    first=rows[-1]["label"] if rows else "1992/93"
    last=rows[0]["label"] if rows else "2025/26"
    description=f"{n} Premier League seasons recalculated without the {label}: alternative champions, complete league tables and a historical honours board. Real matches, different winners."
    body=f"""
<div class="breadcrumbs"><a href="/">Home</a> / <a href="/england/">England</a> / Premier League archive</div>
<section class="page-hero index-hero">
  <span class="kicker">THE USURPER LEAGUE / ENGLAND / ALTERNATIVE HISTORY</span>
  <h1>English football.<br><em>A few more champions.</em></h1>
  <p class="standfirst">{n} completed Premier League seasons ({e(first)}–{e(last)}), minus the fixtures involving the {e(label)}. Every surviving match result is real.</p>
  <p>Manchester United and friends have had a decent run. We're curious how English football looks without them. Some clubs weren't even in the top flight every year; we don't pretend otherwise.</p>
  <a class="primary-link" href="/england/">See the current English league ↗</a>
</section>
<section class="split">
  <div class="panel"><div class="panel-intro"><span class="kicker">THE ALTERNATIVE HONOURS BOARD</span><h2>The titles they didn't win. Officially.</h2><p>Number of alternative first-place finishes across our {n} validated historical Premier League seasons. Real results, imaginary trophies.</p></div>
  <div class="table-scroll"><table><thead><tr><th scope="col">Club</th><th scope="col">Alternative titles</th></tr></thead><tbody>{leaderboard}</tbody></table></div></div>
  <div class="panel method-panel"><span class="kicker">THE RULES</span><h2>Everybody else gets a turn.</h2>
    <p>We remove <em>all matches</em> involving the excluded clubs that competed in each historical season. Three points per win. No made-up goals and no reallocated points.</p>
    <p>If an excluded club wasn't in the Premier League, it can't be removed from that year's fixtures. Some seasons therefore contain more surviving teams.</p>
    <p>Original CC0-licensed match results are preserved, so the list of excluded clubs can be changed and every season recalculated without changing a single score.</p>
  </div>
</section>
<section class="all-seasons"><span class="kicker">THE ENGLISH ARCHIVE</span><h2>Choose a season</h2>
<p>Each year has the complete alternative league table, an all-club comparison, the original match source and a note about excluded clubs absent from the top division.</p>{''.join(decades)}</section>
"""
    return html_page(f"Premier League Without the {label}: {n} Historical Seasons | The Usurper League",
                      description,BASE+"/england/history/",body)


def build():
    if not (ARCHIVE/"index.json").exists():
        print("English historical source not yet published. Skipping English SEO pages.")
        return []
    cfg=json.loads(CFG.read_text(encoding="utf8"))
    index=json.loads((ARCHIVE/"index.json").read_text(encoding="utf8"))
    rows=index["seasons"]
    if len(rows)<24:
        raise ValueError("Refusing to publish incomplete England archive")
    if index["excluded"] != [x["name"] for x in cfg["excludedClubs"]]:
        raise ValueError("Historical England archive has stale exclusion rules; rebuild before SEO")
    for i,row in enumerate(rows):
        data=json.loads((ARCHIVE/"seasons"/(row["id"]+".json")).read_text(encoding="utf8"))
        if data["seasonId"] != row["id"] or data["alternativeTable"][0]["name"]!=row["champion"]:
            raise ValueError(f"Invalid historical page input {row['id']}")
        write_if_changed(ARCHIVE/row["id"]/"index.html",year_page(data,rows,row,i,cfg))
    write_if_changed(ARCHIVE/"index.html",index_page(rows,cfg))
    print(f"Published {len(rows)} historical English league pages and the honours board.")
    return ["/england/history/"]+[f"/england/history/{r['id']}/" for r in rows]


if __name__=="__main__":
    build()

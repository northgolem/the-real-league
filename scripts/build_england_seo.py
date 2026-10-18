#!/usr/bin/env python3
"""Static England history pages from validated CC0 fixtures and exclusion config.

Called by scripts/build_seo.py so both leagues share a single sitemap.
No network calls, generated sports photographs, crests or manually typed scores.
"""
from collections import Counter
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


def year_page(data,index,p,i,cfg):
    season=data["season"]
    sid=data["seasonId"]
    champion=data["alternativeTable"][0]
    full_leader=data["officialTableApproximation"][0]
    excluded=data["excludedInSeason"]
    exclusions=", ".join(excluded)
    label=cfg["exclusionLabel"]
    n=len(data["alternativeTable"])
    pts=champion["Pts"]
    url=f"{BASE}/england/history/{sid}/"
    title=f"Premier League {season} Without the {label} | {champion['name']} Win"
    desc=f"Recalculated Premier League {season} without the {label}: {champion['name']} lead on {pts} points. Full real-match table, surviving clubs and the original results source."
    missing=sorted(set(data["excluded"])-set(excluded))
    if missing:
        missing_text='<p><b>Historical footnote:</b> ' + e(", ".join(missing)) + (
            " were not in the top flight that season, so naturally no matches involving "
            "those clubs were removed.</p>")
    else:
        missing_text=""
    prev=index[i+1]["id"] if i+1<len(index) else None
    next=index[i-1]["id"] if i>0 else None
    season_links=f'''<nav class="season-siblings">
<a href="/england/history/{e(prev)}/" {'hidden' if not prev else ''}>← Earlier season</a>
<a href="/england/history/">Every season ↑</a>
<a href="/england/history/{e(next)}/" {'hidden' if not next else ''}>Later season →</a>
</nav>''' if prev and next else '<nav class="season-siblings"><a href="/england/history/">All historical seasons ↗</a></nav>'
    content=f"""
<div class="breadcrumbs"><a href="/">Home</a> / <a href="/england/">England</a> / <a href="/england/history/">Premier League archive</a> / {e(season)}</div>
<section class="page-hero">
  <div class="kicker">THE USURPER LEAGUE / ENGLAND / {e(season)}</div>
  <h1>Premier League {e(season)}.<br><em>A different title race.</em></h1>
  <p class="standfirst"><strong>{e(champion["name"])}</strong> win our alternative {e(season)} Premier League with <strong>{pts} points</strong> from {champion["P"]} matches. The usual suspects have been excused.</p>
  <p>We removed every fixture involving the clubs on our exclusion list <em>who actually played in the Premier League that year</em>. We kept all other scores unchanged. That's {data["includedMatches"]} real matches and {n} competing clubs.</p>
  <div class="facts">
    <div><span>Our champion</span><strong>{e(champion["name"])}</strong></div>
    <div><span>Points</span><strong>{pts}</strong></div>
    <div><span>Teams competing</span><strong>{n}</strong></div>
    <div><span>Matches kept</span><strong>{data["includedMatches"]}</strong></div>
  </div>
</section>
<section class="panel">
  <div class="panel-intro"><span class="kicker">{e(label.upper())} EXCLUDED</span>
  <h2>The new {e(season)} table</h2>
  <p>No imaginary fixtures. No points generously handed out. The other clubs keep their results against one another.</p></div>
  {table(data["alternativeTable"], f"Premier League {season} without the {label}")}
</section>
<section class="explain">
  <div><span class="kicker">THE ORIGINAL COMPETITION, RECALCULATED</span><h2>How the table changes</h2>
    <p>With everybody participating, <b>{e(full_leader["name"])}</b> lead our all-club calculation. Removing {e(label)} fixtures puts <b>{e(champion["name"])}</b> first in the alternative league.</p>
  </div>
  <div><span class="kicker">THE RULES</span><h2>Who's been excused?</h2>
    <p>Excluded clubs present in {e(season)}: <b>{e(exclusions) if excluded else "None"}</b>. We removed {data["excludedMatches"]} fixtures, along with every point and goal from those matches.</p>
    {missing_text}
  </div>
</section>
<details class="panel comparison"><summary>See the all-club calculated table for comparison</summary>
{table(data["officialTableApproximation"], f"Full league comparison for {season}")}</details>
<section class="sources"><h2>About the numbers</h2>
<p>This is <b>not</b> an official Premier League table. We use real results to calculate an alternative competition. Wins earn three points; ties are ordered by goal difference and goals scored. This does not attempt every official historical disciplinary deduction or tiebreaker.</p>
<p>Original historical match results: <a href="{e(data["sourceUrl"])}" rel="noopener noreferrer">{e(data["source"])}</a>, CC0 public-domain licensed. Each source season was validated as a complete home-and-away league before inclusion.</p>
<p>That trophy never existed. The argument about who deserves it absolutely can.</p>
</section>
{season_links}
"""
    return html_page(title,desc,url,content)


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

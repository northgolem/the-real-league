#!/usr/bin/env python3
"""Build archival alternative La Liga tables from CC0 match-result archives.

Sources:
* 1928/29–2017/18: Jack-Tilley/es-espana (CC0)
* 2018/19–2025/26: openfootball/football.json (CC0)

Civil War 1936–39: no league was played. Missing/partial seasons are not published.
Historical tables are calculated from match results, not copied from official standings:
points deductions and Spanish head-to-head tiebreaks are not recreated.
"""
import csv
import datetime as dt
import io
import json
import re
import sys
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/history"
# All known Spanish league years through the last completed season.
FIRST = 1928
LAST = 2025
SKIPPED = {1936, 1937, 1938, 1962}  # No league during Civil War; 1962/63 not in licensed source
OLD_SOURCE = "https://raw.githubusercontent.com/Jack-Tilley/es-espana/master"
NEW_SOURCE = "https://raw.githubusercontent.com/openfootball/football.json/master"

def clean_name(original):
    text = re.sub(r"\s*\(\d+\)\s*$", "", str(original)).strip()
    text = re.sub(r"\s+", " ", text)
    if not text:
        raise ValueError("Missing team name")
    key = ''.join(c for c in unicodedata.normalize("NFD", text.casefold()) if unicodedata.category(c) != "Mn")
    key = key.replace(".", "").strip()
    # Match only known aliases. Do not accidentally merge unrelated historic clubs.
    rules = [
        (r"^(?:fc |cf |f c )?barcelona(?: fc)?$", "FC Barcelona"),
        (r"^(?:real )?madrid(?: (?:cf|fc))?$", "Real Madrid"),
        (r"^(?:club )?(?:atletico|athletic)(?: club)?(?: de)? madrid(?: cf)?$|^atletico aviacion$", "Atlético Madrid"),
        (r"^athletic(?: club)?(?: de)? bilbao(?: (?:cf|fc))?$|^athletic club$", "Athletic Club"),
        (r"^(?:rcd? )?(?:la coruna|deportivo(?: la coruna)?|dep la coruna|deportivo de la coruna)$", "Deportivo La Coruña"),
        (r"^(?:rc )?celta(?: de)? vigo(?: cf)?$|^celta$", "Celta Vigo"),
        (r"^(?:real )?racing(?: (?:club|c))?(?: de)? santander(?: cf)?$|^r racing c$|^racing santander$|^santander$", "Racing Santander"),
        (r"^(?:rcd? )?(?:espanyol|espanol)(?: de barcelona)?$", "Espanyol"),
        (r"^(?:real )?sociedad(?: de futbol)?$", "Real Sociedad"),
        (r"^(?:deportivo )?alaves$", "Alavés"),
        (r"^real betis(?: balompie)?$", "Real Betis"),
        (r"^(?:fc )?sevilla(?: fc)?$", "Sevilla FC"),
        (r"^rayo vallecano(?: de madrid)?$", "Rayo Vallecano"),
        (r"^(?:ca )?osasuna$", "Osasuna"),
        (r"^(?:getafe(?: cf)?)$", "Getafe"),
        (r"^(?:valencia(?: cf)?)$", "Valencia"),
        (r"^(?:villarreal(?: cf)?)$", "Villarreal"),
        (r"^(?:ud )?levante(?: ud)?$", "Levante"),
        (r"^(?:malaga(?: cf)?)$", "Málaga"),
        (r"^(?:elche(?: cf)?)$", "Elche"),
        (r"^(?:real )?zaragoza(?: (?:cf|fc))?$", "Real Zaragoza"),
        (r"^(?:real )?valladolid(?: cf)?$", "Real Valladolid"),
        (r"^sporting(?: de)? gijon$|^real sporting(?: de gijon)?$", "Sporting Gijón"),
        (r"^(?:real )?oviedo$", "Real Oviedo"),
    ]
    for regex, label in rules:
        if re.fullmatch(regex, key):
            return label
    return text

def fetch(url):
    for attempt in range(3):
        try:
            request = Request(url, headers={"User-Agent": "TheRealLeagueHistoricalArchive/1.0"})
            with urlopen(request, timeout=25) as response:
                return response.read().decode("utf-8-sig")
        except HTTPError as error:
            if error.code == 404:
                return None
            if error.code in {403, 429, 500, 502, 503} and attempt < 2:
                time.sleep(2 * (attempt + 1))
                continue
            raise
        except (URLError, TimeoutError):
            if attempt >= 2:
                raise
            time.sleep(2 * (attempt + 1))

def source_info(year):
    season = f"{year}-{str(year+1)[-2:]}"
    if year <= 2017:
        return season, f"{OLD_SOURCE}/{season}/1-liga.csv", "Jack-Tilley/es-espana", "https://github.com/Jack-Tilley/es-espana"
    return season, f"{NEW_SOURCE}/{season}/es.1.json", "openfootball/football.json", "https://github.com/openfootball/football.json"

def parse_archive(text, year):
    output = []
    if year <= 2017:
        for record in csv.DictReader(io.StringIO(text)):
            score = re.fullmatch(r"\s*(\d+)\s*[-–]\s*(\d+)\s*", record.get("FT", ""))
            if not score:
                continue
            home = clean_name(record.get("Team 1", ""))
            away = clean_name(record.get("Team 2", ""))
            output.append((home, away, int(score[1]), int(score[2])))
    else:
        doc = json.loads(text)
        for match in doc.get("matches", []):
            rawscore = match.get("score") or {}
            result = rawscore if isinstance(rawscore, list) else rawscore.get("ft")
            if not isinstance(result, list) or len(result) != 2 or not all(type(v) is int for v in result):
                continue
            output.append((clean_name(match["team1"]), clean_name(match["team2"]), result[0], result[1]))
        if year == 2024:
            # OpenFootball 2024/25 lacks the ten final-round scores. These ten
            # factual results are checked against LaLiga's official Jornada 38.
            # https://www.laliga.com/en-GB/laliga-easports/results/2024-25/gameweek-38
            final_round = {
                ("Real Betis", "Valencia"): (1, 1),
                ("Real Madrid", "Real Sociedad"): (2, 0),
                ("Espanyol", "UD Las Palmas"): (2, 0),
                ("CD Leganés", "Real Valladolid"): (3, 0),
                ("Alavés", "Osasuna"): (1, 1),
                ("Getafe", "Celta Vigo"): (1, 2),
                ("Rayo Vallecano", "RCD Mallorca"): (0, 0),
                ("Girona FC", "Atlético Madrid"): (0, 4),
                ("Villarreal", "Sevilla FC"): (4, 2),
                ("Athletic Club", "FC Barcelona"): (0, 3),
            }
            extra = []
            for match in doc.get("matches", []):
                score = match.get("score") or {}
                if isinstance(score, dict) and "ft" in score:
                    continue
                pair = (clean_name(match["team1"]), clean_name(match["team2"]))
                if pair not in final_round:
                    raise ValueError("Unexpected unscored 2024/25 match: " + repr(pair))
                home_goals, away_goals = final_round[pair]
                extra.append((pair[0], pair[1], home_goals, away_goals))
            if len(extra) != 10 or len(set((h,a) for h,a,_,_ in extra)) != 10:
                raise ValueError("2024/25 final-round corrections do not match ten unique games")
            output.extend(extra)
    return output

def standings(matches, year, season, source, source_url):
    pts_per_win = 2 if year < 1995 else 3
    teams = set()
    for home, away, hg, ag in matches:
        if home == away or hg < 0 or ag < 0:
            raise ValueError(f"{season}: invalid match {home}, {away}")
        teams.update((home, away))
    if not {"FC Barcelona", "Real Madrid"}.issubset(teams):
        raise ValueError(f"{season}: missing Barça or Real Madrid; names={sorted(teams)}")
    n = len(teams)
    expected = n * (n-1)
    # 1986/87 had a second-phase format, not the ordinary double round robin.
    # Keep it only if its recorded matches are genuinely numerous enough.
    if year == 1979:
        # An annulled 1979/80 fixture is omitted by the archival source.
        # See engsoccerdata's Spain documentation; do not invent a replacement.
        if len(matches) != expected - 1:
            raise ValueError(f"{season}: expected {expected-1} non-annulled fixtures, received {len(matches)}")
    elif year == 1986:
        if len(matches) < expected:
            raise ValueError(f"{season}: incomplete exceptional-format year ({len(matches)} matches)")
    elif len(matches) != expected:
        raise ValueError(f"{season}: {len(matches)} matches, expected {expected} for {n} clubs")
    if n < 10 or n > 22:
        raise ValueError(f"{season}: unexpected number of clubs: {n}")

    def empty(team):
        return {"name":team,"P":0,"W":0,"D":0,"L":0,"GF":0,"GA":0,"GD":0,"Pts":0}

    full = {name: empty(name) for name in teams}
    alt = {name: empty(name) for name in teams if name not in {"Real Madrid", "FC Barcelona"}}
    excluded = 0

    def record(table, h,a,hg,ag):
        x,y = table[h],table[a]
        x["P"] += 1; y["P"] += 1
        x["GF"] += hg; x["GA"] += ag
        y["GF"] += ag; y["GA"] += hg
        if hg>ag:
            x["W"] += 1; x["Pts"] += pts_per_win; y["L"] += 1
        elif ag>hg:
            y["W"] += 1; y["Pts"] += pts_per_win; x["L"] += 1
        else:
            x["D"] += 1; y["D"] += 1
            x["Pts"] += 1; y["Pts"] += 1

    for h,a,hg,ag in matches:
        record(full,h,a,hg,ag)
        if h in {"Real Madrid", "FC Barcelona"} or a in {"Real Madrid", "FC Barcelona"}:
            excluded += 1
        else:
            record(alt,h,a,hg,ag)
    def table(data):
        rows = list(data.values())
        for x in rows:
            x["GD"] = x["GF"]-x["GA"]
        rows.sort(key=lambda t:(-t["Pts"],-t["GD"],-t["GF"],t["name"]))
        for i,x in enumerate(rows,1):
            x["position"] = i
        return rows
    fr = table(full)
    ar = table(alt)
    positions = {x["name"]:x["position"] for x in fr}
    for r in ar:
        r["originalPosition"] = positions[r["name"]]
        r["positionChange"] = positions[r["name"]] - r["position"]
    return {
        "mode":"historical",
        "competition":"La Liga de los Mortales",
        "season": f"{year}/{str(year+1)[-2:]}",
        "seasonId":season,
        "historical":True,
        "pointsPerWin":pts_per_win,
        "generatedAt":dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "completedMatches":len(matches),
        "excludedMatches":excluded,
        "includedMatches":len(matches)-excluded,
        "excluded":["Real Madrid","FC Barcelona"],
        "officialTableApproximation":fr,
        "alternativeTable":ar,
        "source":source,
        "sourceUrl":source_url,
        "specialFormat":year==1986,
        "historicalNote": "1979/80: one fixture annulled and absent from the archival source." if year==1979 else ("1986/87: special second-phase league format." if year==1986 else ""),
        "methodology":"Each match involving Real Madrid or FC Barcelona removed. Season-era points rules preserved. Rankings use points, goal difference and goals scored; official head-to-head tiebreakers and disciplinary deductions not recreated."
    }

def build_one(year):
    season,url,source,source_url = source_info(year)
    text = fetch(url)
    if text is None:
        raise ValueError(f"{season}: source not available")
    matches = parse_archive(text,year)
    return season,standings(matches,year,season,source,source_url)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    successes,failures = {},{}
    years = [y for y in range(FIRST,LAST+1) if y not in SKIPPED]
    with ThreadPoolExecutor(max_workers=8) as pool:
        pending = {pool.submit(build_one,y):y for y in years}
        for future in as_completed(pending):
            year = pending[future]
            try:
                season,data=future.result()
                successes[season]=data
                print(f"OK {season}: {data['completedMatches']} games, {len(data['alternativeTable'])} mortal clubs",flush=True)
            except Exception as error:
                failures[year]=str(error)
                print(f"SKIP {year}: {error}",file=sys.stderr,flush=True)
    if len(successes)<80:
        raise ValueError(f"Only {len(successes)} seasons validated; refusing to publish a partial archive")
    # Never leave a season from an older run appearing after a later validation failure.
    for file in OUT.glob("????-??.json"):
        if file.stem not in successes:
            file.unlink()
    index = {"title":"Historical alternative La Liga tables",
             "updatedAt":dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
             "sourcePolicy":"CC0 archive match results, recalculated; only validated seasons included",
             "seasons":[]}
    for season in sorted(successes,reverse=True):
        data=successes[season]
        path=OUT/f"{season}.json"
        path.write_text(json.dumps(data,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
        index["seasons"].append({
            "id":season,
            "label":data["season"],
            "champion":data["alternativeTable"][0]["name"],
            "points":data["alternativeTable"][0]["Pts"],
            "pointsPerWin":data["pointsPerWin"],
            "clubs":len(data["alternativeTable"]),
            "matches":data["includedMatches"],
            "specialFormat":data["specialFormat"],
            "historicalNote":data["historicalNote"]
        })
    (OUT/"index.json").write_text(json.dumps(index,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print(f"WROTE {len(successes)} validated completed seasons; skipped {len(failures)} incomplete/unavailable:")
    for year,msg in sorted(failures.items()):
        print(f"  {year}: {msg}")
    print("Civil War 1936-39 and unarchived 1962-63 intentionally omitted.")

if __name__ == "__main__":
    main()

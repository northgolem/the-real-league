#!/usr/bin/env python3
"""Independently calculate historical Premier League tables from CC0 match files.

Uses footballcsv/england (1992/93–2009/10) and openfootball/football.json
(2010/11–2025/26). Every season must be a COMPLETE home-and-away round robin.
Caches the underlying fixtures so changing the excluded clubs never requires
inventing or manually altering points. Incomplete archives are not published.
"""
import csv
import datetime as dt
import io
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OUT = PUBLIC / "england" / "history"
MATCH_DIR = OUT / "matches"
SEASON_DIR = OUT / "seasons"
CONFIG = PUBLIC / "config" / "england.json"
CSV_REPO = "https://raw.githubusercontent.com/footballcsv/england/master"
JSON_REPO = "https://raw.githubusercontent.com/openfootball/football.json/master"
FIRST, LAST = 1992, 2025


def year_id(year):
    return f"{year}-{str(year+1)[-2:]}"


def load_rules():
    cfg = json.loads(CONFIG.read_text(encoding="utf8"))
    excluded = cfg["excludedClubs"]
    names = [club["name"] for club in excluded]
    if len(names) < 1 or len(set(names)) != len(names):
        raise ValueError("Invalid excluded clubs: duplicate or empty list")
    alias = {}
    for club in excluded:
        for term in [club["name"], *club.get("aliases", [])]:
            key = canonical_key(term)
            if key in alias and alias[key] != club["name"]:
                raise ValueError(f"Conflicting alias {term}")
            alias[key] = club["name"]
    return cfg, alias


def canonical_key(value):
    value = re.sub(r"\s+", " ", str(value)).strip()
    return re.sub(r"\s+(?:FC|AFC)$", "", value, flags=re.I).casefold()


# Editorial consistency for historical aliases and source updates.
NAMES = {
    "afc bournemouth": "AFC Bournemouth",
    "bournemouth": "AFC Bournemouth",
    "brighton & hove albion": "Brighton & Hove Albion",
    "brighton and hove albion": "Brighton & Hove Albion",
    "queens park rangers": "Queens Park Rangers",
    "qpr": "Queens Park Rangers",
    "west bromwich albion": "West Bromwich Albion",
    "west ham united": "West Ham United",
    "wolverhampton wanderers": "Wolverhampton Wanderers",
    "nottingham forest": "Nottingham Forest",
    "newcastle united": "Newcastle United",
    "leeds united": "Leeds United",
    "sunderland": "Sunderland",
    "wimbledon": "Wimbledon",
    "milton keynes dons": "Milton Keynes Dons",
    "norwich city": "Norwich City",
    "stoke city": "Stoke City",
    "hull city": "Hull City",
    "cardiff city": "Cardiff City",
    "swansea city": "Swansea City",
    "leicester city": "Leicester City",
    "manchester city": "Manchester City",
    "manchester united": "Manchester United",
    "tottenham hotspur": "Tottenham Hotspur",
    "arsenal": "Arsenal",
    "chelsea": "Chelsea",
    "liverpool": "Liverpool",
    "fulham": "Fulham",
    "everton": "Everton",
    "ipswich town": "Ipswich Town",
    "huddersfield town": "Huddersfield Town",
    "sheffield wednesday": "Sheffield Wednesday",
    "sheffield united": "Sheffield United",
    "crystal palace": "Crystal Palace",
    "blackburn rovers": "Blackburn Rovers",
    "burnley": "Burnley",
    "aston villa": "Aston Villa",
    "brentford": "Brentford",
    "derby county": "Derby County",
    "southampton": "Southampton",
    "middlesbrough": "Middlesbrough",
    "coventry city": "Coventry City",
    "oldham athletic": "Oldham Athletic",
    "portsmouth": "Portsmouth",
    "bolton wanderers": "Bolton Wanderers",
    "charlton athletic": "Charlton Athletic",
    "watford": "Watford",
    "wigan athletic": "Wigan Athletic",
    "blackpool": "Blackpool",
    "birmingham city": "Birmingham City",
    "reading": "Reading",
    "bradford city": "Bradford City",
    "west bromwich albion": "West Bromwich Albion",
    "notts county": "Notts County",
    "luton town": "Luton Town",
}


def normalize(name, aliases):
    name = re.sub(r"\s+", " ", str(name)).strip()
    key = canonical_key(name)
    if not key:
        raise ValueError("Empty historic club name")
    if key in aliases:
        return aliases[key]
    if key in NAMES:
        return NAMES[key]
    # Strip only an ending FC/AFC; some distinct historic clubs must stay distinct.
    return re.sub(r"\s+(?:FC|AFC)$", "", name, flags=re.I)


def source_info(year):
    sid = year_id(year)
    if year <= 2009:
        decade = f"{year//10*10}s"
        url = f"{CSV_REPO}/{decade}/{sid}/eng.1.csv"
        return url, "footballcsv/england", "https://github.com/footballcsv/england"
    return f"{JSON_REPO}/{sid}/en.1.json", "openfootball/football.json", "https://github.com/openfootball/football.json"


def fetch(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": "UsurperLeagueHistory/1.0"}), timeout=30) as response:
                return response.read().decode("utf-8-sig")
        except HTTPError as exc:
            if exc.code == 404:
                raise ValueError(f"Archive source missing at {url}") from exc
            if attempt == 2:
                raise
        except (URLError, TimeoutError):
            if attempt == 2:
                raise
        time.sleep(2*(attempt+1))


def parse(text, year, aliases):
    games = []
    if year <= 2009:
        for row in csv.DictReader(io.StringIO(text)):
            score = re.fullmatch(r"\s*(\d+)\s*[-–]\s*(\d+)\s*", row.get("FT", ""))
            if not score:
                raise ValueError(f"{year_id(year)}: unscored or malformed match {row!r}")
            games.append([normalize(row["Team 1"], aliases), normalize(row["Team 2"], aliases),
                          int(score[1]), int(score[2])])
    else:
        data=json.loads(text)
        for row in data.get("matches", []):
            score = row.get("score")
            result = score if isinstance(score, list) else (score.get("ft") if isinstance(score, dict) else None)
            if not isinstance(result, list) or len(result) != 2 or any(type(x) is not int for x in result):
                raise ValueError(f"{year_id(year)}: unscored fixture in JSON source")
            games.append([normalize(row["team1"], aliases),normalize(row["team2"], aliases),
                          result[0],result[1]])
    return games


def validate(games, year):
    clubs = {team for h,a,_,_ in games for team in (h,a)}
    expected_clubs = 22 if year <= 1994 else 20
    if len(clubs) != expected_clubs:
        raise ValueError(f"{year_id(year)}: {len(clubs)} teams, expected {expected_clubs}. Names: {sorted(clubs)}")
    if len(games) != expected_clubs*(expected_clubs-1):
        raise ValueError(f"{year_id(year)}: {len(games)} games, expected {expected_clubs*(expected_clubs-1)}")
    seen = set()
    for h,a,hg,ag in games:
        if h == a or hg < 0 or ag < 0 or (h,a) in seen:
            raise ValueError(f"{year_id(year)}: duplicate, invalid or self-fixture {(h,a,hg,ag)}")
        seen.add((h,a))
    # Pairwise coverage is more stringent than just matching the season game count.
    if seen != {(h,a) for h in clubs for a in clubs if h!=a}:
        raise ValueError(f"{year_id(year)}: not every club plays each other home and away")
    return clubs


def calculate(games, year, config, source_name, source_url):
    clubs = validate(games, year)
    excluded_list = [club["name"] for club in config["excludedClubs"]]
    present = [name for name in excluded_list if name in clubs]
    remaining = clubs - set(excluded_list)
    if len(remaining) < 2:
        raise ValueError("Too few clubs remaining")
    # The Big Six rule applies even in a season when a club was not in the top division.
    def blank(name):
        return dict(name=name,P=0,W=0,D=0,L=0,GF=0,GA=0,GD=0,Pts=0)
    full = {n:blank(n) for n in clubs}
    alt = {n:blank(n) for n in remaining}
    def record(table,h,a,hg,ag):
        x,y = table[h],table[a]
        x["P"]+=1;y["P"]+=1
        x["GF"]+=hg;x["GA"]+=ag;y["GF"]+=ag;y["GA"]+=hg
        if hg>ag:
            x["W"]+=1;x["Pts"]+=3;y["L"]+=1
        elif hg<ag:
            y["W"]+=1;y["Pts"]+=3;x["L"]+=1
        else:
            x["D"]+=1;y["D"]+=1;x["Pts"]+=1;y["Pts"]+=1
    excluded_count = 0
    for h,a,hg,ag in games:
        record(full,h,a,hg,ag)
        if h in set(excluded_list) or a in set(excluded_list):
            excluded_count += 1
        else:
            record(alt,h,a,hg,ag)
    def ordered(table):
        rows=list(table.values())
        for row in rows:
            row["GD"]=row["GF"]-row["GA"]
        rows.sort(key=lambda x:(-x["Pts"],-x["GD"],-x["GF"],x["name"]))
        for i,row in enumerate(rows,1):
            row["position"]=i
        return rows
    full_rows=ordered(full)
    alternative=ordered(alt)
    positions={x["name"]:x["position"] for x in full_rows}
    for row in alternative:
        row["originalPosition"]=positions[row["name"]]
        row["positionChange"]=positions[row["name"]]-row["position"]
    return {
        "mode":"historical","competition":"The Usurper League — England",
        "competitionCode":"PL","season":f"{year}/{(year+1)%100:02d}","seasonId":year_id(year),
        "pointsPerWin":3,"generatedAt":dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "exclusionLabel":config["exclusionLabel"],
        "excluded":excluded_list,"excludedInSeason":present,
        "completedMatches":len(games),"excludedMatches":excluded_count,
        "includedMatches":len(games)-excluded_count,
        "officialTableApproximation":full_rows,"alternativeTable":alternative,
        "source":source_name,"sourceUrl":source_url,
        "methodology":"Every finished fixture involving an excluded club is removed in full. "
          "Historical top-flight membership respected; three points per win. "
          "Order uses points, goal difference and goals scored. Official deductions "
          "and later tiebreakers may not be recreated. These are independent calculations."
    }


def dump(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    text=json.dumps(value,ensure_ascii=False,separators=(",",":"))+"\n"
    if not path.exists() or path.read_text(encoding="utf8") != text:
        path.write_text(text,encoding="utf8")


def one(year,aliases,refresh):
    path=MATCH_DIR/(year_id(year)+".json")
    source_url,source,repo_url=source_info(year)
    if not refresh and path.exists():
        saved=json.loads(path.read_text(encoding="utf8"))
        if saved.get("sourceUrl") == repo_url and saved.get("seasonId")==year_id(year):
            games=saved["matches"]
            validate(games,year)
            return year,games,source,repo_url
    raw=fetch(source_url)
    games=parse(raw,year,aliases)
    validate(games,year)
    return year,games,source,repo_url


def main():
    cfg,aliases=load_rules()
    refresh=os.getenv("REFRESH_ARCHIVE","")=="1"
    MATCH_DIR.mkdir(parents=True,exist_ok=True)
    SEASON_DIR.mkdir(parents=True,exist_ok=True)
    years=list(range(FIRST,LAST+1))
    successes={}
    errors={}
    with ThreadPoolExecutor(max_workers=6) as pool:
        future_map={pool.submit(one,year,aliases,refresh):year for year in years}
        for future in as_completed(future_map):
            year=future_map[future]
            try:
                yr,games,source,source_url=future.result()
                data=calculate(games,yr,cfg,source,source_url)
                successes[yr]=(games,source,source_url,data)
                print(f"OK {year_id(yr)}: {len(games)} games, "
                      f"{len(data['alternativeTable'])} clubs; champion {data['alternativeTable'][0]['name']}",flush=True)
            except Exception as exc:
                errors[year]=str(exc)
                print(f"SKIP {year_id(year)}: {exc}",file=sys.stderr,flush=True)
    if len(successes) < 24:
        raise ValueError(f"Only {len(successes)} complete archive seasons; refusing incomplete publication")
    for year, (games,source,source_url,data) in sorted(successes.items()):
        sid=year_id(year)
        dump(MATCH_DIR/(sid+".json"),{
            "seasonId":sid,"source":source,"sourceUrl":source_url,
            "license":"CC0-1.0","matches":games})
        # Generated tables are intentionally independent of source fixtures.
        dump(SEASON_DIR/(sid+".json"),data)
    keep={year_id(yr) for yr in successes}
    for folder in (MATCH_DIR,SEASON_DIR):
        for path in folder.glob("????-??.json"):
            if path.stem not in keep:
                path.unlink()
    index = {"title":"The Usurper League — England historical standings",
             "excluded": [x["name"] for x in cfg["excludedClubs"]],
             "exclusionLabel":cfg["exclusionLabel"],
             "pointsPerWin":3,
             "seasons":[]}
    for year in sorted(successes,reverse=True):
        data=successes[year][3]
        index["seasons"].append({
            "id":data["seasonId"],"label":data["season"],
            "champion":data["alternativeTable"][0]["name"],
            "points":data["alternativeTable"][0]["Pts"],
            "clubs":len(data["alternativeTable"]),
            "matches":data["includedMatches"],
            "excludedInSeason":data["excludedInSeason"]})
    dump(OUT/"index.json",index)
    if errors:
        print("Unavailable source seasons omitted rather than fabricated:",flush=True)
        for year,err in sorted(errors.items()):
            print(f"  {year_id(year)}: {err}",flush=True)
    print(f"Built {len(successes)} historical seasons, with original CC0 fixtures stored for future rule changes.")


if __name__=="__main__":
    main()

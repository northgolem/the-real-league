#!/usr/bin/env python3
"""Produce current Premier League alternative standings from verified match results.

Every game involving any of the six clubs is removed entirely.
No results, points or club identities may be invented for publication.
"""
import datetime as dt
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen

try:
    from .update import compute  # Imported by unit tests
except ImportError:
    from update import compute   # Executed as a standalone script

SEASON = int(os.getenv("SEASON", "2026"))
OUT = Path(__file__).resolve().parents[1] / "public/data/premier-league.json"
MATCH_OUT = OUT.with_name("premier-league-matches.json")
CONFIG_PATH = Path(__file__).resolve().parents[1] / "public/config/england.json"


def load_config():
    """One editable list drives both the live and historical English competitions."""
    config = json.loads(CONFIG_PATH.read_text(encoding="utf8"))
    clubs = config["excludedClubs"]
    ids = [club["id"] for club in clubs]
    names = [club["name"] for club in clubs]
    if not ids or len(ids) != len(set(ids)) or len(names) != len(set(names)):
        raise ValueError("Excluded-club configuration must contain unique clubs")
    return config

# Retained for backwards compatibility with the published regression tests.


# football-data.org's stable team IDs — verify presence of all six every run.
BIG_SIX = {club["id"]:club["name"] for club in load_config()["excludedClubs"]}
# Public-facing names, never crests, registered team marks or third-party images.
DISPLAY_NAMES = {
    57: "Arsenal", 61: "Chelsea", 64: "Liverpool",
    65: "Manchester City", 66: "Manchester United", 73: "Tottenham Hotspur",
    58: "Aston Villa", 62: "Everton", 63: "Fulham", 67: "Newcastle United",
    1044: "AFC Bournemouth", 397: "Brighton & Hove Albion",
    354: "Crystal Palace", 402: "Brentford", 76: "Wolverhampton Wanderers",
    71: "Sunderland", 338: "Leicester City",
    341: "Leeds United", 351: "Nottingham Forest", 563: "West Ham United",
}

def calculate(matches, season=SEASON, generated_at=None):
    config = load_config()
    excluded = config["excludedClubs"]
    ids = {club["id"] for club in excluded}
    names = [club["name"] for club in excluded]
    display_names = {**DISPLAY_NAMES, **{club["id"]: club["name"] for club in excluded}}
    methodology = (
        "An independent alternative Premier League, not the official standings. "
        "Every fixture involving " + ", ".join(names) + " is removed in full. "
        "Rankings use points, goal difference and goals scored. "
        "Official further tiebreaks, disciplinary rulings and deductions may differ."
    )
    result = compute(
        matches, season=season, generated_at=generated_at,
        excluded_ids=ids,
        excluded_names=names,
        display_names=display_names,
        competition="The Usurper League — England",
        methodology=methodology
    )
    if len(result["officialTableApproximation"]) != 20:
        raise ValueError("Expected exactly 20 Premier League clubs in API match feed")
    if len(result["alternativeTable"]) != 20-len(ids):
        raise ValueError("Wrong number of clubs after English exclusions")
    if result["completedMatches"] != result["includedMatches"] + result["excludedMatches"]:
        raise ValueError("Finished-match accounting inconsistent")
    result["competitionCode"] = "PL"
    result["exclusionGroup"] = config["exclusionLabel"]
    return result

def completed_fixtures(matches, calculated):
    """Export only real finished fixtures and independently verify tables."""
    known = {r["id"]: r["name"] for r in calculated["officialTableApproximation"]}
    fixtures, seen = [], set()
    for m in matches:
        if m.get("status") != "FINISHED":
            continue
        h = (m.get("homeTeam") or {}).get("id")
        a = (m.get("awayTeam") or {}).get("id")
        score = (m.get("score") or {}).get("fullTime") or {}
        hg, ag = score.get("home"), score.get("away")
        if h not in known or a not in known or type(hg) is not int or type(ag) is not int:
            continue
        if h == a or hg < 0 or ag < 0 or (h, a) in seen:
            raise ValueError("Duplicate or invalid finished fixture in PL source")
        seen.add((h, a))
        fixtures.append([h, a, hg, ag])
    if len(fixtures) != calculated["completedMatches"]:
        raise ValueError("Match export disagrees with verified Premier League totals")
    converted = [
        {"homeTeam": {"id": h, "shortName": known[h]}, "awayTeam": {"id": a, "shortName": known[a]}, "status": "FINISHED",
         "score": {"fullTime": {"home": hg, "away": ag}}}
        for h,a,hg,ag in fixtures
    ]
    check = calculate(converted)
    for key in ("alternativeTable","officialTableApproximation","completedMatches",
                "excludedMatches","includedMatches"):
        if check[key] != calculated[key]:
            raise ValueError("Fixture validation disagrees on " + key)
    return {"competitionCode": "PL", "season": calculated["season"],
            "source": "football-data.org", "completedMatches": len(fixtures),
            "clubs": [{"id": k, "name": v} for k,v in sorted(known.items())],
            "matches": fixtures}


def write_if_changed(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if path.exists() and path.read_text(encoding="utf8") == payload:
        return False
    temp = path.with_suffix(".json.tmp")
    temp.write_text(payload, encoding="utf8")
    temp.replace(path)
    return True


def main():
    token = os.environ.get("FOOTBALL_DATA_TOKEN", "").strip()
    if not token:
        raise RuntimeError("Missing FOOTBALL_DATA_TOKEN GitHub Actions secret")
    request = Request(
        f"https://api.football-data.org/v4/competitions/PL/matches?season={SEASON}",
        headers={"X-Auth-Token": token, "User-Agent": "UsurperLeague/1.0"}
    )
    with urlopen(request, timeout=35) as response:
        if response.status != 200:
            raise RuntimeError(f"Premier League API HTTP {response.status}")
        payload = json.load(response)
    if payload.get("competition", {}).get("code") not in (None, "PL"):
        raise ValueError("Wrong competition returned by results provider")
    if not isinstance(payload.get("matches"), list):
        raise ValueError("Missing match list from Premier League provider")
    result = calculate(payload["matches"])
    if result["completedMatches"] == 0:
        raise ValueError("No completed Premier League matches, refusing to publish")
    fixtures = completed_fixtures(payload["matches"], result)
    fixture_updated = write_if_changed(MATCH_OUT, fixtures)
    old = json.loads(OUT.read_text(encoding="utf8")) if OUT.exists() else None
    keys = ("completedMatches","latestResultAt","alternativeTable","officialTableApproximation","excluded","excludedIds","exclusionGroup")
    if old is not None and all(old.get(k) == result.get(k) for k in keys):
        print("Premier League unchanged" + ("; match export updated" if fixture_updated else ""))
        return
    write_if_changed(OUT, result)
    print(f"Premier League: {result['includedMatches']} games retained, "
          f"{result['excludedMatches']} excluded; {len(fixtures['matches'])} real results stored.")


if __name__ == "__main__":
    main()

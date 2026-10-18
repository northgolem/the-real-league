#!/usr/bin/env python3
"""Generate alternative La Liga standings from football-data.org results."""
import datetime as dt
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen

OUT = Path(__file__).resolve().parents[1] / "public/data/standings.json"
SEASON = int(os.getenv("SEASON", "2026"))
EXCLUDED_IDS = {81, 86}  # FC Barcelona and Real Madrid
# Editorial display names, keyed by stable football-data.org club IDs.
# The feed's shortName is useful for score tickers, but not every table label.
DISPLAY_NAMES = {
    78: "Atlético Madrid",
    77: "Athletic Club",
    560: "Deportivo La Coruña",
    558: "Celta Vigo",
    5335: "Racing Santander",
    81: "FC Barcelona",
}

def compute(matches, season=SEASON, generated_at=None, *, excluded_ids=None,
            display_names=None, competition="La Liga de los Mortales",
            excluded_names=None, methodology=None):
    """Recalculate a league after removing every fixture involving chosen clubs.

    All six/both excluded clubs must be in the feed. No standings are invented.
    With no options, preserve Spain's existing behavior and published format.
    """
    excluded_ids = set(EXCLUDED_IDS if excluded_ids is None else excluded_ids)
    display_names = DISPLAY_NAMES if display_names is None else display_names
    if not excluded_ids:
        raise ValueError("At least one excluded club is required")
    clubs = {}
    for m in matches:
        for side in ("homeTeam", "awayTeam"):
            t = m.get(side) or {}
            if t.get("id") is not None:
                clubs[t["id"]] = {"id": t["id"], "name": display_names.get(t["id"], t.get("shortName") or t.get("name") or str(t["id"]))}
    if not excluded_ids.issubset(clubs):
        raise ValueError("Missing excluded clubs in feed: " + repr(sorted(excluded_ids - clubs.keys())))
    if len(excluded_ids) >= len(clubs):
        raise ValueError("Not enough clubs remain after exclusions")

    def blank(t):
        return dict(id=t["id"], name=t["name"], P=0, W=0, D=0, L=0, GF=0, GA=0, GD=0, Pts=0)

    full = {k: blank(v) for k, v in clubs.items()}
    alternative = {k: blank(v) for k, v in clubs.items() if k not in excluded_ids}
    completed = removed = included = 0
    latest = None

    for m in matches:
        if m.get("status") != "FINISHED":
            continue
        h = (m.get("homeTeam") or {}).get("id")
        a = (m.get("awayTeam") or {}).get("id")
        scores = (m.get("score") or {}).get("fullTime") or {}
        hg, ag = scores.get("home"), scores.get("away")
        if (h not in full or a not in full or type(hg) is not int or type(ag) is not int):
            continue
        completed += 1
        date = str(m.get("utcDate") or "")
        if date and (latest is None or date > latest):
            latest = date

        def record(table):
            x, y = table[h], table[a]
            x["P"] += 1; y["P"] += 1
            x["GF"] += hg; x["GA"] += ag
            y["GF"] += ag; y["GA"] += hg
            if hg > ag:
                x["W"] += 1; x["Pts"] += 3; y["L"] += 1
            elif ag > hg:
                y["W"] += 1; y["Pts"] += 3; x["L"] += 1
            else:
                x["D"] += 1; y["D"] += 1; x["Pts"] += 1; y["Pts"] += 1

        record(full)
        if h in excluded_ids or a in excluded_ids:
            removed += 1
        else:
            record(alternative)
            included += 1

    def ranked(table):
        rows = list(table.values())
        for r in rows:
            r["GD"] = r["GF"] - r["GA"]
        rows.sort(key=lambda r: (-r["Pts"], -r["GD"], -r["GF"], r["name"]))
        for pos, r in enumerate(rows, 1):
            r["position"] = pos
        return rows

    full_rows = ranked(full)
    alt_rows = ranked(alternative)
    full_positions = {r["id"]: r["position"] for r in full_rows}
    for r in alt_rows:
        r["originalPosition"] = full_positions[r["id"]]
        r["positionChange"] = r["originalPosition"] - r["position"]
    return {
        "mode": "live",
        "competition": competition,
        "season": f"{season}/{str(season + 1)[2:]}",
        "generatedAt": generated_at or dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "latestResultAt": latest,
        "excluded": excluded_names if excluded_names is not None else ["Real Madrid", "FC Barcelona"],
        "excludedIds": sorted(excluded_ids),
        "completedMatches": completed,
        "excludedMatches": removed,
        "includedMatches": included,
        "officialTableApproximation": full_rows,
        "alternativeTable": alt_rows,
        "methodology": methodology or "All matches involving Real Madrid or Barcelona excluded. Points, goal difference and goals scored used for provisional order; La Liga head-to-head rules not modelled.",
        "source": "football-data.org"
    }

def main():
    token = os.environ.get("FOOTBALL_DATA_TOKEN", "").strip()
    if not token:
        raise RuntimeError("Missing FOOTBALL_DATA_TOKEN GitHub Actions secret")
    req = Request(
        f"https://api.football-data.org/v4/competitions/PD/matches?season={SEASON}",
        headers={"X-Auth-Token": token, "User-Agent": "TheRealLeague/1.0"}
    )
    with urlopen(req, timeout=25) as res:
        if res.status != 200:
            raise RuntimeError(f"API HTTP {res.status}")
        data = json.load(res)
    result = compute(data.get("matches", []))
    if result["completedMatches"] == 0:
        raise ValueError("No finished matches; refusing to replace data")
    if OUT.exists():
        previous = json.loads(OUT.read_text(encoding="utf-8"))
        keys = ["completedMatches", "latestResultAt", "alternativeTable", "officialTableApproximation"]
        if previous.get("mode") == "live" and all(previous.get(k) == result[k] for k in keys):
            print("Standings unchanged")
            return
    OUT.parent.mkdir(parents=True, exist_ok=True)
    temporary = OUT.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(OUT)
    print(f"Updated standings: {result['includedMatches']} kept, {result['excludedMatches']} removed")

if __name__ == "__main__":
    main()

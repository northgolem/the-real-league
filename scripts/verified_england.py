"""Published Premier League final tables, strictly reconciled with real match archives.

These are NOT recalculations of the Usurper competition. Final published
standings may include sanctioned deductions and official ranking decisions.
Never change scores or apply penalties to the alternative competition.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / "public" / "official" / "england" / "published-finals.json"
# Final sanctions in Premier League seasons, confirmed against published tables.
DEDUCTIONS = {
    "1996-97": {"Middlesbrough": 3},
    "2009-10": {"Portsmouth": 9},
    "2023-24": {"Everton": 8, "Nottingham Forest": 4},
}
STAT_FIELDS = ("P", "W", "D", "L", "GF", "GA", "GD")


def published_table(season_id, calculated, database=None):
    """Return rows in published order, or raise before any inaccurate table appears."""
    if database is None:
        database = json.loads(FILE.read_text(encoding="utf8"))
    if database.get("schemaVersion") != 1:
        raise ValueError("Unsupported historical ranking source")
    item = database["seasons"].get(season_id)
    if not item or not item.get("sourceUrl") or not item.get("source"):
        raise ValueError(f"{season_id}: published reference missing")
    rows = item.get("table", [])
    if len(rows) != len(calculated):
        raise ValueError(f"{season_id}: incomplete published reference")
    by_stats = {}
    for row in calculated:
        signature = tuple(row[k] for k in STAT_FIELDS)
        if signature in by_stats:
            raise ValueError(f"{season_id}: non-unique fixture statistics")
        by_stats[signature] = row
    expected_deductions = DEDUCTIONS.get(season_id, {})
    observed = set()
    verified = []
    for index, ref in enumerate(rows, 1):
        if ref.get("position") != index:
            raise ValueError(f"{season_id}: invalid source position")
        signature = tuple(ref[k] for k in STAT_FIELDS)
        fixture = by_stats.get(signature)
        if not fixture or fixture["name"] in observed:
            raise ValueError(f"{season_id}: published row not found in fixture archive")
        name = fixture["name"]
        if ref["Pts"] != fixture["Pts"] - expected_deductions.get(name, 0):
            raise ValueError(f"{season_id}: incorrect published points for {name}")
        if ref["P"] != ref["W"] + ref["D"] + ref["L"] or ref["GD"] != ref["GF"] - ref["GA"]:
            raise ValueError(f"{season_id}: invalid published match totals")
        verified.append({**fixture, "Pts": ref["Pts"], "position": index})
        observed.add(name)
    if len(observed) != len(calculated):
        raise ValueError(f"{season_id}: some clubs omitted")
    if verified != sorted(verified, key=lambda x: (-x["Pts"], -x["GD"], -x["GF"], x["position"])):
        raise ValueError(f"{season_id}: published order does not follow Premier League points and goal criteria")
    return verified, item["source"], item["sourceUrl"]

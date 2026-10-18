#!/usr/bin/env python3
"""Check published English historical standings against untouched source fixtures."""
import json
from pathlib import Path
from scripts.build_england_history import validate, calculate, year_id, source_info, load_rules

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"public/england/history"
def check():
    cfg,_=load_rules()
    index=json.loads((DATA/"index.json").read_text(encoding="utf8"))
    rows=index["seasons"]
    assert len(rows)>=24, "Archive too small to publish"
    assert len({x["id"] for x in rows})==len(rows)
    expected=[x["name"] for x in cfg["excludedClubs"]]
    assert index["excluded"]==expected
    for row in rows:
        sid=row["id"]
        year=int(sid[:4])
        fixtures=json.loads((DATA/"matches"/(sid+".json")).read_text(encoding="utf8"))
        archive=json.loads((DATA/"seasons"/(sid+".json")).read_text(encoding="utf8"))
        games=fixtures["matches"]
        validate(games,year)
        assert fixtures["seasonId"]==sid
        assert fixtures["license"]=="CC0-1.0"
        assert fixtures["sourceUrl"]==source_info(year)[2]
        assert archive["excluded"]==expected
        calculated=calculate(games,year,cfg,archive["source"],archive["sourceUrl"])
        for key in ("alternativeTable","officialTableApproximation","includedMatches","excludedMatches","excludedInSeason"):
            assert calculated[key]==archive[key],f"{sid}: incorrect {key}"
        assert row["champion"]==archive["alternativeTable"][0]["name"]
        assert row["points"]==archive["alternativeTable"][0]["Pts"]
        assert row["clubs"]==len(archive["alternativeTable"])
        assert row["matches"]==archive["includedMatches"]
    print(f"Validated {len(rows)} independent historic EPL seasons from intact CC0 match results.")
if __name__=="__main__":
    check()

"""Fail-closed verification of complete La Liga historical published standings.

A historical season with no valid reference MUST NOT be presented as an
official or definitive full-league table. It may show an alternative season
calculation, which is explicitly described as ours.
"""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
REFERENCES=ROOT/"public/official/spain"

def verified_final_table(season):
    path=REFERENCES/(season["seasonId"]+".json")
    if not path.exists():return None
    try:
        ref=json.loads(path.read_text(encoding="utf8"))
        expected=season["officialTableApproximation"]
        rows=ref["table"]
        if (ref["seasonId"]!=season["seasonId"] or
            not ref["sourceUrl"].startswith("https://www.rsssf.org/tabless/") or
            len(rows)!=len(expected) or
            set(x["name"] for x in rows)!=set(x["name"] for x in expected)):
            raise ValueError("Incomplete or mismatched referenced standings")
        calculated={x["name"]:x for x in expected}
        for position,row in enumerate(rows,1):
            x=calculated[row["name"]]
            if row["position"]!=position:raise ValueError("Published ranking gaps")
            for field in ("P","W","D","L","GF","GA","GD"):
                if row[field]!=x[field]:
                    raise ValueError(f"Source discrepancy: {row['name']} {field}")
            if row["Pts"]>x["Pts"]:
                raise ValueError("Source adds unverified bonus points")
            if row["Pts"] != x["Pts"] and row["Pts"]<0:
                raise ValueError("Unreasonable source points")
        if len({x["name"] for x in rows})!=len(rows):
            raise ValueError("Duplicate clubs")
        return ref
    except (ValueError,TypeError,KeyError,IndexError) as error:
        raise ValueError(f"Historical full table verification failed for {season['seasonId']}: {error}") from error

#!/usr/bin/env python3
"""Import *verified* historical Spanish final classifications from RSSSF.

Never use the recalculated points/GD ordering as an official ranking. Independent
published sources are checked against all available source match statistics.
If ANY club cannot be matched and verified, the whole season is rejected.
Only historical ranking and recorded deductions, not match scores, are imported.
"""
import argparse
import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

BASE=Path(__file__).resolve().parents[1]
ORIGINAL=BASE/"public/history"
VERIFIED=BASE/"public/official/spain"
BASE_URL="https://www.rsssf.org/tabless/"
LINE=re.compile(r"^\s*(\d{1,2})\.\s*(\S.*?\S)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*-\s*(\d+)\s+(\d+)\b",re.M)
FETCHED={}
def urls(year):
    decade=year//10
    if year < 1999:
        code=1928 if year<1939 else 1939+((year-1939)//10)*10
        end=1939 if code==1928 else code+10
        return [f"{BASE_URL}spanhist{str(code)[-2:]}{str(end)[-2:]}.html",
                f"{BASE_URL}span{str(year+1)[-2:]}.html"]
    return [f"{BASE_URL}span{str(year+1)[-2:]}.html",
            f"{BASE_URL}span{year+1}.html"]
def fetch(url):
    if url in FETCHED:return FETCHED[url]
    request=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; UsurperLeague/1.0; historical stats reference)"})
    try:
        with urllib.request.urlopen(request,timeout=14) as response:
            raw=response.read(850_000)
            # This archive mixes legacy encodings and UTF-8.
            encoding=response.headers.get_content_charset() or "iso-8859-1"
            try:page=raw.decode(encoding)
            except (LookupError,UnicodeDecodeError):page=raw.decode("iso-8859-1","replace")
            page=html.unescape(re.sub(r"<[^>]+>","",page))
            FETCHED[url]=page
            return page
    except (urllib.error.HTTPError,urllib.error.URLError,TimeoutError) as ex:
        print("  FETCH",url,str(ex)[:95],flush=True)
        FETCHED[url]=None
        return None

def candidates(text,season):
    labels=[f"Spain {season[:4]}/{season[5:]}",
            f"Spain {season[:4]}/{season[5:]}"]
    offsets=[m.start() for m in re.finditer(re.escape(labels[0]),text,re.I)]
    if not offsets:offsets=[0]
    for begin in offsets:
        position=text.find("Final Table:",begin,begin+4500)
        if position<0:continue
        # Match only consecutive standings (stop at explanatory notes);
        # don't accidentally pull teams from a different division.
        lines=text[position+len("Final Table:"):].splitlines()
        rows=[]
        active=False
        for line in lines[:70]:
            m=LINE.match(line)
            if m:
                active=True
                pos,name,p,w,d,l,gf,ga,pts=m.groups()
                rows.append({"position":int(pos),"referenceName":name.strip(),
                    "P":int(p),"W":int(w),"D":int(d),"L":int(l),
                    "GF":int(gf),"GA":int(ga),"GD":int(gf)-int(ga),
                    "Pts":int(pts)})
            elif active and line.strip().startswith(("Cross-Table","Segunda Divisi","Second Divisi","Promotion","Third")):
                break
        if rows:
            yield rows

def reconcile(official,computed):
    """Return matched real recorded rows, or refuse to publish any of them."""
    if len(official)!=len(computed):raise ValueError(f"number of teams {len(official)} vs {len(computed)}")
    by_stats=defaultdict(list)
    stat_names=("P","W","D","L","GF","GA")
    for team in computed:
        by_stats[tuple(team[k] for k in stat_names)].append(team)
    resolved=[]
    seen=set()
    for item in official:
        if item["position"]!=len(resolved)+1:
            raise ValueError("missing/duplicate source position")
        key=tuple(item[k] for k in stat_names)
        possible=[x for x in by_stats.get(key,[]) if x["name"] not in seen]
        if len(possible)==1:
            team=possible[0]
        elif len(possible)>1:
            # Identical match stats can happen; resolve only if the name is
            # a strong unambiguous match, otherwise fail closed.
            rank=sorted([(SequenceMatcher(None,x["name"].casefold(),item["referenceName"].casefold()).ratio(),x)
                         for x in possible],key=lambda p:-p[0])
            if rank[0][0]<0.75 or (len(rank)>1 and rank[0][0]-rank[1][0]<0.18):
                raise ValueError("ambiguous identical-stat teams: "+item["referenceName"])
            team=rank[0][1]
        else:
            raise ValueError("unmatched match statistics for "+item["referenceName"]+
                             ": "+str(key))
        seen.add(team["name"])
        resolved.append({**item,"name":team["name"]})
    if len(seen)!=len(computed):raise ValueError("missing club from source table")
    return resolved

def import_one(season,write=True):
    year=int(season[:4])
    data=json.loads((ORIGINAL/(season+".json")).read_text(encoding="utf8"))
    expected=data["officialTableApproximation"]
    for url in urls(year):
        text=fetch(url)
        if not text:continue
        for candidate in candidates(text,season):
            try:
                rows=reconcile(candidate,expected)
            except ValueError as e:
                if season in ('2023-24','1979-80'):
                    print('  REJECT',season,url,'rows',len(candidate),'reason',str(e)[:180],flush=True)
                continue
            record={"seasonId":season,"source":"RSSSF historical final table",
                    "sourceUrl":url,"verification":"All clubs' played, won, drawn, lost, goals for and goals against match our independently calculated full-season fixtures.",
                    "table":rows}
            if write:
                VERIFIED.mkdir(parents=True,exist_ok=True)
                file=VERIFIED/(season+".json")
                file.write_text(json.dumps(record,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf8")
            moved=sum(row["name"]!=expected[i]["name"] for i,row in enumerate(rows))
            deductions=[(x["name"],x["Pts"],next(t["Pts"] for t in expected if t["name"]==x["name"]))
                        for x in rows if x["Pts"]!=next(t["Pts"] for t in expected if t["name"]==x["name"])]
            return True,url,moved,deductions
    return False,"no verified source matching every team",0,[]

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--seasons",nargs="*")
    parser.add_argument("--dry-run",action="store_true")
    args=parser.parse_args()
    seasons=args.seasons or [x.stem for x in sorted(ORIGINAL.glob("????-??.json"))]
    ok=0;unverified=[]
    for season in seasons:
        success,reason,changed,deductions=import_one(season,not args.dry_run)
        if success:
            ok+=1
            print("VERIFIED",season,"standings shifted",changed,"deductions",deductions,"reference",reason,flush=True)
        else:
            unverified.append(season)
            print("UNVERIFIED",season,reason,flush=True)
    print("SUMMARY",ok,"/",len(seasons),"verified; unresolved:",",".join(unverified),flush=True)
    if args.seasons and ok!=len(args.seasons):sys.exit(2)

if __name__=="__main__":main()

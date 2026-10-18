#!/usr/bin/env python3
"""Validate that indexed pages represent real archive data (not SEO doorway text)."""
import json
from pathlib import Path
import re
from urllib.parse import urlparse
from xml.etree import ElementTree as ET

root = Path(__file__).resolve().parents[1] / "public"
archive = json.loads((root / "history/index.json").read_text(encoding="utf-8"))
ids = [x["id"] for x in archive["seasons"]]
pages = list((root / "la-liga").glob("????-??/index.html"))
assert len(ids) >= 90, "Unexpectedly few validated historical seasons"
assert len(pages) == len(ids), "Missing or extraneous SEO season pages"
sitemap = ET.parse(root / "sitemap.xml")
locs = [x.text for x in sitemap.findall(".//{*}loc")]
expected = ["https://usurperleague.com/", "https://usurperleague.com/premier-league/", "https://usurperleague.com/la-liga/"] + [
    f"https://usurperleague.com/la-liga/{x}/" for x in ids
]
assert locs == expected, "Sitemap must list exactly the real season pages"
for id in ids:
    data = json.loads((root / "history" / (id + ".json")).read_text(encoding="utf-8"))
    html = (root / "la-liga" / id / "index.html").read_text(encoding="utf-8")
    assert f'https://usurperleague.com/la-liga/{id}/' in html
    assert data["alternativeTable"][0]["name"] in html
    assert str(data["alternativeTable"][0]["Pts"]) in html
    assert 'official LaLiga standings' in html
    assert data["sourceUrl"] in html
    assert 'name="description"' in html
    assert not re.search(r'<img[^>]+(?:src="https?://|src="/club)',html), "Unlicensed images in generated page"
assert "2</strong>" in (root / "la-liga/1994-95/index.html").read_text(encoding="utf-8"), "Historic two-point scoring missing"
assert "3</strong>" in (root / "la-liga/1995-96/index.html").read_text(encoding="utf-8"), "Three-point scoring missing"
index = (root / "la-liga/index.html").read_text(encoding="utf-8")
for entry in archive["seasons"]:
    assert f'/la-liga/{entry["id"]}/' in index
home = (root / "index.html").read_text(encoding="utf-8")
assert 'rel="canonical" href="https://usurperleague.com/"' in home
assert 'id="archive-all-link"' in home
robots = (root / "robots.txt").read_text(encoding="utf-8")
assert "Sitemap: https://usurperleague.com/sitemap.xml" in robots
assert "the-real-league.pages.dev" not in robots
print(f"Verified {len(ids)} historical pages, 1 honours board, {len(locs)} sitemap URLs and sources.")

pl = (root / "premier-league/index.html").read_text(encoding="utf-8")
assert "Premier League Without the Big Six" in pl
assert "href=\"https://usurperleague.com/premier-league/\"" in pl

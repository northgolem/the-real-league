import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class TagInspector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.scripts = []
        self.links = []
    def handle_starttag(self, tag, attrs):
        props = dict(attrs)
        if "id" in props:
            self.ids.add(props["id"])
        if tag == "script":
            self.scripts.append(props.get("src"))
        if tag == "link":
            self.links.append(props)

class WebsiteTests(unittest.TestCase):
    def test_site_assets_and_translation_controls(self):
        html = (ROOT / "public/spain/index.html").read_text(encoding="utf8")
        parser = TagInspector()
        parser.feed(html)
        for required in ("rows", "alternative", "original", "race-value", "slayers-value",
                         "rebound-value", "insights-heading", "headline", "share", "copy", "status"):
            self.assertIn(required, parser.ids)
        self.assertIn("/enhance.js", parser.scripts)
        self.assertIn("data-lang=\"es\"", html)
        self.assertIn("renderEnhancements(data,view)", html)
        self.assertTrue((ROOT / "public/enhance.js").is_file())
        self.assertTrue(any(l.get("rel") == "canonical" for l in parser.links))
        self.assertTrue((ROOT / "public/design.css").is_file())
        self.assertTrue((ROOT / "public/favicon.svg").is_file())
        self.assertTrue((ROOT / "public/brand-lockup.svg").is_file())
        self.assertIn('href="/design.css"', html)
        self.assertIn('src="/usurper-logo.png"', html)
        self.assertIn("brand-lockup.svg", html)  # Image fallback until owner uploads the final illustration
        self.assertIn('id="archive"', html)
        self.assertIn('href="/la-liga/" id="nav-archive"', html)
        self.assertIn('href="/la-liga/1995-96/"', html)
        self.assertIn('class="history-decade-grid"', html)
        self.assertNotIn('src="/history.js"', html)
        self.assertNotIn('id="season-tabs"', html)
        self.assertIn('id="how-it-works"', html)
        self.assertNotIn('src="https://', html)  # No externally hosted photos or club badge images
        self.assertLess(html.index('id="league-table"'), html.index('id="archive"'))
        self.assertIn('id="site-title"', html)
        self.assertIn('href="https://usurperleague.com/spain/"', html)
        self.assertIn("fetch('/data/standings.json'", html)

    def test_brand_landing_has_both_editions(self):
        html = (ROOT / "public/index.html").read_text(encoding="utf8")
        parser = TagInspector()
        parser.feed(html)
        self.assertIn("spain-card", parser.ids)
        self.assertIn("england-card", parser.ids)
        self.assertIn("/home.js", parser.scripts)
        self.assertIn('href="/home.css"', html)
        self.assertIn('href="https://usurperleague.com/"', html)
        self.assertIn('/spain/', html)
        self.assertIn('/england/', html)
        self.assertNotIn('src="https://', html)
        self.assertIn("legacy.get('season')", html)

if __name__ == "__main__":
    unittest.main()

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
        html = (ROOT / "public/index.html").read_text(encoding="utf8")
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

if __name__ == "__main__":
    unittest.main()

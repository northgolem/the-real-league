import json
import sys
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from season_story import season_facts

class HistoricalStoryTests(unittest.TestCase):
    @staticmethod
    def data(country,season):
        if country=="spain":
            path=ROOT/"public/history"/(season+".json")
        else:
            path=ROOT/"public/england/history/seasons"/(season+".json")
        return json.loads(path.read_text(encoding="utf8"))

    def test_spain_1995_96_does_not_invent_a_new_champion(self):
        s=season_facts(self.data("spain","1995-96"))
        self.assertTrue(s["same_champion"])
        self.assertEqual(s["winner"]["name"],"Atlético Madrid")
        self.assertEqual(s["winner_original_position"],1)
        self.assertEqual(s["margin"],5)
        self.assertEqual(s["removed"],82)
        self.assertEqual(s["kept"],380)

    def test_spain_1960_61_has_real_alternative_winner(self):
        s=season_facts(self.data("spain","1960-61"))
        self.assertFalse(s["same_champion"])
        self.assertEqual(s["full_leader"]["name"],"Real Madrid")
        self.assertEqual(s["winner"]["name"],"Atlético Madrid")
        self.assertEqual(s["winner_original_position"],2)
        self.assertEqual(s["margin"],5)

    def test_england_2011_12(self):
        s=season_facts(self.data("england","2011-12"))
        self.assertEqual(s["full_leader"]["name"],"Manchester City")
        self.assertEqual(s["winner"]["name"],"Newcastle United")
        self.assertEqual(s["margin"],7)
        self.assertFalse(s["same_champion"])

    def test_all_archives_reconcile(self):
        for country,root in [("spain",ROOT/"public/history"),
                             ("england",ROOT/"public/england/history/seasons")]:
            for path in root.glob("????-??.json"):
                with self.subTest(country=country,season=path.stem):
                    season=json.loads(path.read_text(encoding="utf8"))
                    facts=season_facts(season)
                    self.assertEqual(facts["winner"]["name"],season["alternativeTable"][0]["name"])
                    self.assertEqual(facts["kept"]+facts["removed"],season["completedMatches"])
                    self.assertGreaterEqual(facts["winner_excluded_points"],0)
                    if facts["biggest_gain"]:
                        gain,club,before,after=facts["biggest_gain"]
                        self.assertGreater(gain,0)
                        self.assertEqual(gain,before-after)
                        self.assertIn(club["name"],[x["name"] for x in season["alternativeTable"]])
                    self.assertGreaterEqual(facts["margin"],0)

    def test_rank_gain_excludes_free_places_from_deleted_clubs(self):
        # Madrid top and Barcelona second; Team C hasn't "climbed" just
        # because both clubs were deleted. Survivors' relative rank unchanged.
        base=lambda name,points:{"name":name,"Pts":points,"P":3}
        sample={"officialTableApproximation":[base("Madrid",9),base("Barcelona",7),
                   base("Team C",6),base("Team D",3),base("Team E",0)],
                "alternativeTable":[base("Team C",6),base("Team D",3),base("Team E",0)],
                "includedMatches":3,"excludedMatches":7,"completedMatches":10}
        story=season_facts(sample)
        self.assertFalse(story["rank_changed"])
        self.assertIsNone(story["biggest_gain"])
        self.assertEqual(story["winner_original_position"],3)


if __name__=="__main__":
    unittest.main()

import json
import unittest
from scripts.build_history import clean_name, parse_archive, standings

class HistoricalTests(unittest.TestCase):
    def test_archival_aliases(self):
        names = {
            "FC Barcelona (18)": "FC Barcelona",
            "Real Madrid CF (12)": "Real Madrid",
            "Athletic Club Bilbao (1)": "Athletic Club",
            "R. Racing C. (7)": "Racing Santander",
            "RCD Español (2)": "Espanyol",
            "RCD La Coruña (38)": "Deportivo La Coruña",
        }
        for raw, desired in names.items():
            self.assertEqual(clean_name(raw), desired)

    def test_csv_old_format(self):
        archive = ("Round,Date,Team 1,FT,HT,Team 2\n"
                   "?,(Sun) 10 Feb 1929 (5),R. Racing C. (1),0-2,?,FC Barcelona (1)\n"
                   "?,(Sun) 10 Feb 1929 (5),Real Madrid CF (1),5-0,?,CE Europa (1)\n")
        matches = parse_archive(archive, 1928)
        self.assertEqual(matches[0], ("Racing Santander","FC Barcelona",0,2))
        self.assertEqual(matches[1][:2], ("Real Madrid","CE Europa"))

    def test_scoring_pre_and_post_1995(self):
        teams = ["FC Barcelona","Real Madrid"] + ["Club "+str(i) for i in range(8)]
        matches = [(h,a,1,0) for h in teams for a in teams if h != a]
        old = standings(matches,1994,"1994-95","test","https://example.org")
        new = standings(matches,1995,"1995-96","test","https://example.org")
        self.assertEqual(old["completedMatches"],90)
        self.assertEqual(old["excludedMatches"],34)
        self.assertEqual(old["alternativeTable"][0]["Pts"],14)
        self.assertEqual(new["alternativeTable"][0]["Pts"],21)
        self.assertEqual(old["pointsPerWin"],2)
        self.assertEqual(new["pointsPerWin"],3)

    def test_reject_truncated_season(self):
        with self.assertRaisesRegex(ValueError,"matches"):
            standings([("FC Barcelona","Real Madrid",0,0)],1994,"1994-95","test","https://example.org")

if __name__ == "__main__":
    unittest.main()

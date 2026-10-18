import unittest
from scripts.build_england_history import (
    load_rules, normalize, validate, calculate, year_id, source_info
)


def complete(clubs):
    return [[h,a,1,0] for h in clubs for a in clubs if h!=a]


class EnglandHistoryTests(unittest.TestCase):
    def setUp(self):
        self.cfg,self.aliases=load_rules()

    def test_all_six_excluded_when_in_league(self):
        clubs=[x["name"] for x in self.cfg["excludedClubs"]]+[f"Club {i}" for i in range(14)]
        data=calculate(complete(clubs),2010,self.cfg,"sample","https://example.org")
        self.assertEqual(data["completedMatches"],380)
        self.assertEqual(data["includedMatches"],182)
        self.assertEqual(data["excludedMatches"],198)
        self.assertEqual(len(data["alternativeTable"]),14)
        self.assertEqual(sum(x["P"] for x in data["alternativeTable"]),364)
        self.assertEqual(data["excludedInSeason"],[x["name"] for x in self.cfg["excludedClubs"]])

    def test_absent_big_six_members_do_not_become_ghost_clubs(self):
        included=[x["name"] for x in self.cfg["excludedClubs"] if x["name"]!="Manchester City"]
        clubs=included+[f"Club {i}" for i in range(15)]
        data=calculate(complete(clubs),2001,self.cfg,"sample","https://example.org")
        self.assertEqual(len(data["alternativeTable"]),15)
        self.assertEqual(data["excludedMatches"],170)
        self.assertNotIn("Manchester City",data["excludedInSeason"])
        self.assertEqual(data["includedMatches"],210)

    def test_1992_22_club_league(self):
        included=[x["name"] for x in self.cfg["excludedClubs"]]
        clubs=included+[f"Club {i}" for i in range(16)]
        data=calculate(complete(clubs),1992,self.cfg,"sample","https://example.org")
        self.assertEqual(data["completedMatches"],462)
        self.assertEqual(len(data["alternativeTable"]),16)
        self.assertEqual(data["includedMatches"],240)
        self.assertEqual(data["pointsPerWin"],3)

    def test_reject_missing_and_duplicate_fixture(self):
        clubs=[x["name"] for x in self.cfg["excludedClubs"]]+[f"Club {i}" for i in range(14)]
        full=complete(clubs)
        with self.assertRaisesRegex(ValueError,"games"):
            validate(full[:-1],2010)
        bad=list(full)
        bad[0]=bad[1]
        with self.assertRaisesRegex(ValueError,"duplicate"):
            validate(bad,2010)

    def test_normalize_names_and_public_domain_source(self):
        self.assertEqual(normalize("Manchester City FC",self.aliases),"Manchester City")
        self.assertEqual(normalize("Tottenham Hotspur FC",self.aliases),"Tottenham Hotspur")
        self.assertEqual(normalize("Sunderland AFC",self.aliases),"Sunderland")
        self.assertEqual(normalize("Queens Park Rangers FC",self.aliases),"Queens Park Rangers")
        self.assertEqual(normalize("Wimbledon FC",self.aliases),"Wimbledon")
        self.assertIn("footballcsv/england",source_info(1992)[0])
        self.assertIn("openfootball/football.json",source_info(2025)[0])

if __name__=="__main__":
    unittest.main()

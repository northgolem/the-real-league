import unittest
from scripts.build_england_history import (
    load_rules, normalize, validate, calculate, source_info
)


def complete(clubs):
    return [[h,a,1,0] for h in clubs for a in clubs if h!=a]


class EnglandHistoryTests(unittest.TestCase):
    def setUp(self):
        self.cfg,self.aliases=load_rules()
        self.excluded=[x["name"] for x in self.cfg["excludedClubs"]]
        self.n=len(self.excluded)

    def test_configured_clubs_all_excluded_when_in_league(self):
        remaining=20-self.n
        clubs=self.excluded+[f"Club {i}" for i in range(remaining)]
        data=calculate(complete(clubs),2010,self.cfg,"sample","https://example.org")
        self.assertEqual(data["completedMatches"],380)
        self.assertEqual(data["includedMatches"],remaining*(remaining-1))
        self.assertEqual(data["excludedMatches"],380-remaining*(remaining-1))
        self.assertEqual(len(data["alternativeTable"]),remaining)
        self.assertEqual(sum(x["P"] for x in data["alternativeTable"]),2*data["includedMatches"])
        self.assertEqual(data["excludedInSeason"],self.excluded)

    def test_absent_excluded_club_does_not_become_a_ghost_club(self):
        missing=self.excluded[0]
        included=[x for x in self.excluded if x!=missing]
        remaining=20-len(included)
        clubs=included+[f"Club {i}" for i in range(remaining)]
        data=calculate(complete(clubs),2001,self.cfg,"sample","https://example.org")
        self.assertEqual(len(data["alternativeTable"]),remaining)
        self.assertEqual(data["excludedMatches"],380-remaining*(remaining-1))
        self.assertNotIn(missing,data["excludedInSeason"])
        self.assertEqual(data["includedMatches"],remaining*(remaining-1))

    def test_1992_22_club_league(self):
        remaining=22-self.n
        clubs=self.excluded+[f"Club {i}" for i in range(remaining)]
        data=calculate(complete(clubs),1992,self.cfg,"sample","https://example.org")
        self.assertEqual(data["completedMatches"],462)
        self.assertEqual(len(data["alternativeTable"]),remaining)
        self.assertEqual(data["includedMatches"],remaining*(remaining-1))
        self.assertEqual(data["pointsPerWin"],3)

    def test_reject_missing_and_duplicate_fixture(self):
        clubs=self.excluded+[f"Club {i}" for i in range(20-self.n)]
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

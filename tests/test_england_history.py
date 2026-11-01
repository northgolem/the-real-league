import unittest
import json
from pathlib import Path
from scripts.verified_england import published_table
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


    def test_published_final_rankings_across_every_historical_season(self):
        base=Path(__file__).resolve().parents[1]/"public"/"england"/"history"/"seasons"
        for year in range(1992,2026):
            season=f"{year}-{(year+1)%100:02d}"
            archive=json.loads((base/(season+".json")).read_text(encoding="utf8"))
            with self.subTest(season=season):
                real, source, url=published_table(season,archive["officialTableApproximation"])
                self.assertEqual(len(real),len(archive["officialTableApproximation"]))
                self.assertEqual([r["position"] for r in real],list(range(1,len(real)+1)))
                self.assertTrue(source and url.startswith("https://"))

    def test_real_deductions_but_never_alternative_deductions(self):
        base=Path(__file__).resolve().parents[1]/"public"/"england"/"history"/"seasons"
        cases=[
            ("1996-97","Middlesbrough",19,39,3),
            ("2009-10","Portsmouth",20,19,9),
            ("2023-24","Everton",15,40,8),
            ("2023-24","Nottingham Forest",17,32,4),
        ]
        for season,name,pos,points,deduction in cases:
            archive=json.loads((base/(season+".json")).read_text(encoding="utf8"))
            published,_,_=published_table(season,archive["officialTableApproximation"])
            actual=next(r for r in published if r["name"]==name)
            earned=next(r for r in archive["officialTableApproximation"] if r["name"]==name)
            self.assertEqual((actual["position"],actual["Pts"]),(pos,points))
            self.assertEqual(earned["Pts"]-actual["Pts"],deduction)
            # The fantasy league has separate scoring derived only from actual matches.
            remaining=next(r for r in archive["alternativeTable"] if r["name"]==name)
            self.assertEqual(remaining["Pts"],3*remaining["W"]+remaining["D"])

    def test_reject_changed_published_points(self):
        base=Path(__file__).resolve().parents[1]/"public"/"england"/"history"/"seasons"
        archive=json.loads((base/"2023-24.json").read_text(encoding="utf8"))
        reference=json.loads(Path(__file__).resolve().parents[1].joinpath(
            "public/official/england/published-finals.json").read_text(encoding="utf8"))
        record=next(r for r in reference["seasons"]["2023-24"]["table"] if r["name"]=="Everton")
        record["Pts"]+=1
        with self.assertRaisesRegex(ValueError,"incorrect published points"):
            published_table("2023-24",archive["officialTableApproximation"],reference)


if __name__=="__main__":
    unittest.main()

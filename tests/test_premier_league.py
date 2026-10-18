import json
import unittest
from pathlib import Path

from scripts.update import compute
from scripts.update_premier_league import BIG_SIX, calculate

ROOT = Path(__file__).resolve().parents[1]


def fixture(home, away, hg=1, ag=0, *, status="FINISHED"):
    return {
        "homeTeam": {"id": home, "name": f"Test Club {home}"},
        "awayTeam": {"id": away, "name": f"Test Club {away}"},
        "status": status,
        "utcDate": "2026-10-01T14:00:00Z",
        "score": {"fullTime": {"home": hg, "away": ag}},
    }


def synthetic_season():
    # Deliberately synthetic inputs ONLY in tests. Never commit fabricated results.
    clubs = list(BIG_SIX) + list(range(7000, 7000 + (20-len(BIG_SIX))))
    return [fixture(h, a) for h in clubs for a in clubs if h != a]


class PremierLeagueTests(unittest.TestCase):
    def test_full_season_removes_all_big_six_fixtures(self):
        result = calculate(synthetic_season(), generated_at="2026-10-18T09:00:00Z")
        self.assertEqual(len(result["officialTableApproximation"]), 20)
        self.assertEqual(len(result["alternativeTable"]), 20-len(BIG_SIX))
        self.assertEqual(result["completedMatches"], 380)
        self.assertEqual(result["includedMatches"], (20-len(BIG_SIX))*(19-len(BIG_SIX)))
        self.assertEqual(result["excludedMatches"], 380-(20-len(BIG_SIX))*(19-len(BIG_SIX)))
        self.assertEqual(result["excludedIds"], sorted(BIG_SIX))
        self.assertEqual({r["id"] for r in result["alternativeTable"]}, set(range(7000, 7000+(20-len(BIG_SIX)))))
        self.assertTrue(all(r["P"] == 2*(19-len(BIG_SIX)) for r in result["alternativeTable"]))
        self.assertEqual(sum(r["P"] for r in result["alternativeTable"]), 2 * result["includedMatches"])
        self.assertEqual(sum(r["P"] for r in result["officialTableApproximation"]), 2 * 380)
        self.assertTrue(all(r["Pts"] == 3*r["W"] + r["D"] for r in result["alternativeTable"]))

    def test_lopsided_loss_to_excluded_club_is_erased_not_reassigned(self):
        games = synthetic_season()
        for game in games:
            if game["homeTeam"]["id"] == next(iter(BIG_SIX)) and game["awayTeam"]["id"] == 7000:
                game["score"]["fullTime"] = {"home": 20, "away": 0}
        result = calculate(games, generated_at="test")
        row = next(x for x in result["alternativeTable"] if x["id"] == 7000)
        all_row = next(x for x in result["officialTableApproximation"] if x["id"] == 7000)
        self.assertGreater(row["GD"], all_row["GD"])
        self.assertEqual(row["P"], 2*(19-len(BIG_SIX)))
        self.assertEqual(all_row["P"], 38)

    def test_incomplete_feed_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "Missing excluded clubs"):
            calculate([fixture(7000, 7001)])
        some = [game for game in synthetic_season() if game["homeTeam"]["id"] != 7000
                and game["awayTeam"]["id"] != 7000]
        with self.assertRaisesRegex(ValueError, "exactly 20"):
            calculate(some)

    def test_unfinished_games_do_not_contribute(self):
        games = synthetic_season()
        games[0]["status"] = "SCHEDULED"
        games[1]["score"]["fullTime"] = {"home": None, "away": None}
        result = calculate(games, generated_at="test")
        self.assertEqual(result["completedMatches"], 378)
        self.assertEqual(result["includedMatches"] + result["excludedMatches"], 378)

    def test_spain_still_uses_two_club_rule(self):
        games = [
            fixture(81, 86, 2, 0),
            fixture(81, 7000, 5, 0),
            fixture(86, 7001, 1, 2),
            fixture(7000, 7001, 2, 1)
        ]
        result = compute(games, generated_at="test")
        self.assertEqual(result["excluded"], ["Real Madrid", "FC Barcelona"])
        self.assertEqual(result["excludedMatches"], 3)
        self.assertEqual(result["includedMatches"], 1)
        self.assertEqual({r["id"] for r in result["alternativeTable"]}, {7000, 7001})

    def test_premier_league_page_has_no_placeholder_score(self):
        html = (ROOT / "public/england/index.html").read_text(encoding="utf-8")
        javascript = (ROOT / "public/premier-league/league.js").read_text(encoding="utf-8")
        self.assertIn('src="/premier-league/core.js"', html)
        self.assertIn('src="/premier-league/customizer.js"', html)
        self.assertIn('id="custom-checks"', html)
        self.assertIn('id="custom-season"', html)
        self.assertIn('id="custom-share"', html)
        self.assertIn('href="/premier-league/league.css"', html)
        self.assertIn('href="https://usurperleague.com/england/"', html)
        self.assertIn('id="no-big-six"', html)
        self.assertIn('id="all-teams"', html)
        self.assertIn('id="premier-rows"', html)
        self.assertIn('"/data/premier-league.json"', javascript)
        self.assertIn("if (!correctData(data))", javascript)
        self.assertIn('No imaginary scores', html)
        self.assertNotIn('<img src="https://', html)


if __name__ == "__main__":
    unittest.main()

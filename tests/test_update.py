import unittest
from scripts.update import compute

def match(h, a, hg, ag):
    names = {81:"Barça",86:"Real Madrid",78:"Atleti",77:"Athletic",560:"Deportivo",558:"Celta",5335:"Santander",1:"Atletico",2:"Sevilla",3:"Betis"}
    return {"homeTeam":{"id":h,"name":names[h]},"awayTeam":{"id":a,"name":names[a]},"status":"FINISHED","utcDate":"2026-09-01T19:00:00Z","score":{"fullTime":{"home":hg,"away":ag}}}

class StandingsTests(unittest.TestCase):
    def test_atletico_name_overrides_feed_nickname(self):
        result=compute([match(78,81,1,0),match(86,1,0,0)],generated_at="test")
        self.assertEqual(next(t['name'] for t in result['alternativeTable'] if t['id']==78),'Atlético Madrid')
        self.assertEqual(next(t['name'] for t in result['officialTableApproximation'] if t['id']==78),'Atlético Madrid')

    def test_club_names_use_editorial_versions(self):
        matches = [
            match(81,77,3,0),
            match(86,558,2,0),
            match(560,5335,1,1),
            match(78,81,0,2),
        ]
        result = compute(matches, generated_at="test")
        expected = {
            81: "FC Barcelona",
            78: "Atlético Madrid",
            77: "Athletic Club",
            560: "Deportivo La Coruña",
            558: "Celta Vigo",
            5335: "Racing Santander",
        }
        full = {row['id']: row['name'] for row in result['officialTableApproximation']}
        alt = {row['id']: row['name'] for row in result['alternativeTable']}
        for club_id, label in expected.items():
            self.assertEqual(full[club_id], label)
            if club_id not in {81, 86}:
                self.assertEqual(alt[club_id], label)

    def test_removed_matches_change_all_stats(self):
        matches=[match(81,1,4,0),match(86,2,1,0),match(1,2,2,1),match(3,81,3,2),match(2,3,0,0)]
        result=compute(matches,generated_at="test")
        self.assertEqual(result["excludedMatches"],3)
        self.assertEqual(result["includedMatches"],2)
        self.assertEqual({r["name"]:r["Pts"] for r in result["alternativeTable"]},{"Atletico":3,"Sevilla":1,"Betis":1})

if __name__=="__main__":
    unittest.main()

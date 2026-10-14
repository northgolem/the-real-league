import unittest
from scripts.update import compute

def match(h, a, hg, ag):
    names = {81:"Barcelona",86:"Real Madrid",78:"Atleti",1:"Atletico",2:"Sevilla",3:"Betis"}
    return {"homeTeam":{"id":h,"name":names[h]},"awayTeam":{"id":a,"name":names[a]},"status":"FINISHED","utcDate":"2026-09-01T19:00:00Z","score":{"fullTime":{"home":hg,"away":ag}}}

class StandingsTests(unittest.TestCase):
    def test_atletico_name_overrides_feed_nickname(self):
        result=compute([match(78,81,1,0),match(86,1,0,0)],generated_at="test")
        self.assertEqual(next(t['name'] for t in result['alternativeTable'] if t['id']==78),'Atlético Madrid')
        self.assertEqual(next(t['name'] for t in result['officialTableApproximation'] if t['id']==78),'Atlético Madrid')

    def test_removed_matches_change_all_stats(self):
        matches=[match(81,1,4,0),match(86,2,1,0),match(1,2,2,1),match(3,81,3,2),match(2,3,0,0)]
        result=compute(matches,generated_at="test")
        self.assertEqual(result["excludedMatches"],3)
        self.assertEqual(result["includedMatches"],2)
        self.assertEqual({r["name"]:r["Pts"] for r in result["alternativeTable"]},{"Atletico":3,"Sevilla":1,"Betis":1})

if __name__=="__main__":
    unittest.main()

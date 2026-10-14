import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dir = 'public/history';
const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
assert(index.seasons.length >= 90, 'archive should include at least 90 fully validated seasons');
assert.equal(index.seasons.at(-1).id, '1928-29');
assert.equal(index.seasons[0].id, '2025-26');
assert(!index.seasons.some(s => ['1936-37','1937-38','1938-39','1962-63'].includes(s.id)));
const seen = new Set();

for (const season of index.seasons) {
  assert(!seen.has(season.id), 'duplicate season '+season.id);
  seen.add(season.id);
  const filename = path.join(dir, season.id+'.json');
  const d = JSON.parse(fs.readFileSync(filename,'utf8'));
  const t = d.alternativeTable;
  const o = d.officialTableApproximation;
  assert.equal(d.mode, 'historical');
  assert.equal(d.seasonId, season.id);
  assert.equal(d.completedMatches, d.excludedMatches + d.includedMatches);
  assert.equal(t.length, o.length - 2);
  assert.equal(t.reduce((a, x) => a + x.P, 0), d.includedMatches*2);
  assert.equal(o.reduce((a, x) => a + x.P, 0), d.completedMatches*2);
  assert.equal(t[0].name,season.champion);
  assert.equal(d.pointsPerWin, Number(season.id.slice(0,4)) <= 1994 ? 2 : 3);
  for (const row of t) {
    assert(!['FC Barcelona','Real Madrid'].includes(row.name));
    assert.equal(row.P, row.W+row.D+row.L);
    assert.equal(row.GD, row.GF-row.GA);
    assert.equal(row.Pts, d.pointsPerWin*row.W+row.D);
  }
  for (let i=1;i<t.length;i++) {
    assert(t[i-1].Pts >= t[i].Pts, 'unsorted '+season.id);
    if(t[i-1].Pts===t[i].Pts)
      assert(t[i-1].GD>=t[i].GD, 'unsorted goal difference '+season.id);
  }
}
console.log('Validated',index.seasons.length,'historic seasons, points systems, matches and champions.');

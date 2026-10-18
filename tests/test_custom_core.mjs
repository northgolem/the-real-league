import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('public/premier-league/core.js','utf8');
const window={};
vm.runInNewContext(source,{window});
const core=window.UsurperLeagueCore;
const cfg=JSON.parse(fs.readFileSync('public/config/england.json','utf8'));
const table=JSON.parse(fs.readFileSync('public/data/premier-league.json','utf8'));
const matches=JSON.parse(fs.readFileSync('public/data/premier-league-matches.json','utf8'));
const omitted=cfg.excludedClubs.map(x=>x.name);
const current=core.parseCurrent(matches,table);
const baseline=core.validateDefault(current,table,omitted);
assert.equal(baseline.rows.length,20-omitted.length);
assert.equal(baseline.kept,table.includedMatches);
assert.equal(baseline.removed,table.excludedMatches);
assert.equal(baseline.rows[0].name,table.alternativeTable[0].name);
const all=core.calculate(current.clubs,current.matches,[]);
assert.equal(all.rows.length,20);
assert.equal(all.removed,0);
assert.equal(all.kept,matches.matches.length);
assert.equal(all.rows.reduce((n,x)=>n+x.P,0),2*all.kept);
for(let subset=0;subset<(1<<omitted.length);subset++){
  const out=omitted.filter((_x,i)=>(subset&(1<<i))!==0);
  const res=core.calculate(current.clubs,current.matches,out);
  assert.equal(res.rows.length,20-out.length);
  assert.equal(res.removed+res.kept,matches.matches.length);
  assert.equal(res.rows.reduce((n,r)=>n+r.P,0),2*res.kept);
  assert(res.rows.every(r=>!out.includes(r.name)));
}
const histIndex=JSON.parse(fs.readFileSync('public/england/history/index.json','utf8'));
assert.equal(histIndex.seasons.length,34);
for(const season of histIndex.seasons){
  const fixture=JSON.parse(fs.readFileSync('public/england/history/matches/'+season.id+'.json','utf8'));
  const verified=JSON.parse(fs.readFileSync('public/england/history/seasons/'+season.id+'.json','utf8'));
  const parsed=core.parseArchive(fixture);
  const calculated=core.validateDefault(parsed,verified,omitted);
  assert.equal(calculated.rows[0].name,season.champion,season.id+' champion must match certified archive');
  assert.equal(calculated.kept,season.matches);
  assert.equal(calculated.removed+calculated.kept,parsed.matches.length);
  // Simulate letting every Big Six club back in for each historical season.
  const inclusive=core.calculate(parsed.clubs,parsed.matches,[]);
  assert.equal(inclusive.removed,0);
  assert.equal(inclusive.rows.length,Number(season.id.slice(0,4))<=1994?22:20);
}
const first=core.parseArchive(JSON.parse(fs.readFileSync('public/england/history/matches/1992-93.json','utf8')));
assert.equal(core.calculate(first.clubs,first.matches,omitted).kept,240);
const bad=structuredClone(matches);
bad.matches[0][2]=9999;
assert.throws(()=>core.parseCurrent(bad,table),/differ/);
const duplicate=structuredClone(matches);
duplicate.matches.push(duplicate.matches[0]);
duplicate.completedMatches++;
assert.throws(()=>core.parseCurrent(duplicate,table),/stale|Duplicate/);
console.log('Custom calculator verified: current season, 34 historical seasons, all 64 subsets, no invented results.');

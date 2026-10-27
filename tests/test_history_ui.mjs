import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const page=fs.readFileSync('public/spain/index.html','utf8');
const index=JSON.parse(fs.readFileSync('public/history/index.json','utf8'));

assert.equal(index.seasons.length,94);
assert.match(page, /href="\/la-liga\/" id="nav-archive"/);
assert.match(page, /href="\/la-liga\/" id="archive-all-link"/);
assert(!page.includes('<script src="/history.js">'),
  'Obsolete JS picker must not be loaded by Spain');
assert(!page.includes('role="tablist"'), 'Historical navigation is links, not interactive tabs');
assert(!page.includes('id="season-tabs"'), 'No duplicate in-place historical table');

const hrefs=[...page.matchAll(/<a href="\/la-liga\/(\d{4}-\d{2})\/" aria-label="Read the /g)].map(m=>m[1]);
assert.equal(hrefs.length,94,'Every validated historical season should have a direct article link');
assert.equal(new Set(hrefs).size,94,'No duplicate archive links');
assert.deepEqual([...hrefs].sort(),index.seasons.map(x=>x.id).sort());
for(const season of hrefs){
  assert(fs.existsSync('public/la-liga/'+season+'/index.html'),
    'Historical link missing its article: '+season);
}
assert(page.includes('href="/la-liga/1995-96/"'),
  '1995/96 must link to the improved article');
assert(page.includes('<summary>1990s '),
  'Decade browsing should work with native disclosure HTML');

const script=page.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script&&script.includes("location.replace"),
  'Legacy season URL redirect should not require a cached external script');
function destination(query){
  let result=null;
  const location={search:query,replace(path){result=path}};
  vm.runInNewContext(script,{location,URLSearchParams});
  return result;
}
assert.equal(destination('?season=1995-96'),'/la-liga/1995-96/');
assert.equal(destination('?season=1928-29&lang=es'),'/la-liga/1928-29/');
assert.equal(destination('?season=2026-27'),null,'Current season remains on Spain homepage');
assert.equal(destination('?season=bad'),null,'Invalid dates should never redirect');
assert.equal(destination(''),null);

console.log('Spain navigation verified: 94 direct historical links, decade groups, legacy URL redirects, no stale JS picker.');

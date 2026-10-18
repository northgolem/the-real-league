import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const js = fs.readFileSync('public/premier-league/league.js', 'utf8');
const results = JSON.parse(fs.readFileSync('public/data/premier-league.json', 'utf8'));
const SIX = new Set([57, 61, 64, 65, 66, 73]);

function node() {
  const callbacks = new Map();
  return {
    textContent: '',
    children: [],
    attrs: {},
    classList: { add(){} },
    setAttribute(k, v) {this.attrs[k] = v;},
    appendChild(x) {this.children.push(x);},
    replaceChildren(...v) {this.children = [...v];},
    addEventListener(name, fn) {callbacks.set(name, fn);},
    click() {callbacks.get('click')?.();}
  };
}
async function load(dataset) {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, node());
    return elements.get(id);
  };
  const context = {
    document: { getElementById:get, createElement:()=>node() },
    fetch: async () => ({ok:true, json:async()=>dataset}),
    Date,
  };
  vm.runInNewContext(js, context, {filename:'league.js'});
  await new Promise(r => setImmediate(r));
  return get;
}

const get = await load(results);
const alt = get('premier-rows');
assert.equal(alt.children.length,14,'A 14-club alternative table must be visible');
assert.equal(get('no-big-six').attrs['aria-pressed'],'true');
assert.equal(get('matches-kept').textContent,results.includedMatches);
assert.equal(get('matches-removed').textContent,results.excludedMatches);
assert.equal(alt.children[0].children[1].textContent,results.alternativeTable[0].name);
assert.equal(alt.children[0].children[7].textContent,String(results.alternativeTable[0].Pts));
assert(!results.alternativeTable.some(x=>SIX.has(x.id)),'No Big Six club can slip into table');
assert.equal(get('story-title').textContent,results.alternativeTable[0].name+' are top. Well, well.');

get('all-teams').click();
assert.equal(alt.children.length,20,'Full comparison must show all 20 clubs');
assert.equal(get('all-teams').attrs['aria-pressed'],'true');
get('no-big-six').click();
assert.equal(alt.children.length,14,'Toggle back must show just 14 clubs');

const fake = JSON.parse(JSON.stringify(results));
fake.alternativeTable[0].Pts += 9; // corrupt data must fail validation
const bad = await load(fake);
assert.equal(bad('premier-rows').children.length,0,'Never show inconsistent/unverified results');
assert.match(bad('results-status').textContent,/awaiting verification/);

console.log('Premier League browser-style checks passed: verified data, both tables, exclusion and invalid-feed fallback.');

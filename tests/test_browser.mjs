import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('public/enhance.js','utf8');
const dataset = JSON.parse(fs.readFileSync('public/data/standings.json','utf8'));
function element(extra = {}) {
  const listeners = {};
  const node = {
    textContent: '',
    innerHTML: '',
    attributes: {},
    dataset: {},
    classList: { toggle() {} },
    setAttribute(k, v) { this.attributes[k] = v; },
    addEventListener(name, handler) { listeners[name] = handler; },
    click() { if (listeners.click) listeners.click(); },
    append() {},
    querySelector() { return element(); },
    ...extra
  };
  return node;
}
const selectors = new Map();
const ids = new Map();
const en = element({dataset:{lang:'en'}});
const es = element({dataset:{lang:'es'}});
const doc = {
  documentElement: {lang:'en'},
  querySelector(selector) {
    if (selector.startsWith('#')) return this.getElementById(selector.slice(1));
    if (!selectors.has(selector)) selectors.set(selector, element());
    return selectors.get(selector);
  },
  querySelectorAll(selector) {
    if (selector === '.lang-button') return [en, es];
    if (selector === '.rule') return [element(),element(),element()];
    return [];
  },
  getElementById(id) {
    if (!ids.has(id)) ids.set(id, element());
    return ids.get(id);
  },
  createElement: () => element()
};
const context = {
  window: {},
  document: doc,
  navigator:{language:'en-GB'},
  location:{search:'',href:'https://the-real-league.pages.dev/',pathname:'/',hash:''},
  history:{replaceState() {}},
  URL,
  URLSearchParams,
  Date,
  Intl,
  data: dataset,
  render() {}
};
vm.runInNewContext(source, context, {filename:'enhance.js'});
context.window.renderEnhancements(dataset, 'alternative');
assert.equal(doc.documentElement.lang,'en');
assert.equal(dataset.alternativeTable.find(row=>row.id===78)?.name,'Atlético Madrid');
for (const [id, name] of [
  [77, 'Athletic Club'],
  [560, 'Deportivo La Coruña'],
  [558, 'Celta Vigo'],
  [5335, 'Racing Santander'],
  [81, 'FC Barcelona']
]) {
  assert.equal(dataset.officialTableApproximation.find(row=>row.id===id)?.name,name);
}

assert.match(selectors.get('.topright').innerHTML,/NO GODS/);
assert.equal(selectors.get('.hero-slogan .line1').textContent,'Let the rich kids keep the sandpit.');
assert.equal(selectors.get('.hero-slogan .line2').textContent,'We’re having a league.');
assert.equal(selectors.get('.hero-headline-first').textContent,'Same game.');
assert.equal(selectors.get('.hero-headline-second').textContent,'Different favourites.');
assert.equal(doc.getElementById('nav-archive').textContent,'The archive');
assert.match(selectors.get('.hero-explainer').textContent,/Real Madrid and Barcelona are very good/);
assert.equal(selectors.get('.hero-sandpit').textContent,'They can go and play in their own sandpit.');
assert.match(selectors.get('.hero-method').textContent,/removed every match involving either/);
assert.equal(selectors.get('.hero-closer').textContent,'Same football. Much more interesting.');
assert.equal(doc.getElementById('archive-heading').textContent,'Apparently, other clubs can win things.');
assert.match(context.window.getSharePayload().title,/The Usurper League/);
assert.equal(doc.getElementById('race-value').textContent,
  dataset.alternativeTable.filter(r=>r.Pts===dataset.alternativeTable[0].Pts).map(r=>r.name).join(' / '));
assert.notEqual(doc.getElementById('slayers-value').textContent,'—');
assert.notEqual(doc.getElementById('rebound-value').textContent,'—');
es.click();
context.window.renderEnhancements(dataset,'alternative');
assert.equal(doc.documentElement.lang,'es');
assert.equal(doc.getElementById('alternative').textContent,'Sin dioses');
assert.match(selectors.get('.topright').innerHTML,/SIN DIOSES/);
assert.equal(selectors.get('.hero-slogan .line1').textContent,'Que los niños ricos se queden con su patio.');
assert.equal(selectors.get('.hero-slogan .line2').textContent,'Nosotros montamos nuestra liga.');
assert.equal(selectors.get('.hero-headline-first').textContent,'El mismo fútbol.');
assert.equal(selectors.get('.hero-headline-second').textContent,'Otros favoritos.');
assert.equal(doc.getElementById('nav-standings').textContent,'Clasificación');
assert.match(selectors.get('.hero-explainer').textContent,/El Real Madrid y el Barça/);
assert.equal(selectors.get('.hero-sandpit').textContent,'Que se vayan a jugar a su propio patio.');
assert.match(selectors.get('.hero-method').textContent,/hemos quitado todos los partidos/);
assert.equal(selectors.get('.hero-closer').textContent,'El mismo fútbol. Mucho más interesante.');
assert.match(doc.getElementById('archive-heading').textContent,/demás también saben ganar/);
assert.equal(selectors.get('thead th:nth-child(3)').textContent,'PJ');
assert.match(context.window.getSharePayload().text,/Que les den a los clubes millonarios/);
context.window.renderEnhancements(dataset,'original');
assert.match(doc.getElementById('matchinfo').textContent,/20 clubes/);

// The historical articles need the same editorial voice in both languages.
const archive = JSON.parse(fs.readFileSync('public/history/1994-95.json','utf8'));
context.window.renderEnhancements(archive,'alternative');
assert.match(doc.getElementById('storytext').textContent,/La copa, por desgracia, no/);
assert.match(doc.getElementById('headline').textContent,/Aquí, al menos/);
en.click();
context.window.renderEnhancements(archive,'alternative');
assert.match(doc.getElementById('storytext').textContent,/The trophy, regrettably, is not/);
assert.match(doc.getElementById('headline').textContent,/In this version/);
assert.match(selectors.get('footer .container span').textContent,/The Usurper League/);
console.log('Usurper League bilingual and historic editorial tests passed.');

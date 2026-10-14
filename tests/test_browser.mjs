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
assert.match(selectors.get('.topright').innerHTML,/NO GODS/);
assert.match(selectors.get('.hero p').textContent,/Real Madrid and Barcelona/);
assert.equal(doc.getElementById('race-value').textContent,
  dataset.alternativeTable.filter(r=>r.Pts===dataset.alternativeTable[0].Pts).map(r=>r.name).join(' / '));
assert.notEqual(doc.getElementById('slayers-value').textContent,'—');
assert.notEqual(doc.getElementById('rebound-value').textContent,'—');
es.click();
context.window.renderEnhancements(dataset,'alternative');
assert.equal(doc.documentElement.lang,'es');
assert.equal(doc.getElementById('alternative').textContent,'Sin dioses');
assert.match(selectors.get('.topright').innerHTML,/SIN DIOSES/);
assert.match(selectors.get('.hero p').textContent,/El Real Madrid y el Barça/);
assert.equal(selectors.get('thead th:nth-child(3)').textContent,'PJ');
assert.match(context.window.getSharePayload().text,/La Liga sin Madrid ni Barça/);
context.window.renderEnhancements(dataset,'original');
assert.match(doc.getElementById('matchinfo').textContent,/20 equipos/);
console.log('Bilingual insight smoke tests passed.');

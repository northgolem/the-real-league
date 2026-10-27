import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const js = fs.readFileSync('public/history.js', 'utf8');
const archiveIndex = JSON.parse(fs.readFileSync('public/history/index.json','utf8'));
const full = JSON.parse(fs.readFileSync('public/data/standings.json','utf8'));
const elements = new Map();
class FakeClassList {
  constructor() { this.set = new Set(); }
  toggle(name, active) { if (active) this.set.add(name); else this.set.delete(name); }
  contains(name) { return this.set.has(name); }
}
function el() {
  const listeners = {};
  return {
    children: [], dataset: {}, textContent: '', attributes:{},
    classList: new FakeClassList(),
    replaceChildren(...children) { this.children = children; },
    addEventListener(event, fn) { listeners[event] = fn; },
    click() { listeners.click?.(); },
    scrollIntoView() {}, scrollBy() {}, focus() {},
    setAttribute(key,value) { this.attributes[key]=value; },
    querySelectorAll(selector) {
      return selector === '.season-tab' ? this.children.filter(x=>x.className==='season-tab') : [];
    }
  };
}
function byId(id) { if (!elements.has(id)) elements.set(id,el()); return elements.get(id); }
const doc = {
  documentElement:{lang:'en'},
  getElementById:byId,
  createElement:()=>el(),
  querySelector(selector) {
    if(selector==='.season-tab.active')
      return byId('season-tabs').children.find(tab=>tab.classList.contains('active')) || null;
    return null;
  },
  querySelectorAll(selector) {
    if(selector==='.season-tab') return byId('season-tabs').children;
    return [];
  }
};
const visited = [];
const ctx = {
  document: doc,
  window: {addEventListener() {}, normalizeClubNames() {}},
  location: {
    href:'https://usurperleague.com/spain/?season=1994-95',
    search:'?season=1994-95', pathname:'/spain/', hash:'',
    assign(path) { visited.push(path); }
  },
  history: {pushState(_s,_t,url) {ctx.location.href='https://usurperleague.com'+url;}},
  URL, URLSearchParams, console,
  data:null,
  render() {ctx.renders++;},
  renders:0,
  fetch:async url=>{
    if(url!=='/history/index.json') return {ok:false,status:404};
    return {ok:true,json:async()=>structuredClone(archiveIndex)};
  }
};

vm.runInNewContext(js, ctx, {filename:'history.js'});
ctx.window.setCurrentSeasonData(full);
const settle = async()=>{
  await new Promise(resolve=>setImmediate(resolve));
  await new Promise(resolve=>setImmediate(resolve));
};
await settle();
assert.equal(ctx.data.mode,'live','The Spain homepage only displays the current-season table');
assert.equal(visited.at(-1),'/la-liga/1994-95/','Legacy deep links must open the new season story');
assert.equal(byId('season-tabs').children.length,archiveIndex.seasons.length+1);
assert(byId('decade-links').children.length>=9);
byId('season-tabs').children.find(t=>t.dataset.season==='1928-29').click();
assert.equal(visited.at(-1),'/la-liga/1928-29/','Selecting an old year opens its canonical article');
byId('season-tabs').children.find(t=>t.dataset.season==='1995-96').click();
assert.equal(visited.at(-1),'/la-liga/1995-96/','Selecting 1995/96 opens the new article');
byId('season-tabs').children[0].click();
await settle();
assert.equal(ctx.data.mode,'live');
assert.equal(ctx.window.historySeasonSelected,'2026-27');
assert(ctx.renders>=1);
console.log('Season navigation verified: current table, canonical historic links and legacy URLs.');

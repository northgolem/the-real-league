import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const config=JSON.parse(fs.readFileSync('public/config/england.json','utf8'));
const current=JSON.parse(fs.readFileSync('public/data/premier-league.json','utf8'));
const currentMatches=JSON.parse(fs.readFileSync('public/data/premier-league-matches.json','utf8'));
const historicalIndex=JSON.parse(fs.readFileSync('public/england/history/index.json','utf8'));
const coreJs=fs.readFileSync('public/premier-league/core.js','utf8');
const customJs=fs.readFileSync('public/premier-league/customizer.js','utf8');

function element(tag='div') {
  const events=new Map();
  const node={
    tagName:tag.toUpperCase(),textContent:'',value:'',checked:false,disabled:false,
    className:'',children:[],attrs:{},type:'',
    classList:{add(){}},
    setAttribute(k,v){this.attrs[k]=String(v);},
    appendChild(el){this.children.push(el);return el;},
    replaceChildren(...els){this.children=[...els];},
    addEventListener(name,fn){events.set(name,fn);},
    click(){events.get('click')?.();},
    change(){events.get('change')?.();},
    querySelectorAll(selector) {
      const matched=[];
      function walk(n){for(const c of n.children){if(selector==='input'&&c.tagName==='INPUT')matched.push(c);walk(c)}}
      walk(this);return matched;
    },
  };
  return node;
}
async function load(initial='') {
  const ids=new Map(), links=[], handlers=new Map();
  const get=id=>{if(!ids.has(id))ids.set(id,element());return ids.get(id)};
  const doc={getElementById:get,createElement:tag=>element(tag)};
  const location={origin:'https://usurperleague.com',search:initial,
    href:'https://usurperleague.com/england/'+initial};
  const win={addEventListener(k,cb){handlers.set(k,cb)}};
  let copied='';
  const mockFetch=async(path)=>{
    const lookup={
      '/config/england.json':config,
      '/england/history/index.json':historicalIndex,
      '/data/premier-league.json':current,
      '/data/premier-league-matches.json':currentMatches,
    };
    let data=lookup[path];
    if(path.startsWith('/england/history/matches/'))data=JSON.parse(fs.readFileSync('public'+path,'utf8'));
    if(path.startsWith('/england/history/seasons/'))data=JSON.parse(fs.readFileSync('public'+path,'utf8'));
    return {ok:!!data,status:data?200:404,json:async()=>data};
  };
  const hist={replaceState(_a,_b,url){links.push(url)}};
  const context={window:win,document:doc,location,history:hist,URL,URLSearchParams,
    navigator:{clipboard:{async writeText(value){copied=value}}},
    fetch:mockFetch,Set,Map,Date};
  vm.runInNewContext(coreJs,context,{filename:'core.js'});
  vm.runInNewContext(customJs,context,{filename:'customizer.js'});
  const settle=async()=>{for(let i=0;i<7;i++)await new Promise(r=>setImmediate(r));};
  await settle();
  return {get,links,settle,window:win,copied:()=>copied};
}

let app=await load();
assert.equal(app.get('custom-season').children.length,35,'All 34 historical seasons and current season must appear');
assert.equal(app.get('custom-season').disabled,false);
assert.equal(app.get('custom-checks').children.length,6);
assert.equal(app.get('premier-rows').children.length,14,'Default keeps the Big Six excluded');
assert.equal(Number(app.get('matches-kept').textContent),current.includedMatches);
assert.match(app.get('story-title').textContent,/are top/);
const inputs=app.get('custom-checks').querySelectorAll('input');
const tottenham=inputs.find(x=>x.value==='Tottenham Hotspur');
tottenham.checked=false;tottenham.change();
assert.equal(app.get('premier-rows').children.length,15,'Reinstating Spurs must instantly return a club');
assert(app.links.at(-1).includes('out='),'Custom table must update shareable URL');
assert(!app.links.at(-1).includes('tottenham-hotspur'));
app.get('all-teams').click();
assert.equal(app.get('premier-rows').children.length,20);
assert.equal(Number(app.get('matches-removed').textContent),0);
assert(app.links.at(-1).includes('out=none'));
app.get('no-big-six').click();
assert.equal(app.get('premier-rows').children.length,14);
app.get('custom-season').value='1992-93';
app.get('custom-season').change();
await app.settle();
assert.equal(app.get('premier-rows').children.length,16,'1992/93 had 22 clubs before exclusions');
assert.equal(Number(app.get('matches-kept').textContent),240);
assert.equal(app.get('story-title').textContent,'Norwich City are top. Well, well.');
assert(app.links.at(-1).includes('season=1992-93'));
app.get('custom-share').click();
await app.settle();
assert(app.copied().includes('season=1992-93'));
assert(app.copied().includes('https://usurperleague.com/england/'));

app=await load('?season=2015-16&out=none');
assert.equal(app.get('premier-rows').children.length,20,'Deep link includes every club when out=none');
assert.equal(app.get('story-title').textContent,'Leicester City are top. Well, well.');
assert.equal(Number(app.get('matches-removed').textContent),0);
app=await load('?season=1992-93&out=manchester-city,chelsea');
assert.equal(app.get('premier-rows').children.length,20,'Deep-linked combination must exclude only those two teams');
assert.equal(app.get('custom-count').textContent,'2 out');
console.log('Custom England page tested: toggles, presets, all seasons, 1992/93, direct URLs, copy and no score fabrication.');

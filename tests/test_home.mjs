import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('public/home.js','utf8');
const spain=JSON.parse(fs.readFileSync('public/data/standings.json','utf8'));
const england=JSON.parse(fs.readFileSync('public/data/premier-league.json','utf8'));

function node(extra={}){
  const events=new Map();
  return {
    textContent:'', href:'', dataset:{}, attrs:{},
    setAttribute(k,v){this.attrs[k]=v;},
    addEventListener(k,fn){events.set(k,fn);},
    click(){events.get('click')?.();},
    ...extra
  };
}
async function load(es=false,spoof=false){
  const ids=new Map();const get=id=>{if(!ids.has(id))ids.set(id,node());return ids.get(id)};
  const buttons=[node({dataset:{lang:'en'}}),node({dataset:{lang:'es'}})];
  const doc={documentElement:{lang:'en'},getElementById:get,
    querySelectorAll:selector=>selector==='.lang button'?buttons:[]};
  const seen=[];
  const context={document:doc,URL,URLSearchParams,
    location:{href:'https://usurperleague.com/'+(es?'?lang=es':''),
      search:es?'?lang=es':'',pathname:'/',hash:''},
    history:{replaceState(_a,_b,url){seen.push(url)}},
    fetch:async(path)=>{
      if(path==='/data/standings.json')return {ok:true,json:async()=>spain};
      if(path==='/data/premier-league.json')return {ok:true,json:async()=>spoof?{...england,excludedIds:[1,2,3,4,5,6]}:england};
      throw Error('Unexpected request '+path);
    }
  };
  vm.runInNewContext(source,context,{filename:'home.js'});
  await new Promise(resolve=>setImmediate(resolve));
  return {get,doc,buttons,seen};
}
let r=await load(false);
assert.equal(r.doc.documentElement.lang,'en');
assert.equal(r.get('spain-card').href,'/spain/');
assert.equal(r.get('england-card').href,'');
assert.match(r.get('spain-current').textContent,new RegExp(spain.alternativeTable[0].name.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&')));
assert.match(r.get('england-current').textContent,new RegExp(england.alternativeTable[0].name.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&')));
assert.equal(r.get('choose').textContent,'CHOOSE YOUR LEAGUE');
r.buttons[1].click();
assert.equal(r.doc.documentElement.lang,'es');
assert.equal(r.get('spain-card').href,'/spain/?lang=es');
assert.match(r.get('spain-current').textContent,/puntos/);
assert.equal(r.get('choose').textContent,'ELIGE TU LIGA');
r=await load(true,true);
assert.equal(r.get('england-current').textContent,'Ver la clasificación →','Corrupt EPL feeds must not expose standings');
assert.match(r.get('spain-current').textContent,/puntos/);
console.log('Brand homepage tests passed: two countries, real leaders, bilingual nav and invalid-feed fallback.');

import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const code=fs.readFileSync("public/la-liga/season-compare.js","utf8");
function makeElement(id,properties={}){
  const events=new Map();
  return {
    id,disabled:true,hidden:false,textContent:"",attrs:{},
    dataset:{},...properties,
    setAttribute(name,value){this.attrs[name]=String(value)},
    querySelector(selector){return selector==="table"?this.table:null},
    addEventListener(event,cb){events.set(event,cb)},
    click(){events.get("click")?.()},
  };
}
function testOnce(season){
  const year=JSON.parse(fs.readFileSync("public/history/"+season+".json","utf8"));
  const html=fs.readFileSync("public/la-liga/"+season+"/index.html","utf8");
  assert.match(html,/class="season-table-panel"/);
  assert.match(html,/data-season-view="everyone"/);
  assert.match(html,/id="spanish-everyone-table" hidden/);
  assert.match(html,/src="\/la-liga\/season-compare.js"/);
  assert.match(html,/All-club La Liga calculation for/);
  assert.equal((html.match(/<table aria-label=/g)||[]).length,2);
  const heading=makeElement("our-table",{textContent:"The league when the usual two sit this one out."});
  const description=makeElement("season-view-explainer");
  const alt=makeElement("spanish-usurper-table",{table:makeElement("table")});
  const full=makeElement("spanish-everyone-table",{hidden:true,table:makeElement("table")});
  const usurper=makeElement("usurper",{dataset:{seasonView:"usurper"}});
  const everyone=makeElement("everyone",{dataset:{seasonView:"everyone"}});
  const panel={dataset:{
      altClubs:String(year.alternativeTable.length),
      altMatches:String(year.includedMatches),
      fullClubs:String(year.officialTableApproximation.length),
      fullMatches:String(year.completedMatches),
      removed:String(year.excludedMatches),
    },querySelectorAll(selector){return selector==="[data-season-view]"?[usurper,everyone]:[]}};
  const byId={"our-table":heading,"season-view-explainer":description,
    "spanish-usurper-table":alt,"spanish-everyone-table":full};
  const doc={querySelector(selector){return selector===".season-table-panel"?panel:null},
    getElementById(id){return byId[id]}};
  vm.runInNewContext(code,{document:doc});
  assert.equal(usurper.disabled,false);
  assert.equal(everyone.disabled,false);
  assert.equal(alt.hidden,false);
  assert.equal(full.hidden,true);
  assert.equal(usurper.attrs["aria-pressed"],"true");
  assert.equal(everyone.attrs["aria-pressed"],"false");
  assert(description.textContent.includes(String(year.includedMatches)));
  everyone.click();
  assert.equal(alt.hidden,true);
  assert.equal(full.hidden,false);
  assert.equal(everyone.attrs["aria-pressed"],"true");
  assert.equal(usurper.attrs["aria-pressed"],"false");
  assert(description.textContent.includes(String(year.completedMatches)));
  assert.match(description.textContent,/not an official LaLiga table/);
  usurper.click();
  assert.equal(alt.hidden,false);
  assert.equal(full.hidden,true);
  assert.equal(heading.textContent,"The league when the usual two sit this one out.");
  assert(description.textContent.includes(String(year.excludedMatches)));
}
const index=JSON.parse(fs.readFileSync("public/history/index.json","utf8"));
assert.equal(index.seasons.length,94);
for(const row of index.seasons)testOnce(row.id);
const england=fs.readFileSync("public/england/history/2011-12/index.html","utf8");
assert(!england.includes("season-compare.js"),"English history must remain unchanged");
console.log("All 94 historical Spanish seasons passed table toggle, counts, keyboard-ready states and no-English-change checks.");

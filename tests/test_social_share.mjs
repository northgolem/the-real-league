import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {inflateSync} from "node:zlib";
import {makePreview,html,select,escapeHTML} from "../lib/england-share.mjs";
import {makeCard} from "../lib/share-card.mjs";
import {onRequestGet as share} from "../functions/share/england.js";
import {onRequestGet as image} from "../functions/share/image.js";

const pub="public";
const cache=new Map();
const read=async path=>{
  if(!/^\/[a-z0-9./-]+\.json$/.test(path)||path.includes(".."))
    throw Error("Unexpected asset path "+path);
  if(!cache.has(path))cache.set(path,JSON.parse(fs.readFileSync(pub+path,"utf8")));
  return cache.get(path);
};
const config=await read("/config/england.json");
const index=await read("/england/history/index.json");
const live=await read("/data/premier-league.json");
const names=config.excludedClubs.map(x=>x.name);
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const total=1<<names.length;
const allCurrent=await makePreview(new URL("https://usurperleague.com/share/england"),read);
assert.equal(allCurrent.season,live.season);
assert.equal(allCurrent.champion,live.alternativeTable[0].name);
assert.equal(allCurrent.points,live.alternativeTable[0].Pts);
assert.equal(allCurrent.remaining,14);
assert.equal(allCurrent.removed,live.excludedMatches);
assert.equal(allCurrent.kept,live.includedMatches);
assert.match(html(allCurrent),/og:image:width" content="1200"/);
assert.match(html(allCurrent),/twitter:card" content="summary_large_image"/);
assert.match(html(allCurrent),/og:image" content="https:\/\/usurperleague.com\/share\/image/);
assert.match(html(allCurrent),/location.replace/);
assert.match(html(allCurrent),/noindex,follow/);
assert.equal(escapeHTML('<script>"&'),"&lt;script&gt;&quot;&amp;");

const browser={};
vm.runInNewContext(fs.readFileSync("public/premier-league/core.js","utf8"),{window:browser});
const fixture=await read("/data/premier-league-matches.json");
const reference=browser.UsurperLeagueCore.parseCurrent(fixture,live);

for(let mask=0;mask<total;mask++){
  const excluded=names.filter((_,i)=>mask&(1<<i));
  const url=new URL("https://usurperleague.com/share/england");
  if(excluded.length!==names.length)
    url.searchParams.set("out",excluded.length?excluded.map(slug).join(","):"none");
  const preview=await makePreview(url,read);
  const expected=browser.UsurperLeagueCore.calculate(reference.clubs,reference.matches,excluded);
  assert.equal(preview.champion,expected.rows[0].name,"Wrong current champion for mask "+mask);
  assert.equal(preview.points,expected.rows[0].Pts);
  assert.equal(preview.remaining,expected.clubsRemaining);
  assert.equal(preview.kept,expected.kept);
  assert.equal(preview.removed,expected.removed);
  assert.equal(preview.selected.join(","),excluded.join(","));
}
for(const row of index.seasons){
  const url=new URL("https://usurperleague.com/share/england?season="+row.id);
  const preview=await makePreview(url,read);
  assert.equal(preview.champion,row.champion,"Incorrect historical champion "+row.id);
  assert.equal(preview.kept,row.matches);
  assert.equal(preview.points,row.points);
}
for(const param of ["&out=unknown-team","&out=chelsea,chelsea","&out=chelsea,<script>",
  "&out=chelsea,arsenal,another-team"]){
  await assert.rejects(()=>makePreview(new URL("https://usurperleague.com/share/england?season=1992-93"+param),read));
}
await assert.rejects(()=>makePreview(new URL("https://usurperleague.com/share/england?season=1800-01"),read));

const example=new URL("https://usurperleague.com/share/england?season=1992-93&out=chelsea,manchester-city");
const preview=await makePreview(example,read);
assert.equal(preview.selected.length,2);
assert.equal(preview.remaining,20);
assert(preview.title.includes(preview.champion));
assert(preview.description.includes("Chelsea"));
assert(preview.destination.includes("/england/?season=1992-93"));

const png=await makeCard(preview);
assert.deepEqual([...png.slice(0,8)],[137,80,78,71,13,10,26,10]);
assert.equal(new DataView(png.buffer).getUint32(16),1200);
assert.equal(new DataView(png.buffer).getUint32(20),630);
console.log("Personalised PNG size:",png.byteLength,"bytes");
assert(png.byteLength>1500&&png.byteLength<2_000_000,"Preview PNG must be usefully compressed");
let off=8, compressed=null;
while(off<png.length){
  const view=new DataView(png.buffer,png.byteOffset+off,8);
  const len=view.getUint32(0),tag=new TextDecoder().decode(png.subarray(off+4,off+8));
  if(tag==="IDAT")compressed=png.subarray(off+8,off+8+len);
  off+=12+len;
}
assert(compressed&&inflateSync(compressed).byteLength===630*(1200*4+1));

const assets={fetch:async input=>{
  const path=new URL(input.url??input).pathname;
  try{return new Response(JSON.stringify(await read(path)),{status:200,headers:{"content-type":"application/json"}})}
  catch{return new Response("missing",{status:404})}
}};
const htmlResponse=await share({request:new Request(example),env:{ASSETS:assets}});
assert.equal(htmlResponse.status,200);
assert.equal(htmlResponse.headers.get("content-type"),"text/html; charset=utf-8");
const markup=await htmlResponse.text();
assert(markup.includes("og:image"));
assert(markup.includes(preview.champion));
const pngResponse=await image({request:new Request(example),env:{ASSETS:assets}});
assert.equal(pngResponse.status,200);
assert.equal(pngResponse.headers.get("content-type"),"image/png");
assert.deepEqual([...new Uint8Array(await pngResponse.arrayBuffer()).slice(0,8)],[137,80,78,71,13,10,26,10]);

console.log("Social sharing verified: 64 current combinations, all 34 champions, no fabricated scores, personalised PNG and Cloudflare endpoints.");

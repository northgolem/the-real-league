import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('public/journal/share.js','utf8');
async function test(navigator,lang='en') {
 let click;const button={hidden:true,addEventListener(_e,fn){click=fn}};
 const status={textContent:''};
 const document={documentElement:{lang},querySelector(s){return {'[data-share]':button,'[data-share-status]':status,'h1':{textContent:'Story'},'link[rel="canonical"]':{href:'https://usurperleague.com/journal/story/'}}[s]}};
 vm.runInNewContext(source,{document,navigator});assert.equal(button.hidden,false);await click();return status.textContent;
}
let payload;await test({share:async p=>{payload=p}});assert.equal(payload.url,'https://usurperleague.com/journal/story/');
let copied;assert.equal(await test({clipboard:{writeText:async p=>{copied=p}}},'es'),'Enlace copiado.');assert.equal(copied,payload.url);
assert.equal(await test({share:async()=>{throw Object.assign(new Error(),{name:'AbortError'})}}),'');
assert.match(await test({clipboard:{writeText:async()=>{throw Error('denied')}}}),/^Copy this link: https:/);
console.log('Sharing passed: native, clipboard, cancellation and denied-permission fallback.');

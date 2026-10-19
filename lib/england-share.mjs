/* Authoritative share preview calculations from public, verified football fixtures.
 * Cloudflare Pages Functions; no API token or third-party screenshot service. */
const ORIGIN="https://usurperleague.com";
const slug=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const order=(a,b)=>b.Pts-a.Pts||b.GD-a.GD||b.GF-a.GF||a.name.localeCompare(b.name,"en");
export function select(url,config,index,live) {
  const clubs=config?.excludedClubs;
  if(!Array.isArray(clubs)||clubs.length===0||!Array.isArray(index?.seasons)||
     !Array.isArray(index?.excluded) || !live || live.mode!=="live" ||
     live.competitionCode!=="PL" || live.exclusionGroup!==config.exclusionLabel ||
     index.excluded.join("|")!==clubs.map(x=>x.name).join("|") ||
     live.excludedIds.join(",")!==clubs.map(x=>x.id).sort((a,b)=>a-b).join(","))
    throw Error("Exclusion settings are not synchronized");
  const current=live.season.replace("/","-");
  const valid=new Set([current,...index.seasons.map(x=>x.id)]);
  const year=url.searchParams.get("season") || current;
  if(!valid.has(year))throw Error("Unknown Premier League season");
  const out=url.searchParams.get("out");
  const bySlug=new Map(clubs.map(x=>[slug(x.name),x.name]));
  let names;
  if(out===null)names=clubs.map(x=>x.name);
  else if(out==="none")names=[];
  else {
    const tokens=out.split(",");
    if(!tokens.length || tokens.length>clubs.length || new Set(tokens).size!==tokens.length ||
       tokens.some(x=>!bySlug.has(x)))throw Error("Invalid excluded-club selection");
    names=tokens.map(t=>bySlug.get(t));
  }
  const namesInConfigOrder=clubs.map(x=>x.name).filter(n=>names.includes(n));
  const normalized=new URL("/share/england",ORIGIN);
  if(year!==current)normalized.searchParams.set("season",year);
  if(namesInConfigOrder.length!==clubs.length)
    normalized.searchParams.set("out",namesInConfigOrder.length?
      namesInConfigOrder.map(slug).join(","):"none");
  const destination=new URL("/england/",ORIGIN);
  if(year!==current)destination.searchParams.set("season",year);
  if(namesInConfigOrder.length!==clubs.length)
    destination.searchParams.set("out",namesInConfigOrder.length?
      namesInConfigOrder.map(slug).join(","):"none");
  return {seasonId:year,selected:namesInConfigOrder,shareURL:normalized.toString(),
          destination:destination.toString(),isCurrent:year===current,
          season:year.slice(0,4)+"/"+year.slice(-2),config,live};
}

function compute(clubs,fixtures,exclude) {
  if(!Array.isArray(clubs)||!Array.isArray(fixtures))throw Error("Invalid fixture archive");
  const all=new Map(clubs.map(t=>[t.id,{id:t.id,name:t.name,P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,Pts:0}]));
  if(all.size!==clubs.length)throw Error("Duplicate teams");
  const names=new Set(clubs.map(c=>c.name));
  if(exclude.some(name=>!names.has(name) && exclude.length>0)) {
    // Clubs absent from the top flight have no match results to exclude.
    exclude=exclude.filter(name=>names.has(name));
  }
  const removed=new Set(exclude);
  const seen=new Set();
  let kept=0,ignored=0;
  for(const [h,a,hg,ag] of fixtures) {
    if(!all.has(h)||!all.has(a)||h===a||!Number.isInteger(hg)||!Number.isInteger(ag)||
       hg<0||ag<0)throw Error("Unverified fixture in archive");
    const pair=String(h)+"|"+String(a);
    if(seen.has(pair))throw Error("Duplicate historical fixture");
    seen.add(pair);
    const H=all.get(h),A=all.get(a);
    if(removed.has(H.name)||removed.has(A.name)){ignored++;continue;}
    kept++;H.P++;A.P++;
    H.GF+=hg;H.GA+=ag;A.GF+=ag;A.GA+=hg;
    if(hg>ag){H.W++;H.Pts+=3;A.L++}
    else if(ag>hg){A.W++;A.Pts+=3;H.L++}
    else {H.D++;A.D++;H.Pts++;A.Pts++}
  }
  const rows=[...all.values()].filter(t=>!removed.has(t.name));
  rows.forEach(t=>t.GD=t.GF-t.GA);
  rows.sort(order);rows.forEach((r,i)=>r.position=i+1);
  if(rows.reduce((n,r)=>n+r.P,0)!==2*kept)throw Error("Match totals do not reconcile");
  return {rows,kept,removed:ignored};
}
function sameTable(calc,official) {
  if(!Array.isArray(official)||calc.rows.length!==official.length)return false;
  return calc.rows.every((r,i)=>{
    const x=official[i];
    return (r.id===x.id || r.name===x.name) &&
      ["P","W","D","L","GF","GA","GD","Pts"].every(k=>r[k]===x[k]);
  });
}
export async function makePreview(input,read) {
  const config=await read("/config/england.json");
  const [index,live]=await Promise.all([
    read("/england/history/index.json"),read("/data/premier-league.json")
  ]);
  const params=select(input,config,index,live);
  let clubList,fixtures,verified;
  if(params.isCurrent){
    const data=await read("/data/premier-league-matches.json");
    if(data.competitionCode!=="PL"||data.season!==live.season||
       data.matches?.length!==live.completedMatches ||
       data.clubs?.length!==20)throw Error("Current fixture archive is stale");
    clubList=data.clubs;fixtures=data.matches;verified=live;
  } else {
    const [data,table]=await Promise.all([
      read("/england/history/matches/"+params.seasonId+".json"),
      read("/england/history/seasons/"+params.seasonId+".json")
    ]);
    if(data.seasonId!==params.seasonId||data.license!=="CC0-1.0"||
       table.seasonId!==params.seasonId)throw Error("Historical source data inconsistent");
    const unique=new Set(data.matches.flatMap(x=>[x[0],x[1]]));
    const expected=Number(params.seasonId.slice(0,4))<=1994?22:20;
    if(unique.size!==expected||data.matches.length!==expected*(expected-1))
      throw Error("Historical fixture coverage incomplete");
    clubList=[...unique].map(name=>({id:name,name}));
    fixtures=data.matches;verified=table;
  }
  // Verify *the default table* before extrapolating any supporter-created version.
  const defaults=config.excludedClubs.map(x=>x.name);
  const baseline=compute(clubList,fixtures,defaults);
  if(!sameTable(baseline,verified.alternativeTable) ||
     baseline.kept!==verified.includedMatches ||
     baseline.removed!==verified.excludedMatches)
    throw Error("Source scores do not reproduce certified alternative standings");
  if(params.isCurrent && !sameTable(compute(clubList,fixtures,[]),live.officialTableApproximation))
    throw Error("Current full table and fixture data disagree");
  const result=compute(clubList,fixtures,params.selected);
  if(!result.rows.length)throw Error("No teams left in personalised competition");
  return {
    ...params,
    champion:result.rows[0].name,
    points:result.rows[0].Pts,
    played:result.rows[0].P,
    remaining:result.rows.length,
    removed:result.removed,
    kept:result.kept,
    activeExclusions:params.selected.filter(x=>clubList.some(c=>c.name===x)),
    title:result.rows[0].name+(params.isCurrent?" lead your ":" win your ")+
      params.season+" alternative Premier League",
    description:params.selected.length?
      "Out: "+params.selected.join(", ")+". "+result.rows[0].name+
      " top the table on "+result.rows[0].Pts+" points. Pick your own exclusions. Real results. Imaginary trophy.":
      "Everyone's invited. "+result.rows[0].name+
      " top the "+params.season+" Premier League on "+result.rows[0].Pts+
      " points. Make your own league.",
  };
}
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
export function html(result) {
  const title=escapeHTML(result.title+" | The Usurper League");
  const description=escapeHTML(result.description);
  const ogURL=escapeHTML(result.shareURL);
  const imgURL=new URL("/share/image",ORIGIN);
  imgURL.search=new URL(result.shareURL).search;
  const target=escapeHTML(result.destination);
  const redirect=JSON.stringify(result.destination).replace(/</g,"\\u003c");
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="robots" content="noindex,follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Usurper League">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${ogURL}">
<meta property="og:image" content="${escapeHTML(imgURL.toString())}">
<meta property="og:image:secure_url" content="${escapeHTML(imgURL.toString())}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escapeHTML(result.champion)} top your ${escapeHTML(result.season)} Premier League. The Usurper League.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${escapeHTML(imgURL.toString())}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>body{background:#102e25;color:#f5eeda;font:18px/1.5 Georgia,serif;
margin:0;padding:15vh 20px;text-align:center}h1{font-size:clamp(28px,6vw,50px)}a{color:#ddbd74}</style>
<script>location.replace(${redirect});</script></head><body>
<h1>${escapeHTML(result.champion)} lead your league.</h1>
<p>Nothing invented. Except the trophy.</p>
<p><a href="${target}">Open this alternative Premier League →</a></p>
</body></html>`;
}
export async function readAsset(context,path) {
  const origin=new URL(context.request.url).origin;
  const response=await context.env.ASSETS.fetch(new Request(origin+path));
  if(!response.ok)throw Error("Source asset missing: "+path+" ("+response.status+")");
  return response.json();
}

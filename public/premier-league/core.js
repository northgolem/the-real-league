/* The Usurper League: reproducible calculations from actual finished matches.
   Pure math, no DOM and no artificial scores. Shared by current and archive views. */
(function(root) {
  "use strict";
  function compare(a,b) {
    return b.Pts-a.Pts || b.GD-a.GD || b.GF-a.GF ||
      a.name.localeCompare(b.name, "en");
  }
  function calculate(clubs, matches, exclusions) {
    if (!Array.isArray(clubs) || !Array.isArray(matches) || !Array.isArray(exclusions))
      throw Error("Expected clubs, matches and excluded club keys");
    if (clubs.length < 2 || clubs.length > 24) throw Error("Invalid club count");
    const entries=new Map();
    for(const team of clubs) {
      if (!team || (typeof team.id!=="string" && !Number.isInteger(team.id)) ||
          typeof team.name!=="string" || !team.name.trim() || entries.has(team.id))
        throw Error("Bad or duplicate club in source");
      entries.set(team.id, {id:team.id,name:team.name,P:0,W:0,D:0,L:0,GF:0,GA:0,GD:0,Pts:0});
    }
    const exclude=new Set(exclusions);
    const validNames=new Set(clubs.map(x=>x.name));
    for(const key of exclude) if(!validNames.has(key) && !clubs.some(x=>x.id===key))
      throw Error("Unknown excluded club: "+String(key));
    const seen=new Set();
    let kept=0, removed=0;
    for(const m of matches) {
      if (!Array.isArray(m) || m.length!==4) throw Error("Invalid fixture tuple");
      const [h,a,hg,ag]=m;
      if (!entries.has(h) || !entries.has(a) || h===a ||
          !Number.isInteger(hg) || !Number.isInteger(ag) || hg<0 || ag<0)
        throw Error("Unverified full-time result");
      const pair=String(h)+"|"+String(a);
      if(seen.has(pair)) throw Error("Duplicate Premier League fixture");
      seen.add(pair);
      const home=entries.get(h), away=entries.get(a);
      if(exclude.has(h) || exclude.has(a) || exclude.has(home.name) || exclude.has(away.name)) {
        removed++;
        continue;
      }
      kept++;
      home.P++; away.P++;
      home.GF+=hg;home.GA+=ag;away.GF+=ag;away.GA+=hg;
      if(hg>ag){home.W++;away.L++;home.Pts+=3}
      else if(hg<ag){away.W++;home.L++;away.Pts+=3}
      else {home.D++;away.D++;home.Pts++;away.Pts++}
    }
    const rows=[...entries.values()].filter(x=>!exclude.has(x.id)&&!exclude.has(x.name));
    rows.forEach(x=>x.GD=x.GF-x.GA);
    rows.sort(compare);
    rows.forEach((row,i)=>row.position=i+1);
    if(rows.reduce((sum,r)=>sum+r.P,0)!==2*kept) throw Error("Match accounting discrepancy");
    return {rows,kept,removed,total:matches.length,clubsRemaining:rows.length};
  }
  function parseArchive(data) {
    if(!data || !/^\d{4}-\d{2}$/.test(data.seasonId||"") || data.license!=="CC0-1.0" ||
       !Array.isArray(data.matches)) throw Error("Invalid historical fixture archive");
    const teams=new Set();
    for(const x of data.matches) {
      if(!Array.isArray(x) || x.length!==4 || typeof x[0]!=="string" || typeof x[1]!=="string")
        throw Error("Malformed historical match");
      teams.add(x[0]); teams.add(x[1]);
    }
    const clubs=[...teams].map(x=>({id:x,name:x}));
    const year=Number(data.seasonId.slice(0,4));
    const expected=year<=1994?22:20;
    if(clubs.length!==expected || data.matches.length!==expected*(expected-1))
      throw Error("Historical season is incomplete");
    const full=calculate(clubs,data.matches,[]);
    if(full.total!==expected*(expected-1)) throw Error("Missing historical fixtures");
    return {clubs,matches:data.matches,full};
  }
  function parseCurrent(data,official) {
    if(!data || data.competitionCode!=="PL" || data.source!=="football-data.org" ||
       !Array.isArray(data.clubs) || data.clubs.length!==20 || !Array.isArray(data.matches) ||
       !official || official.competitionCode!=="PL" || official.mode!=="live" ||
       data.season!==official.season || data.completedMatches!==data.matches.length ||
       data.completedMatches!==official.completedMatches)
      throw Error("Missing or stale verified current match feed");
    const full=calculate(data.clubs,data.matches,[]);
    if(full.rows.length!==20 || full.rows.some((r,i)=>{
      const row=official.officialTableApproximation[i];
      return !row || r.id!==row.id || ["P","W","D","L","GF","GA","GD","Pts"].some(k=>r[k]!==row[k]);
    })) throw Error("Current fixture results differ from verified source table");
    return {clubs:data.clubs,matches:data.matches,full};
  }
  function validateDefault(games,original,excludedNames) {
    const selected=excludedNames.filter(x=>games.clubs.some(c=>c.name===x));
    const result=calculate(games.clubs,games.matches,selected);
    if(!original || !Array.isArray(original.alternativeTable) ||
       result.rows.length!==original.alternativeTable.length ||
       result.kept!==original.includedMatches ||
       result.removed!==original.excludedMatches ||
       result.rows.some((row,i)=>{
         const expected=original.alternativeTable[i];
         return !expected || row.name!==expected.name ||
           ["P","W","D","L","GF","GA","GD","Pts"].some(k=>row[k]!==expected[k]);
       })) throw Error("Fixture source doesn't reproduce the published historical/default table");
    return result;
  }
  const api={calculate,parseArchive,parseCurrent,validateDefault};
  root.UsurperLeagueCore=api;
})(typeof window!=="undefined"?window:globalThis);

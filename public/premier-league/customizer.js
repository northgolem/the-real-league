/* The Usurper League — England: choose the guest list, choose a year, share a link.
   All standings are recalculated in your browser from authentic full-time scores. */
(() => {
  "use strict";
  const core = window.UsurperLeagueCore;
  const $ = id => document.getElementById(id);
  const cache = new Map();
  const badges = new Map();
  const state = { config:null, index:null, current:null, liveGames:null,
                  season:"", selected:new Set(), games:null, generation:0, tableMode:"custom" };
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const currentId = season => season.replace("/", "-");
  const names = () => state.config.excludedClubs.map(x=>x.name);
  const defaultSelected = () => new Set(names());
  const selectedNames = () => names().filter(n=>state.selected.has(n));
  const fullChoice = () => selectedNames().length===names().length;
  const seasonLabel = () => state.season===state.current.id ? state.current.data.season :
    (state.index.seasons.find(s=>s.id===state.season)?.label || state.season);

  async function json(path) {
    const res = await fetch(path, {cache:"no-store"});
    if(!res.ok) throw Error("Verified results not available ("+res.status+")");
    return res.json();
  }
  function fixtureSource(season) {
    if(season===state.current.id) {
      return Promise.all([
        json("/data/premier-league-matches.json"),
        Promise.resolve(state.current.data)
      ]).then(([games,tab])=>{
        const parsed=core.parseCurrent(games,tab);
        core.validateDefault(parsed,tab,names());
        return parsed;
      });
    }
    return Promise.all([
      json("/england/history/matches/"+season+".json"),
      json("/england/history/seasons/"+season+".json")
    ]).then(([games,tab])=>{
      if(games.seasonId!==season || tab.seasonId!==season)
        throw Error("Wrong historical season returned");
      const parsed=core.parseArchive(games);
      core.validateDefault(parsed,tab,names());
      return parsed;
    });
  }
  function urlChoice() {
    const params=new URLSearchParams(location.search);
    const allowed = new Set([state.current.id,...state.index.seasons.map(x=>x.id)]);
    const season=allowed.has(params.get("season"))?params.get("season"):state.current.id;
    const param=params.get("out");
    if(param===null) return {season, selected:defaultSelected()};
    if(param==="none") return {season,selected:new Set()};
    const bySlug=new Map(names().map(x=>[slug(x),x]));
    const tokens=param.split(",");
    if(!tokens.length || tokens.length>names().length || new Set(tokens).size!==tokens.length ||
       tokens.some(x=>!bySlug.has(x))) return {season,selected:defaultSelected()};
    return {season, selected:new Set(tokens.map(x=>bySlug.get(x)))};
  }
  function shareURL() {
    const url=new URL("/share/england",location.origin);
    if(state.season!==state.current.id) url.searchParams.set("season",state.season);
    if(!fullChoice()) {
      const chosen=selectedNames().map(slug);
      url.searchParams.set("out",chosen.length?chosen.join(","):"none");
    }
    return url.toString();
  }
  function updateURL() {
    const url=shareURL();
    history.replaceState(null,"","/england/"+new URL(url).search);
  }
  function setFeedback(message) { $("custom-feedback").textContent=message; }
  function tickedUI() {
    const labels=names();
    $("custom-count").textContent=state.selected.size+" selected to remove";
    $("no-big-six").setAttribute("aria-pressed",String(fullChoice()));
    $("all-teams").setAttribute("aria-pressed",String(state.selected.size===0));
    for(const input of $("custom-checks").querySelectorAll("input")) {
      const out=state.selected.has(input.value);
      input.checked=out;
      const badge=badges.get(input.value);
      if(badge) badge.textContent=out?"OUT":"IN";
    }
    const list=$("excluded-list");
    if(list) {
      list.replaceChildren();
      for(const n of selectedNames()) {
        const li=document.createElement("li");li.textContent=n;list.appendChild(li);
      }
      if(state.selected.size===0) {
        const li=document.createElement("li");li.textContent="Nobody. Everyone's invited.";list.appendChild(li);
      }
    }
    const remaining=state.games?.clubs.filter(c=>!state.selected.has(c.name)).length;
    $("england-opening").textContent=state.selected.size===0
      ? "Everyone is back in. You're seeing a table with no clubs removed."
      : fullChoice()
        ? "All "+labels.length+" are out by default. You can bring any of them back below."
        : "You're removing "+state.selected.size+" of the "+labels.length+" clubs. Change the selection below.";
    // The core explanation above must stay the same as people change selections:
    // only real results between remaining teams count, whichever clubs they choose.
    $("excluded-joke").textContent=state.selected.has("Tottenham Hotspur")
      ? "Tottenham have been excused. Again. It's the principle of the thing."
      : "You've made your own rules. Arguments can begin whenever you're ready.";
    $("table-kicker").textContent=state.season===state.current.id?
      "CURRENT SEASON / YOUR PREMIER LEAGUE":"HISTORICAL SEASON / YOUR PREMIER LEAGUE";
    $("no-big-six").textContent="Kick out the "+state.config.exclusionLabel;
    $("table-heading").textContent=state.selected.size===0
      ? "All clubs included — the full results table"
      : "Your alternative Premier League table";
    if(Number.isInteger(remaining)) $("table-title").textContent=remaining+" clubs remain. Here's their league.";
    $("custom-share").disabled=!state.games;
    $("custom-native-share").disabled=!state.games;
    $("custom-table-mode").disabled=!state.games;
    $("full-table-mode").disabled=!state.games;
    $("mobile-show-table").disabled=!state.games;
    $("custom-table-mode").setAttribute("aria-pressed",String(state.tableMode==="custom"));
    $("full-table-mode").setAttribute("aria-pressed",String(state.tableMode==="full"));
    $("mobile-table-summary").textContent=Number.isInteger(remaining)
      ? remaining+" clubs left" : "Checking results…";
    $("custom-season").value=state.season;
    setFeedback(state.games?"Tick = OUT. Untick = IN. The table below updates instantly.":"Checking real match results…");
  }
  function tableCell(tr,value,heading=false) {
    const el=document.createElement(heading?"th":"td");
    el.textContent=String(value);
    if(heading)el.scope="row";
    tr.appendChild(el);return el;
  }
  function render() {
    tickedUI();
    if(!state.games) return;
    const survivors=state.games.clubs.filter(x=>!state.selected.has(x.name)).length;
    const excluded=selectedNames().filter(n=>state.games.clubs.some(x=>x.name===n));
    // Both versions use the same verified fixture file. The all-club
    // comparison is NOT passed off as the official Premier League table.
    const calculated=core.calculate(state.games.clubs,state.games.matches,excluded);
    const full=core.calculate(state.games.clubs,state.games.matches,[]);
    if(calculated.clubsRemaining!==survivors ||
       calculated.kept+calculated.removed!==state.games.matches.length ||
       full.kept!==state.games.matches.length || full.removed!==0)
      throw Error("Table comparison failed its verified fixture accounting check");
    const showingFull=state.tableMode==="full";
    const selected=showingFull?full:calculated;
    const rows=$("premier-rows");rows.replaceChildren();
    for(const team of selected.rows) {
      const tr=document.createElement("tr");
      tableCell(tr,team.position,true);tableCell(tr,team.name);tableCell(tr,team.P);
      for(const name of ["W","D","L"]) {
        const td=tableCell(tr,team[name]);td.classList.add("mobile-hide");
      }
      tableCell(tr,team.GD>0?"+"+team.GD:team.GD);
      tableCell(tr,team.Pts).classList.add("points");
      rows.appendChild(tr);
    }
    $("premier-standings").setAttribute("aria-label",showingFull
      ?"Calculated Premier League standings with all clubs, not an official table"
      :"Your alternative Premier League standings using verified match results");
    $("table-heading").textContent=showingFull
      ?"All clubs — our calculated comparison"
      :calculated.clubsRemaining+" clubs. Your alternative Premier League.";
    $("table-kicker").textContent=showingFull
      ?"COMPARISON / EVERY CLUB & COMPLETED MATCH"
      :(state.season===state.current.id?"CURRENT SEASON / YOUR PREMIER LEAGUE"
       :"HISTORICAL SEASON / YOUR PREMIER LEAGUE");
    const originalLeader=full.rows[0];
    const myLeader=calculated.rows[0];
    const leadsSame=originalLeader.name===myLeader.name;
    $("table-comparison").textContent=showingFull
      ? "All "+full.clubsRemaining+" clubs and "+full.kept+" finished matches. This is our points, goal-difference and goals-scored calculation — not an official league table."
      : excluded.length
        ? "Your leader: "+myLeader.name+". With everybody included: "+originalLeader.name+
          ". "+(leadsSame?"Same leader, different number of games.":"A different leader. That's the whole experiment.")+
          " Switch views to compare the same real results."
        : "No clubs excluded. Both views use exactly the same completed match results.";
    $("matches-kept").textContent=calculated.kept;
    $("matches-removed").textContent=calculated.removed;
    $("clubs-left").textContent=calculated.clubsRemaining;
    $("match-info").textContent=showingFull
      ? "All "+full.kept+" finished games count in this comparison. Your excluded-club choices are still saved above — switch to My league to see them applied."
      : excluded.length
        ? calculated.kept+" real, completed matches between the clubs still in your league. "+
          calculated.removed+" matches involving excluded clubs have been removed for BOTH teams."
        : "No clubs removed. All "+calculated.kept+" completed matches count; no scores or points have been altered.";
    $("results-status").textContent="Verified full-time results · independent calculation";
    $("results-updated").textContent=seasonLabel()+
      (state.season===state.current.id?" · current season (not live scores)":" · complete historical season");
    $("story-title").textContent=myLeader.name+" are top. Well, well.";
    const out=selectedNames();
    const sentence=out.length?"I kicked out "+out.join(", ")+".":"I let all the clubs play.";
    $("share-pitch").textContent="CHALLENGE YOUR MATES: "+myLeader.name+
      " lead my "+seasonLabel()+" Premier League on "+myLeader.Pts+" points. "+
      sentence+" Could you do better?";
    $("story-copy").textContent=myLeader.name+" lead your "+seasonLabel()+" league with "+
      myLeader.Pts+" points from "+myLeader.P+" games. You've kept "+calculated.clubsRemaining+
      " clubs and removed "+calculated.removed+" actual fixtures. The trophy, regrettably, is imaginary.";
    $("table-title").textContent=calculated.clubsRemaining+" clubs remain. Here's their league.";
    $("custom-table-mode").setAttribute("aria-pressed",String(!showingFull));
    $("full-table-mode").setAttribute("aria-pressed",String(showingFull));
  }

  function fail(message) {
    $("premier-rows").replaceChildren();
    $("results-status").textContent="This season's results could not be verified";
    $("results-updated").textContent="No imaginary scores will be displayed";
    $("matches-kept").textContent="—";$("matches-removed").textContent="—";
    $("story-title").textContent="We're not inventing a table.";
    $("story-copy").textContent="The match feed needs checking before a personalised league can be calculated.";
    $("custom-share").disabled=true;
    $("custom-native-share").disabled=true;
    $("custom-table-mode").disabled=true;
    $("full-table-mode").disabled=true;
    $("mobile-show-table").disabled=true;
    setFeedback(message);
  }
  async function selectSeason(season,replaceURL) {
    state.season=season;state.games=null;state.tableMode="custom";
    const generation=++state.generation;
    $("custom-season").value=season;
    tickedUI();
    $("premier-rows").replaceChildren();
    $("results-status").textContent="Checking "+seasonLabel()+" results…";
    if(replaceURL)updateURL();
    try{
      if(!cache.has(season))cache.set(season,fixtureSource(season).catch(err=>{
        cache.delete(season);throw err;
      }));
      const games=await cache.get(season);
      if(generation!==state.generation)return;
      state.games=games;
      render();
    }catch(e){
      if(generation!==state.generation)return;
      fail("Results unavailable for "+seasonLabel()+". Please try another season.");
    }
  }
  function changedSelection(next) {
    state.selected=next;
    state.tableMode="custom";
    updateURL();
    try {render()} catch(e){fail("Couldn't verify this combination. Please choose another season.");}
  }
  function makeInputs() {
    const dest=$("custom-checks");
    dest.replaceChildren();
    for(const club of state.config.excludedClubs) {
      const lbl=document.createElement("label");
      lbl.className="club-switch";
      const input=document.createElement("input");
      input.type="checkbox";input.value=club.name;input.checked=true;
      input.addEventListener("change",()=>{
        const next=new Set(state.selected);
        if(input.checked)next.add(club.name);else next.delete(club.name);
        changedSelection(next);
      });
      const name=document.createElement("span");name.textContent=club.name;
      const status=document.createElement("span");status.className="club-state";
      status.textContent="OUT";badges.set(club.name,status);
      lbl.appendChild(input);lbl.appendChild(name);lbl.appendChild(status);dest.appendChild(lbl);
    }
    $("custom-clubs").disabled=false;
    $("no-big-six").disabled=false;
    $("all-teams").disabled=false;
  }
  async function init() {
    try {
      const [config,index,live]=await Promise.all([
        json("/config/england.json"),json("/england/history/index.json"),
        json("/data/premier-league.json")
      ]);
      if(!config?.excludedClubs?.length || !Array.isArray(index.seasons) ||
          index.seasons.length<34 || live.mode!=="live" || live.competitionCode!=="PL" ||
          live.exclusionGroup!==config.exclusionLabel ||
          live.excludedIds.join(",")!==config.excludedClubs.map(x=>x.id).sort((a,b)=>a-b).join(",") ||
          index.excluded.join(",")!==config.excludedClubs.map(x=>x.name).join(","))
        throw Error("Mismatch between source archive and editorial rules");
      state.config=config;state.index=index;
      state.current={id:currentId(live.season),data:live};
      const picker=$("custom-season");
      picker.replaceChildren();
      const liveOption=document.createElement("option");liveOption.value=state.current.id;
      liveOption.textContent=live.season+" · Current season";picker.appendChild(liveOption);
      for(const season of index.seasons){
        const option=document.createElement("option");
        option.value=season.id;option.textContent=season.label;picker.appendChild(option);
      }
      picker.disabled=false;
      makeInputs();
      const initial=urlChoice();state.selected=initial.selected;
      picker.addEventListener("change",()=>selectSeason(picker.value,true));
      $("no-big-six").addEventListener("click",()=>changedSelection(defaultSelected()));
      $("all-teams").addEventListener("click",()=>changedSelection(new Set()));
      $("custom-table-mode").addEventListener("click",()=>{
        if(!state.games)return;
        state.tableMode="custom";render();
      });
      $("full-table-mode").addEventListener("click",()=>{
        if(!state.games)return;
        state.tableMode="full";render();
      });
      $("mobile-show-table").addEventListener("click",()=>{
        if(!state.games)return;
        $("premier-table").scrollIntoView?.({behavior:"smooth",block:"start"});
        // Let keyboard users read the newly reached table heading.
        $("table-heading").focus?.({preventScroll:true});
      });
      $("custom-share").addEventListener("click",async()=>{
        const url=shareURL();
        try {
          if(navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
            setFeedback("Challenge link copied. Pick a football friend who'll disagree.");
          } else {
            setFeedback("Copy this challenge link: "+url);
          }
        } catch(_) {setFeedback("Copy this challenge link: "+url);}
      });
      $("custom-native-share").addEventListener("click",async()=>{
        const url=shareURL();
        const leader=state.games?core.calculate(state.games.clubs,state.games.matches,
          selectedNames().filter(n=>state.games.clubs.some(c=>c.name===n))).rows[0]:null;
        if(!leader)return;
        try {
          if(navigator.share){
            await navigator.share({
              title:leader.name+" top my "+seasonLabel()+" Premier League | The Usurper League",
              text:"Who would you kick out? I've made my own Premier League. Beat my table.",
              url
            });
          } else if(navigator.clipboard?.writeText){
            await navigator.clipboard.writeText(url);
            setFeedback("Challenge link copied. Paste it into your football group.");
          } else setFeedback("Your challenge URL: "+url);
        } catch(e) {
          if(e?.name!=="AbortError")setFeedback("Share couldn't open. Try Copy Link instead.");
        }
      });
      window.addEventListener("popstate",()=>{
        const next=urlChoice();state.selected=next.selected;
        selectSeason(next.season,false);
      });
      await selectSeason(initial.season,false);
    } catch(e) {
      fail("The verified match archives couldn't be loaded. Please refresh later.");
      $("custom-season").disabled=true;
      $("custom-clubs").disabled=true;
    }
  }
  if(!core) {fail("The calculator is currently unavailable.");return}
  init();
})();

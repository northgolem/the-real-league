/* The Usurper League — England: choose the guest list, choose a year, share a link.
   All standings are recalculated in your browser from authentic full-time scores. */
(() => {
  "use strict";
  const core = window.UsurperLeagueCore;
  const $ = id => document.getElementById(id);
  const cache = new Map();
  const state = { config:null, index:null, current:null, liveGames:null,
                  season:"", selected:new Set(), games:null, generation:0 };
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
    const url=new URL("/england/",location.origin);
    if(state.season!==state.current.id) url.searchParams.set("season",state.season);
    if(!fullChoice()) {
      const chosen=selectedNames().map(slug);
      url.searchParams.set("out",chosen.length?chosen.join(","):"none");
    }
    return url.toString();
  }
  function updateURL() {
    const url=shareURL();
    history.replaceState(null,"",new URL(url).pathname+new URL(url).search);
  }
  function setFeedback(message) { $("custom-feedback").textContent=message; }
  function tickedUI() {
    const labels=names();
    $("custom-count").textContent=state.selected.size+" out";
    $("no-big-six").setAttribute("aria-pressed",String(fullChoice()));
    $("all-teams").setAttribute("aria-pressed",String(state.selected.size===0));
    for(const input of $("custom-checks").querySelectorAll("input")) {
      input.checked=state.selected.has(input.value);
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
    const label=selectedNames().length===labels.length ? state.config.exclusionLabel :
      state.selected.size ? "your selection" : "nobody";
    $("england-opening").textContent=state.selected.size===0
      ? "Very generous. You've let everybody back in."
      : "Yes, yes. They're terribly important. We've all noticed.";
    $("england-method").textContent=state.selected.size
      ? "You're excluding "+selectedNames().join(", ")+". All their matches, goals and points disappear. The rest are real results."
      : "Nobody is excluded. All completed Premier League matches count.";
    $("excluded-joke").textContent=state.selected.has("Tottenham Hotspur")
      ? "Tottenham have been excused. Again. It's the principle of the thing."
      : "You've made your own rules. Arguments can begin whenever you're ready.";
    $("table-kicker").textContent=state.season===state.current.id?
      "CURRENT SEASON / YOUR PREMIER LEAGUE":"HISTORICAL SEASON / YOUR PREMIER LEAGUE";
    $("no-big-six").textContent="Kick out the "+state.config.exclusionLabel;
    $("table-heading").textContent=state.selected.size===0?"Everybody's invited.":
      fullChoice()?"No "+state.config.exclusionLabel+". No problem.":"Your league. Your exclusions.";
    if(Number.isInteger(remaining)) $("table-title").textContent=remaining+" clubs. An actual title race.";
    $("custom-share").disabled=!state.games;
    $("custom-season").value=state.season;
    setFeedback(state.games?"Tick a club to change the table. Copy the link to start an argument.":"Checking real match results…");
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
    const calculated=core.calculate(state.games.clubs,state.games.matches,excluded);
    if(calculated.clubsRemaining!==survivors ||
        calculated.kept+calculated.removed!==state.games.matches.length)
      throw Error("Personalised table failed its fixture accounting check");
    const rows=$("premier-rows");rows.replaceChildren();
    for(const team of calculated.rows) {
      const tr=document.createElement("tr");
      tableCell(tr,team.position,true);tableCell(tr,team.name);tableCell(tr,team.P);
      for(const name of ["W","D","L"]){
        const td=tableCell(tr,team[name]);td.classList.add("mobile-hide");
      }
      tableCell(tr,team.GD>0?"+"+team.GD:team.GD);
      tableCell(tr,team.Pts).classList.add("points");
      rows.appendChild(tr);
    }
    const leader=calculated.rows[0];
    $("matches-kept").textContent=calculated.kept;
    $("matches-removed").textContent=calculated.removed;
    $("clubs-left").textContent=calculated.clubsRemaining;
    $("match-info").textContent=calculated.kept+" finished fixtures count. "+
      calculated.removed+" finished fixtures removed. No reallocated points.";
    $("results-status").textContent="Verified full-time results · personalised table";
    $("results-updated").textContent=seasonLabel()+
      (state.season===state.current.id?" · current season (not live scores)":" · complete historical season");
    $("story-title").textContent=leader.name+" are top. Well, well.";
    $("story-copy").textContent=leader.name+" lead your "+seasonLabel()+" league with "+
      leader.Pts+" points from "+leader.P+" games. You've kept "+calculated.clubsRemaining+
      " clubs and removed "+calculated.removed+" actual fixtures. The trophy, regrettably, is imaginary.";
    $("table-title").textContent=calculated.clubsRemaining+" clubs. An actual title race.";
  }
  function fail(message) {
    $("premier-rows").replaceChildren();
    $("results-status").textContent="This season's results could not be verified";
    $("results-updated").textContent="No imaginary scores will be displayed";
    $("matches-kept").textContent="—";$("matches-removed").textContent="—";
    $("story-title").textContent="We're not inventing a table.";
    $("story-copy").textContent="The match feed needs checking before a personalised league can be calculated.";
    $("custom-share").disabled=true;
    setFeedback(message);
  }
  async function selectSeason(season,replaceURL) {
    state.season=season;state.games=null;
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
      lbl.appendChild(input);lbl.appendChild(name);dest.appendChild(lbl);
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
          index.seasons.length!==34 || live.mode!=="live" || live.competitionCode!=="PL" ||
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
      $("custom-share").addEventListener("click",async()=>{
        const url=shareURL();
        try {
          if(navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
            setFeedback("Link copied. Now send it to someone who disagrees.");
          } else {
            setFeedback("Copy this URL from your address bar: "+url);
          }
        } catch(_) {setFeedback("Copy this URL from your address bar: "+url);}
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

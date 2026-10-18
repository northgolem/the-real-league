/* The Other Premier League — independent current-season table.
   Uses only validated match totals produced from football-data.org.
   No external code, team crests, synthetic data or marketing cookies. */
(() => {
  "use strict";
  let configuration = null;
  const excludedIds = () => configuration ? configuration.excludedClubs.map(x=>x.id).sort((a,b)=>a-b) : [];
  const label = () => configuration?.exclusionLabel || "excluded clubs";
  const $ = id => document.getElementById(id);
  let result = null;
  let selected = "alternative";
  const keys = ["position", "name", "P", "W", "D", "L", "GD", "Pts"];

  function correctData(data) {
    if (!configuration || !data || data.mode !== "live" || data.competitionCode !== "PL" || data.exclusionGroup !== label())
      return false;
    if (!Array.isArray(data.excludedIds) ||
        data.excludedIds.length !== excludedIds().length ||
        !excludedIds().every((id, i) => data.excludedIds[i] === id)) return false;
    if (!Array.isArray(data.alternativeTable) || data.alternativeTable.length !== 20-excludedIds().length ||
        !Array.isArray(data.officialTableApproximation) || data.officialTableApproximation.length !== 20)
      return false;
    if (![data.includedMatches, data.excludedMatches, data.completedMatches].every(Number.isInteger)
        || data.includedMatches < 0 || data.excludedMatches < 0 ||
        data.includedMatches + data.excludedMatches !== data.completedMatches ||
        data.completedMatches === 0) return false;

    const full = new Map(data.officialTableApproximation.map(team => [team.id, team]));
    if (full.size !== 20 || excludedIds().some(id => !full.has(id))) return false;
    const rowsValid = rows => rows.every((team, i) =>
      Number.isInteger(team.id) && typeof team.name === "string" && team.name.trim().length > 0
      && team.name.length < 90
      && ["P","W","D","L","GF","GA","GD","Pts"].every(x=>Number.isInteger(team[x]))
      && team.P === team.W + team.D + team.L
      && team.Pts === 3 * team.W + team.D
      && team.GD === team.GF - team.GA
      && team.position === i + 1
      && (i === 0 || rows[i-1].Pts > team.Pts ||
          (rows[i-1].Pts === team.Pts && (rows[i-1].GD > team.GD ||
          (rows[i-1].GD === team.GD && rows[i-1].GF >= team.GF))))
    );
    if (!rowsValid(data.officialTableApproximation) || !rowsValid(data.alternativeTable)) return false;
    if (data.alternativeTable.some(team => excludedIds().includes(team.id) || !full.has(team.id))) return false;
    return true;
  }

  function cell(tr, text, header=false) {
    const td = document.createElement(header ? "th" : "td");
    td.textContent = String(text);
    if (header) td.scope = "row";
    tr.appendChild(td);
    return td;
  }
  function render() {
    const alt = selected === "alternative";
    $("no-big-six").setAttribute("aria-pressed", String(alt));
    $("all-teams").setAttribute("aria-pressed", String(!alt));
    $("table-heading").textContent = alt ? "No " + label() + ". No problem." : "The party they think we're missing.";
    $("table-kicker").textContent = alt ? "THE OTHER PREMIER LEAGUE" : "THE FULL-LEAGUE COMPARISON";
    const rows = $("premier-rows");
    rows.replaceChildren();
    if (!result) return;
    const table = alt ? result.alternativeTable : result.officialTableApproximation;
    for (const team of table) {
      const tr = document.createElement("tr");
      cell(tr, team.position, true);
      cell(tr, team.name);
      cell(tr, team.P);
      for (const name of ["W","D","L"]) {
        const td = cell(tr, team[name]);
        td.classList.add("mobile-hide");
      }
      cell(tr, team.GD > 0 ? "+" + team.GD : team.GD);
      cell(tr, team.Pts).classList.add("points");
      rows.appendChild(tr);
    }
    const heading = $("match-info");
    heading.textContent = alt ?
      result.includedMatches + " finished matches between the remaining " + result.alternativeTable.length + " clubs. Every " + label() + " fixture removed, including points and goals." :
      result.completedMatches + " finished matches. Our full-league calculation is shown for comparison, not as official Premier League standings.";
  }

  function show(data) {
    result = data;
    const season = typeof data.season === "string" ? data.season : "2026/27";
    $("results-status").textContent = "Verified match results · not live scores";
    let updated = "";
    const timestamp = Date.parse(data.generatedAt);
    if (Number.isFinite(timestamp))
      updated = new Date(timestamp).toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric"});
    $("results-updated").textContent = season + (updated ? " · checked " + updated : "");
    $("matches-kept").textContent = data.includedMatches;
    $("matches-removed").textContent = data.excludedMatches;
    $("clubs-left").textContent = data.alternativeTable.length;
    const lead = data.alternativeTable[0];
    $("story-title").textContent = lead.name + " are top. Well, well.";
    $("story-copy").textContent = "Remove every fixture involving the " + label() + " and " + lead.name +
      " lead the surviving table on " + lead.Pts + " points from " + lead.P +
      " matches. Nothing invented. The trophy, regrettably, is not real.";
    render();
  }

  function applyConfig(cfg) {
    if (!cfg || !Array.isArray(cfg.excludedClubs) || !cfg.excludedClubs.length ||
        !cfg.excludedClubs.every(c=>Number.isInteger(c.id)&&typeof c.name==="string"&&c.name.trim()) ||
        new Set(cfg.excludedClubs.map(x=>x.id)).size!==cfg.excludedClubs.length ||
        typeof cfg.exclusionLabel!=="string" || !cfg.exclusionLabel.trim())
      throw new Error("Invalid exclusion rules");
    configuration = cfg;
    const names=cfg.excludedClubs.map(x=>x.name);
    const list=$("excluded-list");
    if (list) {
      list.replaceChildren();
      for (const name of names) {
        const li=document.createElement("li");
        li.textContent=name;
        list.appendChild(li);
      }
    }
    $("no-big-six").textContent="No "+label();
    $("clubs-left").textContent=String(20-names.length);
    $("table-title").textContent=(20-names.length)+" clubs. An actual title race.";
    $("england-opening").textContent="Yes, yes. The "+label()+" are terribly important. We've all noticed.";
    $("england-method").textContent="We take every match involving the "+label()+" out of the Premier League — points, goals, the lot. The remaining "+(20-names.length)+" clubs keep their actual results. What happens next is entirely up to them.";
    $("excluded-joke").textContent=names.includes("Tottenham Hotspur")
      ? "Of course Tottenham are on the list. It's the principle of the thing."
      : "You're welcome to argue about the guest list. That's half the fun.";
    $("match-info").textContent="All finished Premier League matches involving "+names.join(", ")+" are excluded.";
  }

  $("no-big-six").addEventListener("click", () => { selected = "alternative"; render(); });
  $("all-teams").addEventListener("click", () => { selected = "original"; render(); });

  async function getJSON(path) {
    const response=await fetch(path,{cache:"no-store"});
    if (!response.ok) throw new Error("Missing "+path);
    return response.json();
  }
  Promise.all([getJSON("/config/england.json"),getJSON("/data/premier-league.json")])
    .then(([config,data]) => {
      applyConfig(config);
      if (!correctData(data)) throw new Error("Incomplete or inconsistent Premier League results");
      show(data);
    })
    .catch(() => {
      $("results-status").textContent = "Premier League results awaiting verification";
      $("results-updated").textContent = "No scores published until the match feed passes validation";
      $("story-title").textContent = "We refuse to invent the scores.";
      $("story-copy").textContent = "The excluded clubs are still excused. The standings will appear when the verified Premier League match results are ready.";
      $("match-info").textContent = "No unverified results will be shown here.";
    });
})();

/* The Other Premier League — independent current-season table.
   Uses only validated match totals produced from football-data.org.
   No external code, team crests, synthetic data or marketing cookies. */
(() => {
  "use strict";
  const BIG_SIX = [57, 61, 64, 65, 66, 73];
  const $ = id => document.getElementById(id);
  let result = null;
  let selected = "alternative";
  const keys = ["position", "name", "P", "W", "D", "L", "GD", "Pts"];

  function correctData(data) {
    if (!data || data.mode !== "live" || data.competitionCode !== "PL" || data.exclusionGroup !== "Big Six")
      return false;
    if (!Array.isArray(data.excludedIds) ||
        data.excludedIds.length !== BIG_SIX.length ||
        !BIG_SIX.every((id, i) => data.excludedIds[i] === id)) return false;
    if (!Array.isArray(data.alternativeTable) || data.alternativeTable.length !== 14 ||
        !Array.isArray(data.officialTableApproximation) || data.officialTableApproximation.length !== 20)
      return false;
    if (![data.includedMatches, data.excludedMatches, data.completedMatches].every(Number.isInteger)
        || data.includedMatches < 0 || data.excludedMatches < 0 ||
        data.includedMatches + data.excludedMatches !== data.completedMatches ||
        data.completedMatches === 0) return false;

    const full = new Map(data.officialTableApproximation.map(team => [team.id, team]));
    if (full.size !== 20 || BIG_SIX.some(id => !full.has(id))) return false;
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
    if (data.alternativeTable.some(team => BIG_SIX.includes(team.id) || !full.has(team.id))) return false;
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
    $("table-heading").textContent = alt ? "No Big Six. No problem." : "The party they think we're missing.";
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
      result.includedMatches + " finished matches between the remaining fourteen clubs. Every Big Six fixture removed, including points and goals." :
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
    $("story-copy").textContent = "Remove all six clubs' fixtures and " + lead.name +
      " lead the surviving table on " + lead.Pts + " points from " + lead.P +
      " matches. Nothing invented. Not even a Tottenham trophy joke.";
    render();
  }

  $("no-big-six").addEventListener("click", () => { selected = "alternative"; render(); });
  $("all-teams").addEventListener("click", () => { selected = "original"; render(); });

  fetch("/data/premier-league.json", {cache:"no-store"})
    .then(response => {
      if (!response.ok) throw new Error("Results feed unavailable");
      return response.json();
    })
    .then(data => {
      if (!correctData(data)) throw new Error("Incomplete or inconsistent Premier League results");
      show(data);
    })
    .catch(() => {
      $("results-status").textContent = "Premier League results awaiting verification";
      $("results-updated").textContent = "No scores published until the match feed passes validation";
      $("story-title").textContent = "We refuse to invent the scores.";
      $("story-copy").textContent = "The Big Six are still excused. The standings will appear when the verified Premier League match results are ready.";
      $("match-info").textContent = "No unverified results will be shown here.";
    });
})();

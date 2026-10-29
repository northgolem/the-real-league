/* Lightweight, no-fetch comparison for the 94 Spanish historical seasons.
 * Each table is baked from its own verified archive into the HTML at build time.
 * If JavaScript is unavailable the default Usurper League still displays. */
(() => {
  "use strict";
  const panel=document.querySelector(".season-table-panel");
  if(!panel) return;
  const choices=[...panel.querySelectorAll("[data-season-view]")];
  const alternative=document.getElementById("spanish-usurper-table");
  const everyone=document.getElementById("spanish-everyone-table");
  const heading=document.getElementById("our-table");
  const description=document.getElementById("season-view-explainer");
  if(choices.length!==2||!alternative||!everyone||!heading||!description)return;
  const altHeading=heading.textContent;
  const originalTable=alternative.querySelector("table");
  const allTable=everyone.querySelector("table");
  if(!originalTable||!allTable)return;
  function choose(view) {
    const withEveryone=view==="everyone";
    alternative.hidden=withEveryone;
    everyone.hidden=!withEveryone;
    for(const button of choices)button.setAttribute("aria-pressed",String(button.dataset.seasonView===view));
    heading.textContent=withEveryone?"All clubs. Our calculated comparison.":altHeading;
    description.textContent=withEveryone
      ?"All "+panel.dataset.fullClubs+" clubs and "+panel.dataset.fullMatches+
        " finished matches. Published historical final standings, independently verified against the complete fixture archive."
      :"Our alternative: "+panel.dataset.altClubs+" clubs, "+panel.dataset.altMatches+
        " completed fixtures. All "+panel.dataset.removed+
        " matches involving Madrid or Barça are removed for both teams.";
  }
  for(const button of choices){
    button.disabled=false;
    button.addEventListener("click",()=>choose(button.dataset.seasonView));
  }
  choose("usurper");
})();
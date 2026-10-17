/* Season picker: the live table and validated static historical seasons. */
(() => {
  'use strict';
  const LIVE = '2026-27';
  const params = new URLSearchParams(location.search);
  let desired = params.get('season') || LIVE;
  let liveData = null;
  let available = [{id:LIVE,label:'2026/27'}];
  let selected = LIVE;
  const $ = id => document.getElementById(id);
  const indexUrl = '/history/index.json';

  window.historySeasonSelected = LIVE;
  window.setCurrentSeasonData = function (current) {
    liveData = current;
    if (selected === LIVE) {
      data = current;
      render();
    }
  };

  function setMessage(value) {
    const status = $('season-alert');
    if (status) status.textContent = value || '';
  }
  function paintSelection() {
    document.querySelectorAll('.season-tab').forEach(tab => {
      const active = tab.dataset.season === selected;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    const active = document.querySelector('.season-tab.active');
    if (active) active.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
    const old = selected !== LIVE;
    const help = $('season-context');
    if (help) {
      if (old && data && data.mode === 'historical') {
        const spanish = document.documentElement.lang === 'es';
        help.textContent = (spanish ? 'Temporada completa · ' : 'Completed season · ')
          + data.pointsPerWin + (spanish ? ' puntos por victoria' : ' points per win')
          + (data.specialFormat ? (spanish ? ' · formato especial' : ' · special league format') : '');
      } else {
        help.textContent = document.documentElement.lang === 'es'
          ? 'Temporada en curso · actualización diaria'
          : 'Current season · updated daily';
      }
    }
  }
  window.refreshSeasonPickerLanguage = function () {
    paintSelection();
    document.querySelectorAll('.decade-button').forEach(button => {
      const decade = button.dataset.decade;
      button.textContent = document.documentElement.lang === 'es' ? 'Años '+decade : decade+'s';
    });
  };
  function setQuery(season) {
    const url = new URL(location.href);
    if (season === LIVE) url.searchParams.delete('season');
    else url.searchParams.set('season',season);
    history.pushState({season},'',url.pathname+url.search+url.hash);
  }
  async function choose(season, updateURL = true) {
    if (!available.some(row=>row.id===season)) return;
    selected = season;
    window.historySeasonSelected = season;
    if(updateURL) setQuery(season);
    paintSelection();
    setMessage('');
    if (season === LIVE) {
      if (liveData) {
        data = liveData;
        render();
        paintSelection();
        if (updateURL) $('league-table')?.scrollIntoView?.({behavior:'smooth',block:'start'});
      }
      return;
    }
    setMessage(document.documentElement.lang === 'es' ? 'Desenterrando la temporada…' : 'Digging out the season…');
    try {
      const response = await fetch('/history/'+encodeURIComponent(season)+'.json');
      if (!response.ok) throw new Error('HTTP '+response.status);
      const archive = await response.json();
      if (archive.seasonId !== season || archive.mode !== 'historical'
          || !Array.isArray(archive.alternativeTable) || !archive.alternativeTable.length)
        throw new Error('Invalid historical table');
      if (selected !== season) return;
      data = archive;
      if (window.normalizeClubNames) window.normalizeClubNames(data);
      render();
      paintSelection();
      setMessage('');
      if (updateURL) $('league-table')?.scrollIntoView?.({behavior:'smooth',block:'start'});
    } catch (error) {
      if (selected !== season) return;
      setMessage(document.documentElement.lang === 'es'
        ? 'Este año se nos resiste. Prueba otra vez.'
        : 'That season is being difficult. Try again.');
    }
  }

  function makeButton(season) {
    const button = document.createElement('button');
    button.type = 'button';
    button.role = 'tab';
    button.className = 'season-tab';
    button.dataset.season = season.id;
    button.textContent = season.label;
    button.setAttribute('aria-controls','league-table');
    button.addEventListener('click',()=>choose(season.id));
    return button;
  }
  function populate() {
    const strip = $('season-tabs');
    const decades = $('decade-links');
    if (!strip || !decades) return;
    strip.replaceChildren(...available.map(makeButton));
    const groups = [...new Set(available.map(row=>Math.floor(Number(row.id.slice(0,4))/10)*10))];
    decades.replaceChildren(...groups.map(decade=>{
      const button = document.createElement('button');
      button.type='button';
      button.className='decade-button';
      button.dataset.decade=String(decade);
      button.textContent=document.documentElement.lang === 'es' ? 'Años '+decade : decade+'s';
      button.addEventListener('click',()=>{
        const target=[...strip.children].find(tab=>Number(tab.dataset.season.slice(0,4))<decade+10 && Number(tab.dataset.season.slice(0,4))>=decade);
        if (target) target.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
      });
      return button;
    }));
    paintSelection();
  }
  const strip = $('season-tabs');
  if (strip) strip.addEventListener('keydown',e=>{
    if (!['ArrowLeft','ArrowRight'].includes(e.key)) return;
    const entries=[...strip.querySelectorAll('.season-tab')];
    const index=entries.findIndex(tab=>tab.dataset.season===selected);
    const offset=e.key==='ArrowRight'?1:-1;
    const next=entries[Math.max(0,Math.min(entries.length-1,index+offset))];
    if (next){e.preventDefault();next.focus();choose(next.dataset.season)}
  });
  $('season-left')?.addEventListener('click',()=>$('season-tabs')?.scrollBy({left:-380,behavior:'smooth'}));
  $('season-right')?.addEventListener('click',()=>$('season-tabs')?.scrollBy({left:380,behavior:'smooth'}));
  window.addEventListener('popstate',()=>{
    const newSeason=new URLSearchParams(location.search).get('season')||LIVE;
    choose(newSeason,false);
  });
  populate();
  fetch(indexUrl).then(r=>{
    if (!r.ok) throw Error('Historical index missing');
    return r.json();
  }).then(index=>{
    if (!Array.isArray(index.seasons) || !index.seasons.length) throw Error('Empty archive');
    available=[{id:LIVE,label:'2026/27'},...index.seasons];
    populate();
    if (available.some(row=>row.id===desired)) choose(desired,false);
    else setMessage(document.documentElement.lang==='es'
      ? 'Falta alguna temporada: preferimos un hueco a inventarnos resultados.'
      : "A few seasons are missing. We'd rather leave a gap than invent results.");
  }).catch(()=>{
    setMessage(document.documentElement.lang==='es'
      ? 'El archivo está descansando. Volveremos a probar.'
      : "The archive is having a day off. We'll try again.");
  });
})();

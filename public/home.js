/* Two-edition landing, with real match-data teasers only. No tracking, cookies or extra assets. */
(() => {
  'use strict';
  const strings = {
    en: {
      topSpain: 'Spain', topEngland: 'England', kicker:'NO GODS. JUST FOOTBALL.',
      title1:'Let the rich kids keep the sandpit.', title2:"We're having a league.",
      deck:"We rebuild football league tables using real results. Exclude the biggest clubs and every match they played, then see who comes out on top. Choose Spain or England to try it.",
      choose:'CHOOSE YOUR LEAGUE', spainTitle:'Spain', englandTitle:'England',
      spainSub:'No Madrid. No Barça.', englandSub:'Big Six? You decide who goes.',
      spainDesc:'We remove Real Madrid, Barcelona and every match involving either club. Then we recalculate La Liga using only the real results between the teams left — season by season.',
      englandDesc:'You choose which of the Big Six to kick out — any, all or none. We remove their matches and rebuild the Premier League table from real results. Every season since 1992/93.',
      label:'CURRENT ALTERNATIVE LEADERS', pending:'See the recalculated table →',
      leaders:(name,points)=>name+' · '+points+' pts',
      enterSpain:'SEE CURRENT SPAIN', enterEngland:'ENTER ENGLAND',
      historyIntro:'Looking for a particular old season?',
      historySpain:'Spain · 94 historical seasons ↗', historyEngland:'England · 34 historical seasons ↗',
      why:'Real matches. New league tables.',
      whyBody:'Exclude a club, and all its matches disappear — for both teams. No fantasy scores, no redistributed points. Only completed games between the remaining clubs count.',
      footer:'An independent football thought experiment. Unaffiliated with the leagues or clubs.',
      labels: ['THE USURPER LEAGUE / SPAIN','THE USURPER LEAGUE / ENGLAND']
    },
    es: {
      topSpain:'España',topEngland:'Inglaterra',kicker:'SIN DIOSES. SOLO FÚTBOL.',
      title1:'Que los niños ricos se queden con su patio.',title2:'Nosotros montamos nuestra liga.',
      deck:'Recalculamos las ligas utilizando resultados reales. Excluimos a los clubes más poderosos y todos sus partidos para descubrir quién termina arriba. Elige España o Inglaterra.',
      choose:'ELIGE TU LIGA',spainTitle:'España',englandTitle:'Inglaterra',
      spainSub:'Sin Madrid. Sin Barça.',englandSub:'¿Los seis grandes? Tú decides.',
      spainDesc:'Quitamos al Real Madrid, al Barcelona y todos sus partidos. Después recalculamos La Liga usando únicamente los resultados reales entre los demás equipos.',
      englandDesc:'Tú eliges cuáles de los seis grandes quedan fuera: algunos, todos o ninguno. Borramos sus partidos y recalculamos la Premier League con resultados reales desde 1992/93.',
      label:'LÍDERES DE LA TABLA ALTERNATIVA',pending:'Ver la clasificación →',
      leaders:(name,points)=>name+' · '+points+' puntos',
      enterSpain:'VER ESPAÑA ACTUAL',enterEngland:'ENTRAR A INGLATERRA',
      historyIntro:'¿Buscas una temporada antigua?',
      historySpain:'España · 94 temporadas históricas ↗',historyEngland:'Inglaterra · 34 temporadas históricas ↗',
      why:'Partidos reales. Una clasificación diferente.',
      whyBody:'Cuando excluyes a un club, desaparecen todos sus partidos, para ambos equipos. Sin marcadores inventados ni puntos redistribuidos: solo cuentan los partidos entre los clubes restantes.',
      footer:'Un experimento futbolístico independiente, sin relación con las ligas ni los clubes.',
      labels:['THE USURPER LEAGUE / ESPAÑA','THE USURPER LEAGUE / INGLATERRA']
    }
  };
  const $ = id => document.getElementById(id);
  const language = new URLSearchParams(location.search).get('lang') === 'es' ? 'es' : 'en';
  let activeLanguage = language;
  const leaders = { spain: null, england: null };
  let englandRules = null;
  function setText(id, text) { const el = $(id); if (el) el.textContent = text; }
  function languageToPage(lang) {
    activeLanguage = lang;
    document.documentElement.lang = lang;
    const t = strings[lang];
    const keys = ['kicker','title1','title2','deck','choose','spainTitle','englandTitle',
      'spainSub','englandSub','spainDesc','englandDesc','why','whyBody','footer'];
    for (const key of keys) setText(key,t[key]);
    setText('topSpain',t.topSpain); setText('topEngland',t.topEngland);
    setText('spain-label',t.labels[0]); setText('england-label',t.labels[1]);
    setText('spain-enter',t.enterSpain); setText('england-enter',t.enterEngland);
    setText('history-shortcut-intro',t.historyIntro);
    setText('history-shortcut-spain',t.historySpain);
    setText('history-shortcut-england',t.historyEngland);
    if (englandRules) {
      setText('englandSub',lang === 'es'
        ? '¿Quién queda fuera? Tú decides.'
        : 'Who gets kicked out? You decide.');
      if (englandRules.exclusionLabel !== 'Big Six') {
        setText('englandDesc',lang === 'es'
          ? 'Elige qué clubes excluir. Eliminamos todos sus partidos y recalculamos la clasificación con los resultados reales entre los demás equipos.'
          : 'Choose which clubs to exclude. We remove all their matches and recalculate the table from real results between the teams left.');
      }
    }
    document.querySelectorAll('.lang button').forEach(button => {
      button.setAttribute('aria-pressed',String(button.dataset.lang===lang));
    });
    $('spain-card').href = lang === 'es' ? '/spain/?lang=es' : '/spain/';
    $('top-spain-link').href = $('spain-card').href;
    for (const region of ['spain','england']) {
      const lead = leaders[region];
      setText(region+'-current',lead ? t.leaders(lead.name,lead.points) : t.pending);
      setText(region+'-now-label',t.label);
    }
  }
  document.querySelectorAll('.lang button').forEach(btn=>btn.addEventListener('click',()=>{
    const lang=btn.dataset.lang;
    const url=new URL(location.href);
    if (lang === 'en') url.searchParams.delete('lang'); else url.searchParams.set('lang',lang);
    history.replaceState(null,'',url.pathname+url.search+url.hash);
    languageToPage(lang);
  }));
  languageToPage(activeLanguage);

  function validLead(data, kind) {
    if (!data || data.mode !== 'live' ||
        !Array.isArray(data.alternativeTable) || data.alternativeTable.length !== (kind==='england'?(englandRules?20-englandRules.excludedClubs.length:-1):18) ||
        !Number.isInteger(data.completedMatches) || data.completedMatches<=0) return null;
    if (kind === 'england' && (!englandRules || data.competitionCode !== 'PL' ||
        data.exclusionGroup !== englandRules.exclusionLabel ||
        !Array.isArray(data.excludedIds) ||
        data.excludedIds.join(',') !== englandRules.excludedClubs.map(x=>x.id).sort((a,b)=>a-b).join(',')))
      return null;
    if (kind === 'spain' && !(Array.isArray(data.excluded) &&
        data.excluded.includes('Real Madrid') && data.excluded.includes('FC Barcelona'))) return null;
    const top=data.alternativeTable[0];
    if (!top || typeof top.name!=='string' || !top.name.trim() ||
        !Number.isInteger(top.Pts) || !Number.isInteger(top.P) || top.P<0 ||
        !Number.isInteger(top.position) || top.position!==1) return null;
    return {name:top.name,points:top.Pts};
  }
  async function load(region,path) {
    try {
      const response = await fetch(path,{cache:'no-store'});
      if (!response.ok) return;
      const data=await response.json();
      leaders[region]=validLead(data,region);
      languageToPage(activeLanguage);
    } catch (_) {
      // Quiet failure: no unverified scores on the homepage.
    }
  }
  load('spain','/data/standings.json');
  fetch('/config/england.json',{cache:'no-store'}).then(r=>{
    if(!r.ok) throw Error('England rules unavailable');
    return r.json();
  }).then(config=>{
    if(!Array.isArray(config.excludedClubs)||config.excludedClubs.length<1 ||
       typeof config.exclusionLabel!=='string') return;
    englandRules=config;
    languageToPage(activeLanguage);
    load('england','/data/premier-league.json');
  }).catch(()=>{ /* No unverified English leader without its exclusion rules. */ });
})();
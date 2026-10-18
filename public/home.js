/* Two-edition landing, with real match-data teasers only. No tracking, cookies or extra assets. */
(() => {
  'use strict';
  const strings = {
    en: {
      topSpain: 'Spain', topEngland: 'England', kicker:'NO GODS. JUST FOOTBALL.',
      title1:'Let the rich kids keep the sandpit.', title2:"We're having a league.",
      deck:"Football's usual winners have had plenty of fun. We've taken their fixtures away. Pick a country and see what happens when everyone else gets a turn.",
      choose:'CHOOSE YOUR LEAGUE', spainTitle:'Spain', englandTitle:'England',
      spainSub:'No Madrid. No Barça.', englandSub:'No Big Six. No problem.',
      spainDesc:'Yes, yes. They’re very good at football. We’ve noticed. The other clubs have a league to get on with — and almost a century of different champions.',
      englandDesc:'Six clubs can have their own private party. We’ve kept the matches between everyone else. Including, regrettably for them, no Tottenham.',
      label:'CURRENT ALTERNATIVE LEADERS', pending:'See the recalculated table →',
      leaders:(name,points)=>name+' · '+points+' pts',
      enterSpain:'ENTER SPAIN', enterEngland:'ENTER ENGLAND',
      why:'Same matches. Different title races.',
      whyBody:'No imaginary scores. No adjusted results. We simply remove every fixture involving the excluded clubs, recalculate the standings and let everyone else enjoy themselves.',
      footer:'An independent football thought experiment. Unaffiliated with the leagues or clubs.',
      labels: ['THE USURPER LEAGUE / SPAIN','THE USURPER LEAGUE / ENGLAND']
    },
    es: {
      topSpain:'España',topEngland:'Inglaterra',kicker:'SIN DIOSES. SOLO FÚTBOL.',
      title1:'Que los niños ricos se queden con su patio.',title2:'Nosotros montamos nuestra liga.',
      deck:'Los ganadores de siempre ya se han divertido bastante. Hemos quitado sus partidos. Elige país y descubre qué pasa cuando les toca a los demás.',
      choose:'ELIGE TU LIGA',spainTitle:'España',englandTitle:'Inglaterra',
      spainSub:'Sin Madrid. Sin Barça.',englandSub:'Sin los seis grandes. Sin problema.',
      spainDesc:'Sí, sí. Juegan muy bien. Ya nos hemos enterado. Ahora los demás tienen su propia liga y casi un siglo de campeones alternativos.',
      englandDesc:'Los seis grandes pueden celebrar su fiesta privada. Los otros clubes siguen jugando. Sin el Tottenham tampoco, por supuesto.',
      label:'LÍDERES DE LA TABLA ALTERNATIVA',pending:'Ver la clasificación →',
      leaders:(name,points)=>name+' · '+points+' puntos',
      enterSpain:'ENTRAR A ESPAÑA',enterEngland:'ENTRAR A INGLATERRA',
      why:'Los mismos partidos. Otra lucha por el título.',
      whyBody:'Ni un marcador inventado. Ni un resultado alterado. Quitamos todos los encuentros de los clubes excluidos, recalculamos la clasificación y dejamos que los demás disfruten.',
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
    if (englandRules) {
      setText('englandSub',lang === 'es'
        ? 'Sin los '+englandRules.exclusionLabel+'. Sin problema.'
        : 'No '+englandRules.exclusionLabel+'. No problem.');
      if (englandRules.exclusionLabel !== 'Big Six') {
        setText('englandDesc',lang === 'es'
          ? 'Los clubes excluidos pueden jugar en su propio patio. Los demás conservan sus resultados y tienen una liga de la que disfrutar.'
          : 'The excluded clubs can keep the VIP lounge. The rest keep their games, their goals and a title race worth playing.');
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
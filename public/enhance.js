/* The Usurper League: editorial voice and bilingual frontend. No external dependencies. */
(function () {
  'use strict';
  const translations = {
    en: {
      masthead: 'NO GODS. <span>JUST FOOTBALL.</span>',
      eyebrow: season => 'SPAIN / LA LIGA DE LOS MORTALES / ' + season,
      slogan1: 'Let the rich kids keep the sandpit.',
      heroTitle1: 'Same game.',
      heroTitle2: 'Different favourites.',
      navStandings: 'Spain · Standings', navEngland: 'England · Premier League', navArchive: 'The archive', navHow: 'How it works', heroCta: 'View the standings ↗',
      slogan2: 'We’re having a league.',
      intro: "Yes, yes. Real Madrid and Barcelona are very good at football. We've all noticed.",
      sandpit: 'They can go and play in their own sandpit.',
      method: "Meanwhile, we've removed every match involving either of them — points, goals, the lot — and given everyone else a chance to win something.",
      closer: 'Same football. Much more interesting.',
      left: 'clubs left',
      headingEyebrow: 'THE TABLE, RECONSIDERED',
      heading: 'Someone else gets a go.',
      noGiants: 'No Gods',
      allTeams: 'With Everyone',
      club: 'Club', played: 'P', gd: 'GD', pts: 'Pts', w: 'W', d: 'D', l: 'L',
      feedLive: 'Latest available results · not live scores',
      feedHistorical: 'A completed season · an entirely different outcome',
      archiveKicker: 'ALMOST A CENTURY OF ALTERNATIVE ENDINGS',
      archiveHeading: 'Apparently, other clubs can win things.',
      archiveAll: 'Explore the alternative champions & every historical table ↗',
      oldSeason: season => 'The ' + season + ' season · archives',
      oldHeadline: name => name + ' were champions. In this version.',
      oldStory: (leader, season, pts) => "Remove Madrid and Barça's fixtures from " + season + " and " + leader.name + " finish top on " + leader.Pts + " points. That's " + pts + " points per win, as the rules required. The scores are real. The trophy, regrettably, is not.",
      feedPreview: 'The results are having a moment',
      season: season => 'Season ' + season,
      updated: date => 'Results checked ' + date,
      counted: (count, alternative) => count + ' completed matches · ' + (alternative ? 'Madrid and Barça excused' : 'all clubs invited back'),
      waiting: "The table is waiting for the results feed. Even usurpers need data.",
      emptyHeading: "Nobody's won anything yet.",
      emptyBody: 'The table will appear when the results are in. We refuse to make up the scores.',
      footerNote: "This is our calculation, not LaLiga's official table. Ordered by points, goal difference and goals scored; official head-to-head rules and historic deductions are not modelled. Arrows compare with our full-table calculation. Data: ",
      weekly: 'THE LATEST UPSET (OF THE ESTABLISHED ORDER)',
      headline: name => name + ' lead. Well, well.',
      story: leader => "Remove every Madrid and Barça fixture and " + leader.name + " lead the rest on " + leader.Pts + " points from " + leader.P + " matches. No scores have been altered. That would be cheating.",
      defaultHeadline: 'The gods have been excused.',
      defaultStory: "The other clubs still have to play the football. We've simply taken the usual winners out of the equation.",
      matchesRemoved: 'Matches removed',
      removedText: 'Games involving either of the absent clubs. We checked twice.',
      insightsHeading: "Turns out they weren't essential.",
      raceTitle: 'A proper title race',
      raceSame: (names, pts) => names + ' · ' + pts + ' pts each. Awkward.',
      raceAlone: (club, lead) => club + ' · ' + lead + ' point' + (lead === 1 ? '' : 's') + ' clear',
      raceExplain: 'The top of the table. A pleasant change.',
      slayersTitle: 'Points we took away',
      slayersValue: pts => pts + ' points',
      slayersExplain: clubs => clubs + ' earned these against Madrid or Barça. Admirable, but they no longer count.',
      slayersNone: 'Nobody has taken points off those two yet. Do try.',
      reboundTitle: 'Goal difference restored',
      reboundExplain: clubs => clubs + ' gain the most goal difference once those matches vanish. A relief.',
      reboundNone: 'No goal difference has been rescued yet.',
      how: 'How we stole the league',
      rules: [
        ['Two clubs. One polite goodbye.', "Madrid and Barça sit this one out. The remaining clubs get a table of their own."],
        ['Their results go with them.', "Every match involving either side disappears: points, goals and games played. We're very thorough."],
        ['Then things get interesting.', "Everyone else keeps their real results. No invented scores. Just a different champion."]
      ],
      shareButton: 'Tell a fellow sufferer ↗',
      copyButton: 'Copy the evidence',
      share: leader => 'The Usurper League. The money clubs can sod off. We’re having a league. ' + (leader ? leader.name + ' lead on ' + leader.Pts + ' points. ' : '') + 'Same football. Much more interesting:',
      copied: 'Link copied. Carry on.',
      shareCopied: 'Evidence copied. Spread the word.',
      copyFallback: 'Copy the address from your browser. Old-fashioned, but effective.',
      shareError: 'Try copying the link instead.',
      resultsError: "The scores aren't available just now. Even revolutions have technical difficulties.",
      ruleKickers: ['01 / THE EXITS', '02 / THE ERASER', '03 / THE FUN'],
      footer: year => '© ' + year + ' The Usurper League · An independent exercise in footballing wishful thinking. Not affiliated with LaLiga or any club.'
    },
    es: {
      masthead: 'SIN DIOSES. <span>SOLO FÚTBOL.</span>',
      eyebrow: season => 'ESPAÑA / LA LIGA DE LOS MORTALES / ' + season,
      slogan1: 'Que los niños ricos se queden con su patio.',
      heroTitle1: 'El mismo fútbol.',
      heroTitle2: 'Otros favoritos.',
      navStandings: 'España · Clasificación', navEngland: 'Inglaterra · Premier League', navArchive: 'El archivo', navHow: 'Cómo funciona', heroCta: 'Ver la clasificación ↗',
      slogan2: 'Nosotros montamos nuestra liga.',
      intro: 'Sí, sí. El Real Madrid y el Barça juegan muy bien al fútbol. Ya nos hemos enterado.',
      sandpit: 'Que se vayan a jugar a su propio patio.',
      method: 'Mientras tanto, hemos quitado todos los partidos en los que participa cualquiera de los dos: puntos, goles, todo. Y los demás tienen una oportunidad de ganar algo.',
      closer: 'El mismo fútbol. Mucho más interesante.',
      left: 'clubes en juego',
      headingEyebrow: 'LA TABLA, CON UN PEQUEÑO CAMBIO',
      heading: 'Ahora les toca a los demás.',
      noGiants: 'Sin dioses',
      allTeams: 'Con todos',
      club: 'Equipo', played: 'PJ', gd: 'DG', pts: 'Pts', w: 'G', d: 'E', l: 'P',
      feedLive: 'Últimos resultados disponibles · no en directo',
      feedHistorical: 'Temporada completa · un desenlace bastante distinto',
      archiveKicker: 'CASI UN SIGLO DE FINALES ALTERNATIVOS',
      archiveHeading: 'Resulta que los demás también saben ganar.',
      archiveAll: 'Ver los campeones alternativos y todas las temporadas ↗',
      oldSeason: season => 'Temporada ' + season + ' · archivo',
      oldHeadline: name => name + ' fue campeón. Aquí, al menos.',
      oldStory: (leader, season, pts) => 'Si quitamos los partidos del Madrid y del Barça en ' + season + ', ' + leader.name + ' termina primero con ' + leader.Pts + ' puntos. ' + pts + ' puntos por victoria, como mandaba el reglamento. Los resultados son reales. La copa, por desgracia, no.',
      feedPreview: 'Esperando resultados. Pacientemente.',
      season: season => 'Temporada ' + season,
      updated: date => 'Resultados comprobados el ' + date,
      counted: (count, alternative) => count + ' partidos · ' + (alternative ? 'Madrid y Barça fuera' : 'todos invitados'),
      waiting: 'Esperamos los resultados. Hasta los usurpadores necesitan datos.',
      emptyHeading: 'Todavía no ha ganado nadie.',
      emptyBody: 'La clasificación aparecerá cuando lleguen los resultados. No pensamos inventarnos marcadores.',
      footerNote: 'Esta es nuestra clasificación, no la oficial de LaLiga. Ordenamos por puntos, diferencia de goles y goles a favor; no aplicamos todos los desempates oficiales ni sanciones históricas. Las flechas comparan con nuestra tabla completa. Datos: ',
      weekly: 'LA ÚLTIMA SORPRESA (PARA LOS DE SIEMPRE)',
      headline: name => name + ' manda. Vaya, vaya.',
      story: leader => 'Sin los partidos del Madrid ni del Barça, ' + leader.name + ' lidera con ' + leader.Pts + ' puntos en ' + leader.P + ' encuentros. No hemos cambiado un solo marcador. Eso sí sería hacer trampas.',
      defaultHeadline: 'Los dioses tienen el día libre.',
      defaultStory: 'Los demás siguen jugando los partidos. Solo hemos quitado a los ganadores habituales de la ecuación.',
      matchesRemoved: 'Partidos eliminados',
      removedText: 'Partidos contra los dos ausentes. Los hemos contado dos veces.',
      insightsHeading: 'Parece que no eran imprescindibles.',
      raceTitle: 'La lucha por el título',
      raceSame: (names, pts) => names + ' · ' + pts + ' puntos cada uno. Vaya lío.',
      raceAlone: (club, lead) => club + ' · ' + lead + ' punto' + (lead === 1 ? '' : 's') + ' de ventaja',
      raceExplain: 'Lo más alto de la tabla. Se agradece el cambio.',
      slayersTitle: 'Puntos que hemos borrado',
      slayersValue: pts => pts + ' puntos',
      slayersExplain: clubs => clubs + ' los consiguieron ante Madrid o Barça. Muy meritorio, pero aquí ya no cuentan.',
      slayersNone: 'Nadie ha puntuado ante esos dos. Por ahora.',
      reboundTitle: 'Diferencia de goles recuperada',
      reboundExplain: clubs => clubs + ' recupera más diferencia de goles sin esos partidos. Menos mal.',
      reboundNone: 'De momento, nadie ha recuperado diferencia de goles.',
      how: 'Cómo nos quedamos con la liga',
      rules: [
        ['Dos clubes. Hasta luego.', 'Madrid y Barça descansan. Los demás tienen una clasificación para ellos solos.'],
        ['Sus partidos se van con ellos.', 'Borramos cada encuentro contra cualquiera de los dos: puntos, goles y partidos jugados. Sin excepciones.'],
        ['Y empieza lo bueno.', 'Los demás resultados son reales. No inventamos nada. Salvo un campeón diferente.']
      ],
      shareButton: 'Compártelo con otro sufrido ↗',
      copyButton: 'Copiar la prueba',
      share: leader => 'The Usurper League. Que les den a los clubes millonarios. Nosotros montamos nuestra liga. ' + (leader ? leader.name + ' lidera con ' + leader.Pts + ' puntos. ' : '') + 'El mismo fútbol. Mucho más interesante:',
      copied: 'Enlace copiado. Seguimos.',
      shareCopied: 'Prueba copiada. Que corra la voz.',
      copyFallback: 'Copia la dirección del navegador. Funciona de toda la vida.',
      shareError: 'Prueba a copiar el enlace.',
      resultsError: 'Ahora mismo no hay resultados. Hasta las revoluciones tienen problemas técnicos.',
      ruleKickers: ['01 / LA SALIDA', '02 / LA GOMA DE BORRAR', '03 / LA DIVERSIÓN'],
      footer: year => '© ' + year + ' The Usurper League · Un experimento futbolístico con cierto optimismo. Sin relación con LaLiga ni con los clubes.'
    }
  };

  const params = new URLSearchParams(location.search);
  let language = params.get('lang') === 'es' || params.get('lang') === 'en'
    ? params.get('lang')
    : (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
  const $ = id => document.getElementById(id);
  const set = (selector, content) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = content;
  };
  const dateString = date => {
    if (!date || Number.isNaN(Date.parse(date))) return '';
    return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-GB',
      { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date));
  };
  const sign = value => (value > 0 ? '+' : '') + value;

  function normalizeClubNames(dataset) {
    if (!dataset || typeof dataset !== 'object') return;
    for (const table of [dataset.alternativeTable, dataset.officialTableApproximation]) {
      for (const club of table || []) {
        const preferredNames = {
          78: 'Atlético Madrid',
          77: 'Athletic Club',
          560: 'Deportivo La Coruña',
          558: 'Celta Vigo',
          5335: 'Racing Santander',
          81: 'FC Barcelona'
        };
        if (Object.prototype.hasOwnProperty.call(preferredNames, club.id)) {
          club.name = preferredNames[club.id];
        }
      }
    }
  }
  window.normalizeClubNames = normalizeClubNames;

  window.renderEnhancements = function (dataset, view) {
    normalizeClubNames(dataset);
    const tr = translations[language];
    const historical = dataset && dataset.mode === 'historical';
    const live = dataset && (dataset.mode === 'live' || historical);
    const alt = view !== 'original';
    const season = dataset && dataset.season || '2026/27';
    document.documentElement.lang = language;
    document.title = historical
      ? (language === 'es'
          ? 'La Liga ' + season + ' sin Madrid ni Barça | The Usurper League'
          : 'La Liga ' + season + ' Without Real Madrid & Barcelona | The Usurper League')
      : (language === 'es'
          ? 'La Liga sin Real Madrid ni Barcelona | The Usurper League'
          : 'La Liga Without Real Madrid & Barcelona | The Usurper League');
    const description = language === 'es'
      ? 'La Liga sin Real Madrid ni Barcelona. Clasificaciones recalculadas y casi un siglo de campeones alternativos. Fútbol real, distintos ganadores.'
      : 'La Liga without Real Madrid or Barcelona: recalculated standings and 94 seasons of alternative champions. Same matches, different winners.';
    for (const selector of ['meta[name="description"]','meta[property="og:description"]','meta[name="twitter:description"]']) {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', description);
    }
    document.querySelectorAll('.lang-button').forEach(button => {
      const active = button.dataset.lang === language;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const masthead = document.querySelector('.topright');
    if (masthead) masthead.innerHTML = tr.masthead;
    set('#competition-kicker', tr.eyebrow(season));
    set('#archive-all-link', tr.archiveAll);
    set('.hero-slogan .line1', tr.slogan1);
    set('.hero-headline-first', tr.heroTitle1);
    set('.hero-headline-second', tr.heroTitle2);
    set('#nav-standings', tr.navStandings);
    set('#nav-archive', tr.navArchive);
    set('#nav-england', tr.navEngland);
    set('#nav-how', tr.navHow);
    set('#hero-cta', tr.heroCta);
    set('#hero-about-link', tr.navHow);
    set('.hero-slogan .line2', tr.slogan2);
    set('.hero-explainer', tr.intro);
    set('.hero-sandpit', tr.sandpit);
    set('.hero-method', tr.method);
    set('.hero-closer', tr.closer);
    const remainingClubs = live ? dataset.alternativeTable.length : 18;
    set('.pillbar .pill:last-child', remainingClubs + ' ' + tr.left);
    set('.cardhead .eyebrow', tr.headingEyebrow);
    set('.cardhead h2', tr.heading);
    set('#alternative', tr.noGiants);
    set('#original', tr.allTeams);
    set('thead th:nth-child(2)', tr.club);
    set('thead th:nth-child(3)', tr.played);
    set('thead th:nth-child(4)', tr.w);
    set('thead th:nth-child(5)', tr.d);
    set('thead th:nth-child(6)', tr.l);
    set('thead th:nth-child(7)', tr.gd);
    set('thead th:nth-child(8)', tr.pts);
    set('#status', live ? (historical ? tr.feedHistorical : tr.feedLive) : tr.feedPreview);
    set('#updated', historical ? tr.oldSeason(season) : live ? tr.updated(dateString(dataset.generatedAt)) : tr.season(season));
    const total = live ? dataset.officialTableApproximation.length : 20;
    const effective = alt ? total - 2 : total;
    set('#matchinfo', live ?
      ((alt ? dataset.includedMatches : dataset.completedMatches)
       + (language === 'es' ? ' partidos · ' + effective + ' clubes' : ' matches · ' + effective + ' clubs')
       + (historical ? ' · ' + dataset.pointsPerWin + (language === 'es' ? ' puntos por victoria' : ' points per win') : ''))
      : tr.waiting);
    set('#empty strong', tr.emptyHeading);
    set('#empty p', tr.emptyBody);
    const footnote = document.getElementById('disclaimer');
    if (footnote) {
      footnote.textContent = tr.footerNote;
      const attribution = document.createElement('a');
      attribution.href = historical ? dataset.sourceUrl : 'https://www.football-data.org/';
      attribution.rel = 'noopener';
      attribution.textContent = historical ? dataset.source : 'football-data.org';
      footnote.append(attribution, '.');
      if (historical && dataset.historicalNote) {
        const note = dataset.seasonId === '1979-80'
          ? (language === 'es' ? '1979/80: un partido fue anulado y no figura en el archivo.' : dataset.historicalNote)
          : dataset.seasonId === '1986-87'
          ? (language === 'es' ? '1986/87: formato especial con una segunda fase.' : dataset.historicalNote)
          : dataset.historicalNote;
        footnote.append(' ' + note);
      }
      if (historical && dataset.seasonId === '2024-25') {
        const extra = document.createElement('a');
        extra.href = 'https://www.laliga.com/en-GB/laliga-easports/results/2024-25/gameweek-38';
        extra.rel = 'noopener';
        extra.textContent = language === 'es' ? 'Resultados de la última jornada: LaLiga' : 'Final matchday results: LaLiga';
        footnote.append(' · ',extra);
      }
    }
    set('.story .eyebrow', tr.weekly);
    set('.stats .eyebrow', tr.matchesRemoved);
    set('.stats .small', tr.removedText);
    set('.sectionhead h2', tr.how);
    document.querySelectorAll('.rule').forEach((el, index) => {
      setRule(el, tr.rules[index], tr.ruleKickers[index]);
    });
    set('#share', tr.shareButton);
    set('#copy', tr.copyButton);
    const footer = document.querySelector('footer .container span');
    if (footer) footer.textContent = tr.footer(String(new Date().getFullYear()));
    const footerSource = document.querySelector('footer .container span:last-child');
    if (footerSource) {
      // Keep the exact attribution required by football-data.org's terms.
      footerSource.textContent = 'Football data provided by the ';
      const sourceLink = document.createElement('a');
      sourceLink.href = 'https://www.football-data.org/';
      sourceLink.rel = 'noopener';
      sourceLink.textContent = 'Football-Data.org API';
      footerSource.append(sourceLink, '.');
      if (historical) {
        const archiveLink = document.createElement('a');
        archiveLink.href = dataset.sourceUrl;
        archiveLink.rel = 'noopener';
        archiveLink.textContent = dataset.source;
        footerSource.append(' · Historical results: ', archiveLink, '.');
      }
    }
    const leader = live && dataset.alternativeTable && dataset.alternativeTable[0];
    set('#headline', leader ? (historical ? tr.oldHeadline(leader.name) : tr.headline(leader.name)) : tr.defaultHeadline);
    set('#storytext', leader ? (historical ? tr.oldStory(leader,season,dataset.pointsPerWin) : tr.story(leader)) : tr.defaultStory);
    set('#archive-kicker', tr.archiveKicker);
    set('#archive-heading', tr.archiveHeading);
    if (typeof window.refreshSeasonPickerLanguage === 'function') window.refreshSeasonPickerLanguage();
    set('#insights-heading', tr.insightsHeading);
    set('#race-label', tr.raceTitle);
    set('#slayers-label', tr.slayersTitle);
    set('#rebound-label', tr.reboundTitle);
    if (!leader) {
      for (const id of ['race-value','slayers-value','rebound-value']) set('#'+id, '—');
      for (const id of ['race-explain','slayers-explain','rebound-explain']) set('#'+id, '');
      return;
    }
    const table = dataset.alternativeTable;
    const fullMap = new Map(dataset.officialTableApproximation.map(row => [row.id ?? row.name, row]));
    const leaders = table.filter(row => row.Pts === leader.Pts);
    const next = table.find(row => row.Pts < leader.Pts);
    set('#race-value', leaders.length > 1 ? leaders.map(row => row.name).join(' / ') : leader.name);
    set('#race-explain', leaders.length > 1
      ? tr.raceSame(leaders.length + (language === 'es' ? ' equipos' : ' clubs'), leader.Pts)
      : tr.raceAlone(leader.name, next ? leader.Pts - next.Pts : 0));
    const comparisons = table.map(row => {
      const full = fullMap.get(row.id ?? row.name);
      return { name: row.name, pointsRemoved: full ? full.Pts - row.Pts : 0, gdRecovered: full ? row.GD - full.GD : 0 };
    });
    const topPoints = Math.max(...comparisons.map(row => row.pointsRemoved));
    const earners = comparisons.filter(row => row.pointsRemoved === topPoints).map(row => row.name);
    set('#slayers-value', topPoints > 0 ? tr.slayersValue(topPoints) : '0');
    set('#slayers-explain', topPoints > 0 ? tr.slayersExplain(earners.join(' / ')) : tr.slayersNone);
    const topGD = Math.max(...comparisons.map(row => row.gdRecovered));
    const mostHelped = comparisons.filter(row => row.gdRecovered === topGD).map(row => row.name);
    set('#rebound-value', topGD > 0 ? sign(topGD) : '0');
    set('#rebound-explain', topGD > 0 ? tr.reboundExplain(mostHelped.join(' / ')) : tr.reboundNone);
  };

  function setRule(element, pair, kickerLabel) {
    if (!pair) return;
    const kicker = element.querySelector('span');
    if (kicker) kicker.textContent = kickerLabel;
    const bold = element.querySelector('b');
    const paragraph = element.querySelector('p');
    if (bold) bold.textContent = pair[0];
    if (paragraph) paragraph.textContent = pair[1];
  }

  window.getNotice = function (kind) {
    return translations[language][kind] || '';
  };

  window.getSharePayload = function () {
    const tr = translations[language];
    const leader = typeof data !== 'undefined' && (data?.mode === 'live' || data?.mode === 'historical') ? data.alternativeTable?.[0] : null;
    return {
      title: 'The Usurper League — ' + (typeof data !== 'undefined' && data?.season ? data.season : 'La Liga'),
      text: tr.share(leader),
      url: location.href
    };
  };

  document.querySelectorAll('.lang-button').forEach(button => {
    button.addEventListener('click', () => {
      language = button.dataset.lang;
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
      if (typeof render === 'function') render();
    });
  });
  // When the first fetch finishes, the regular render() invokes the enhancement above.
  if (typeof render === 'function') render();
})();
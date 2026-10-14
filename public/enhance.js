/* The Real League v1.1: bilingual editorial layer. No external dependencies. */
(function () {
  'use strict';
  const translations = {
    en: {
      masthead: 'NO GODS. <span>JUST FOOTBALL.</span>',
      eyebrow: season => 'Spain · ' + season + ' · The alternative table',
      pitch: "Real Madrid and Barcelona have had a decent run. We’ve removed every match involving either club — points, goals, the lot. The other 18 can get on with it.",
      left: '18 teams left',
      headingEyebrow: 'The standings',
      heading: 'The mortals get a turn.',
      noGiants: 'No Gods',
      allTeams: 'All Teams',
      club: 'Club', played: 'P', gd: 'GD', pts: 'Pts', w: 'W', d: 'D', l: 'L',
      feedLive: 'Results connected · delayed scores',
      feedPreview: 'Preview mode · waiting for results',
      season: season => 'Season ' + season,
      updated: date => 'Updated ' + date,
      counted: (count, alternative) => count + ' completed matches · ' + (alternative ? 'Madrid and Barça excluded' : 'all 20 clubs included'),
      waiting: 'The table recalculates automatically once a results feed is connected.',
      emptyHeading: 'The mortals are warming up.',
      emptyBody: 'Live standings will appear after the results feed has completed its first update.',
      footerNote: 'Provisional order uses points, goal difference and goals scored rather than the league’s head-to-head tiebreakers. Arrows compare with our calculated full table. Source: ',
      weekly: 'As things stand',
      headline: name => name + ' are top. For now.',
      story: leader => 'Remove every match involving Madrid or Barça, and ' + leader.name + ' lead with ' + leader.Pts + ' points from ' + leader.P + ' matches. No scores have been invented.',
      defaultHeadline: 'The gods can sit this one out.',
      defaultStory: "Their matches don’t count here. Everyone else’s do. That’s the whole trick.",
      matchesRemoved: 'Matches removed',
      removedText: 'Completed fixtures involving Real Madrid or Barcelona that no longer count.',
      insightsHeading: 'Life without the gods',
      raceTitle: 'The title race',
      raceSame: (names, pts) => names + ' · level on ' + pts + ' pts',
      raceAlone: (club, lead) => club + ' · ' + lead + ' point' + (lead === 1 ? '' : 's') + ' clear',
      raceExplain: 'Lead at the top of the alternative standings',
      slayersTitle: 'Points quietly erased',
      slayersValue: (pts) => pts + ' points',
      slayersExplain: (clubs) => clubs + ' earned them against Madrid or Barça. We’ve removed them.',
      slayersNone: 'Nobody has taken points off either club. Yet.',
      reboundTitle: 'Goal difference restored',
      reboundExplain: club => club + ' benefit most when results against Madrid and Barça disappear',
      reboundNone: 'Nobody has recovered goal difference. Yet.',
      how: 'How does it work?',
      rules: [
        ['The gods sit this one out.', 'Madrid and Barcelona don’t appear in the table. The other 18 clubs do.'],
        ['And so do their matches.', 'Every match involving either club goes: points, goals and games played. No selective memory.'],
        ['The mortals carry on.', 'Only matches between the remaining clubs count. Same results, different table.']
      ],
      shareButton: 'Share the table ↗',
      copyButton: 'Copy link',
      share: leader => 'La Liga without Madrid and Barça. Don’t worry, we’ve only removed them from the table. ' + (leader ? leader.name + ' lead on ' + leader.Pts + ' points. ' : '') + 'See for yourself:',
      copied: 'Link copied.',
      shareCopied: 'Share text copied.',
      copyFallback: 'Copy the address from your browser.',
      shareError: 'You can copy the link instead.',
      resultsError: 'Results unavailable for now. The gods may have interfered.',
      ruleKickers: ['01 / THE GODS', '02 / THE MATCHES', '03 / THE TABLE'],
      footer: year => '© ' + year + ' The Real League · Independent football experiment, not affiliated with LaLiga or any club.'
    },
    es: {
      masthead: 'SIN DIOSES. <span>SOLO FÚTBOL.</span>',
      eyebrow: season => 'España · ' + season + ' · La clasificación alternativa',
      pitch: 'El Real Madrid y el Barça ya han tenido una buena racha. Hemos borrado todos sus partidos: puntos, goles y todo lo demás. A ver qué hacen los otros 18.',
      left: '18 equipos',
      headingEyebrow: 'La clasificación',
      heading: 'Les toca a los mortales.',
      noGiants: 'Sin dioses',
      allTeams: 'Todos',
      club: 'Equipo', played: 'PJ', gd: 'DG', pts: 'Pts', w: 'G', d: 'E', l: 'P',
      feedLive: 'Resultados conectados · marcadores con retraso',
      feedPreview: 'Vista previa · esperando resultados',
      season: season => 'Temporada ' + season,
      updated: date => 'Actualizado el ' + date,
      counted: (count, alternative) => count + ' partidos disputados · ' + (alternative ? 'sin Madrid ni Barça' : 'con los 20 clubes'),
      waiting: 'La clasificación se actualiza automáticamente al recibir nuevos resultados.',
      emptyHeading: 'Los mortales están calentando.',
      emptyBody: 'La clasificación aparecerá cuando termine la primera actualización de los resultados.',
      footerNote: 'Orden provisional por puntos, diferencia de goles y goles a favor, sin aplicar todos los criterios de desempate oficiales. Las flechas comparan con nuestra tabla completa calculada. Fuente: ',
      weekly: 'Así están las cosas',
      headline: name => name + ' manda. De momento.',
      story: leader => 'Sin los partidos del Madrid ni del Barça, ' + leader.name + ' lidera con ' + leader.Pts + ' puntos en ' + leader.P + ' encuentros. No hemos inventado ningún marcador.',
      defaultHeadline: 'Hoy descansan los dioses.',
      defaultStory: 'Sus partidos no cuentan aquí. Los de los demás, sí. No tiene más misterio.',
      matchesRemoved: 'Partidos eliminados',
      removedText: 'Partidos disputados contra el Real Madrid o el Barcelona que ya no cuentan.',
      insightsHeading: 'La vida sin los dioses',
      raceTitle: 'La lucha por el título',
      raceSame: (names, pts) => names + ' · empatados a ' + pts + ' puntos',
      raceAlone: (club, lead) => club + ' · ventaja de ' + lead + ' punto' + (lead === 1 ? '' : 's'),
      raceExplain: 'Así está la cabeza de la clasificación alternativa',
      slayersTitle: 'Puntos discretamente borrados',
      slayersValue: pts => pts + ' puntos',
      slayersExplain: clubs => clubs + ' los consiguieron ante Madrid o Barça. Aquí no cuentan.',
      slayersNone: 'Nadie ha puntuado ante esos dos clubes. De momento.',
      reboundTitle: 'Diferencia de goles recuperada',
      reboundExplain: club => club + ' mejora más su diferencia de goles al borrar los partidos contra Madrid y Barça',
      reboundNone: 'De momento, nadie recupera diferencia de goles.',
      how: '¿Cómo funciona?',
      rules: [
        ['Los dioses se quedan fuera.', 'Madrid y Barça no aparecen en esta tabla. Los otros 18, sí.'],
        ['Y sus partidos también.', 'Se eliminan todos sus encuentros: puntos, goles y partidos jugados. Sin excepciones.'],
        ['Los mortales siguen.', 'Solo cuentan los partidos entre los otros clubes. Los mismos resultados, otra clasificación.']
      ],
      shareButton: 'Compartir la tabla ↗',
      copyButton: 'Copiar enlace',
      share: leader => 'La Liga sin Madrid ni Barça. Tranquilos, solo los hemos borrado de la tabla. ' + (leader ? leader.name + ' lidera con ' + leader.Pts + ' puntos. ' : '') + 'Aquí está:',
      copied: 'Enlace copiado.',
      shareCopied: 'Texto para compartir copiado.',
      copyFallback: 'Copia la dirección del navegador.',
      shareError: 'Puedes copiar el enlace.',
      resultsError: 'No hay resultados por ahora. Puede que los dioses hayan intervenido.',
      ruleKickers: ['01 / LOS DIOSES', '02 / LOS PARTIDOS', '03 / LA TABLA'],
      footer: year => '© ' + year + ' The Real League · Experimento futbolístico independiente, sin relación con LaLiga ni con los clubes.'
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
        if (club.id === 78) club.name = 'Atlético Madrid';
      }
    }
  }
  window.normalizeClubNames = normalizeClubNames;

  window.renderEnhancements = function (dataset, view) {
    normalizeClubNames(dataset);
    const tr = translations[language];
    const live = dataset && dataset.mode === 'live';
    const alt = view !== 'original';
    const season = dataset && dataset.season || '2026/27';
    document.documentElement.lang = language;
    document.title = 'La Liga de los Mortales | The Real League';
    const description = language === 'es'
      ? 'La Liga sin Real Madrid ni Barcelona. Los mismos resultados, menos dioses. Clasificación actualizada automáticamente.'
      : 'La Liga without Real Madrid and Barcelona. Same results, fewer gods. Standings updated automatically.';
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
    set('.hero .eyebrow', tr.eyebrow(season));
    set('.hero p', tr.pitch);
    set('.pillbar .pill:last-child', tr.left);
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
    set('#status', live ? tr.feedLive : tr.feedPreview);
    set('#updated', live ? tr.updated(dateString(dataset.generatedAt)) : tr.season(season));
    set('#matchinfo', live ? tr.counted(alt ? dataset.includedMatches : dataset.completedMatches, alt) : tr.waiting);
    set('#empty strong', tr.emptyHeading);
    set('#empty p', tr.emptyBody);
    const footnote = document.getElementById('disclaimer');
    if (footnote) {
      footnote.textContent = tr.footerNote;
      const attribution = document.createElement('a');
      attribution.href = 'https://www.football-data.org/';
      attribution.rel = 'noopener';
      attribution.textContent = 'football-data.org';
      footnote.append(attribution, '.');
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
    const leader = live && dataset.alternativeTable && dataset.alternativeTable[0];
    set('#headline', leader ? tr.headline(leader.name) : tr.defaultHeadline);
    set('#storytext', leader ? tr.story(leader) : tr.defaultStory);
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
    const fullMap = new Map(dataset.officialTableApproximation.map(row => [row.id, row]));
    const leaders = table.filter(row => row.Pts === leader.Pts);
    const next = table.find(row => row.Pts < leader.Pts);
    set('#race-value', leaders.length > 1 ? leaders.map(row => row.name).join(' / ') : leader.name);
    set('#race-explain', leaders.length > 1
      ? tr.raceSame(leaders.length + (language === 'es' ? ' equipos' : ' clubs'), leader.Pts)
      : tr.raceAlone(leader.name, next ? leader.Pts - next.Pts : 0));
    const comparisons = table.map(row => {
      const full = fullMap.get(row.id);
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
    const leader = typeof data !== 'undefined' && data?.mode === 'live' ? data.alternativeTable?.[0] : null;
    return {
      title: 'La Liga de los Mortales — The Real League',
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
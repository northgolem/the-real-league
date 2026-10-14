/* The Real League v1.1: bilingual editorial layer. No external dependencies. */
(function () {
  'use strict';
  const translations = {
    en: {
      masthead: 'NO GIANTS. <span>JUST FOOTBALL.</span>',
      eyebrow: season => 'Spain · ' + season + ' · The alternative table',
      pitch: "What would Spanish football look like if Real Madrid and Barcelona didn't exist? We removed every match they played. This is everyone else's league.",
      left: '18 teams left',
      headingEyebrow: 'The standings',
      heading: 'Everyone else can win.',
      noGiants: 'No Giants',
      allTeams: 'All Teams',
      w: 'W', d: 'D', l: 'L',
      feedLive: 'Results connected · delayed scores',
      feedPreview: 'Preview mode · waiting for results',
      season: season => 'Season ' + season,
      updated: date => 'Updated ' + date,
      counted: (count, alternative) => count + ' completed matches counted · ' + (alternative ? 'Real Madrid and Barcelona excluded' : 'All 20 clubs included'),
      waiting: 'The table recalculates automatically once a results feed is connected.',
      emptyHeading: 'A different champion is coming.',
      emptyBody: 'Live standings will appear after the results feed has completed its first update.',
      footerNote: 'Provisional order uses points, goal difference and goals scored rather than the league’s head-to-head tiebreakers. Arrows compare with our calculated full table. Source: ',
      weekly: 'The weekly story',
      headline: name => name + ' lead the Mortals.',
      story: leader => 'With every Madrid and Barcelona fixture removed, ' + leader.name + ' top the alternative table on ' + leader.Pts + ' points from ' + leader.P + ' matches.',
      defaultHeadline: 'A league without its biggest two.',
      defaultStory: "Who would come out on top if the rest of Spain played only each other? We'll follow the standings throughout the season.",
      matchesRemoved: 'Matches removed',
      removedText: 'Completed fixtures involving Real Madrid or Barcelona that no longer count.',
      insightsHeading: 'What changes without the giants?',
      raceTitle: 'The title race',
      raceSame: (names, pts) => names + ' · level on ' + pts + ' pts',
      raceAlone: (club, lead) => club + ' · ' + lead + ' point' + (lead === 1 ? '' : 's') + ' clear',
      raceExplain: 'Lead at the top of the alternative standings',
      slayersTitle: 'Points wiped out',
      slayersValue: (pts) => pts + ' points',
      slayersExplain: (clubs) => clubs + ' earned these against Madrid or Barça — their points no longer count here',
      slayersNone: 'No club has taken points off either giant yet',
      reboundTitle: 'Biggest GD recovery',
      reboundExplain: club => club + ' improve their goal difference most after deleting results against the giants',
      reboundNone: 'No club has recovered goal difference yet',
      how: 'How does it work?',
      rules: [
        ['Madrid and Barça are out.', 'Real Madrid and FC Barcelona do not appear in our standings. The other 18 clubs remain.'],
        ['Their results disappear too.', 'Every match involving either excluded club is deleted — not just points, but goals and matches played.'],
        ['Same football. New champion.', 'All other matches count normally. We recalculate the table after each update.']
      ],
      shareButton: 'Share the alternative league ↗',
      copyButton: 'Copy link',
      share: leader => 'La Liga without Real Madrid or Barça. ' + (leader ? leader.name + ' lead on ' + leader.Pts + ' points. ' : '') + 'See the alternative table:',
      copied: 'Link copied.',
      shareCopied: 'Share text copied.',
      copyFallback: 'Copy the address from your browser.',
      footer: year => '© ' + year + ' The Real League · Independent football experiment, not affiliated with LaLiga or any club.'
    },
    es: {
      masthead: 'SIN GIGANTES. <span>SOLO FÚTBOL.</span>',
      eyebrow: season => 'España · ' + season + ' · La clasificación alternativa',
      pitch: '¿Cómo sería La Liga sin el Real Madrid y el Barcelona? Hemos eliminado todos sus partidos, incluidos puntos y goles. Esta es la liga de los demás.',
      left: '18 equipos',
      headingEyebrow: 'La clasificación',
      heading: 'Aquí todos pueden ganar.',
      noGiants: 'Sin gigantes',
      allTeams: 'Todos',
      w: 'G', d: 'E', l: 'P',
      feedLive: 'Resultados conectados · marcadores con retraso',
      feedPreview: 'Vista previa · esperando resultados',
      season: season => 'Temporada ' + season,
      updated: date => 'Actualizado el ' + date,
      counted: (count, alternative) => count + ' partidos disputados · ' + (alternative ? 'sin Madrid ni Barça' : 'incluidos los 20 equipos'),
      waiting: 'La clasificación se actualiza automáticamente al recibir nuevos resultados.',
      emptyHeading: 'Pronto habrá otro campeón.',
      emptyBody: 'La clasificación aparecerá cuando termine la primera actualización de los resultados.',
      footerNote: 'Orden provisional por puntos, diferencia de goles y goles a favor, sin aplicar todos los criterios de desempate oficiales. Las flechas comparan con nuestra tabla completa calculada. Fuente: ',
      weekly: 'La historia de la semana',
      headline: name => 'El líder de los Mortales: ' + name + '.',
      story: leader => 'Al eliminar todos los partidos del Madrid y el Barça, ' + leader.name + ' encabeza la clasificación alternativa con ' + leader.Pts + ' puntos en ' + leader.P + ' partidos.',
      defaultHeadline: 'Una liga sin sus dos gigantes.',
      defaultStory: '¿Quién mandaría si el resto de España solo jugara entre sí? Seguiremos esta clasificación durante toda la temporada.',
      matchesRemoved: 'Partidos eliminados',
      removedText: 'Partidos disputados contra el Real Madrid o el Barcelona que ya no cuentan.',
      insightsHeading: '¿Qué cambia sin los gigantes?',
      raceTitle: 'La lucha por el título',
      raceSame: (names, pts) => names + ' · empatados a ' + pts + ' puntos',
      raceAlone: (club, lead) => club + ' · ventaja de ' + lead + ' punto' + (lead === 1 ? '' : 's'),
      raceExplain: 'Así está la cabeza de la clasificación alternativa',
      slayersTitle: 'Puntos que desaparecen',
      slayersValue: pts => pts + ' puntos',
      slayersExplain: clubs => clubs + ' los consiguieron ante Madrid o Barça; ahora se descuentan',
      slayersNone: 'Nadie ha puntuado ante los gigantes todavía',
      reboundTitle: 'Mayor mejora de diferencia de goles',
      reboundExplain: club => club + ' recupera más diferencia de goles al quitar sus partidos contra los gigantes',
      reboundNone: 'Nadie ha mejorado aún su diferencia de goles',
      how: '¿Cómo funciona?',
      rules: [
        ['Madrid y Barça quedan fuera.', 'Ni el Real Madrid ni el FC Barcelona aparecen en esta clasificación. Quedan otros 18 equipos.'],
        ['Sus partidos también desaparecen.', 'Se eliminan todos sus encuentros: puntos, goles y partidos jugados.'],
        ['Mismo fútbol, otro campeón.', 'Los demás encuentros siguen contando. Recalculamos la tabla tras cada actualización.']
      ],
      shareButton: 'Compartir esta liga ↗',
      copyButton: 'Copiar enlace',
      share: leader => 'La Liga sin el Madrid ni el Barça. ' + (leader ? leader.name + ' lidera con ' + leader.Pts + ' puntos. ' : '') + 'Mira la clasificación:',
      copied: 'Enlace copiado.',
      shareCopied: 'Texto para compartir copiado.',
      copyFallback: 'Copia la dirección del navegador.',
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

  window.renderEnhancements = function (dataset, view) {
    const tr = translations[language];
    const live = dataset && dataset.mode === 'live';
    const alt = view !== 'original';
    const season = dataset && dataset.season || '2026/27';
    document.documentElement.lang = language;
    document.title = 'La Liga de los Mortales | The Real League';
    const description = language === 'es'
      ? 'La clasificación de La Liga sin el Real Madrid y el Barcelona: todos sus partidos, puntos y goles desaparecen. Datos actualizados automáticamente.'
      : 'The alternative La Liga table without Real Madrid and Barcelona. Every match, point and goal involving the giants is removed. Updated automatically.';
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
    set('thead th:nth-child(4)', tr.w);
    set('thead th:nth-child(5)', tr.d);
    set('thead th:nth-child(6)', tr.l);
    set('#status', live ? tr.feedLive : tr.feedPreview);
    set('#updated', live ? tr.updated(dateString(dataset.latestResultAt || dataset.generatedAt)) : tr.season(season));
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
      setRule(el, tr.rules[index]);
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

  function setRule(element, pair) {
    if (!pair) return;
    const bold = element.querySelector('b');
    const paragraph = element.querySelector('p');
    if (bold) bold.textContent = pair[0];
    if (paragraph) paragraph.textContent = pair[1];
  }

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
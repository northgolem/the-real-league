#!/usr/bin/env python3
"""Genuine Spanish-language La Liga archive pages, built from the same verified data.

Never translate score data or recalculate a different classification for Spanish.
The two language editions have equal statistics and separate, permanent URLs.
"""
from collections import Counter
from html import escape
import json
from pathlib import Path
from season_story import season_facts
from verified_spain import verified_final_table

BASE = "https://usurperleague.com"
ROOT = Path(__file__).resolve().parents[1] / "public"
DEST = ROOT / "es" / "la-liga"


def e(value):
    return escape(str(value), quote=True)


def persist(path, body):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists() or path.read_text(encoding="utf8") != body:
        path.write_text(body, encoding="utf8")


def chrome(title, description, english_path, spanish_path, content, *, compare=False):
    canonical = BASE + spanish_path
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#102e25">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<title>{e(title)}</title>
<meta name="description" content="{e(description)}">
<link rel="canonical" href="{e(canonical)}">
<link rel="alternate" hreflang="es" href="{e(canonical)}">
<link rel="alternate" hreflang="en" href="{e(BASE + english_path)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="The Usurper League">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{e(canonical)}">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="/archive.css">
<style>.archive-language{{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700}}.archive-language a{{padding:6px 9px;border:1px solid currentColor;border-radius:6px;text-decoration:none}}.archive-language a[aria-current="true"]{{background:#d8c38d;color:#172f28;border-color:#d8c38d}}.header-flex{{flex-wrap:wrap}}</style>
{'<script defer src="/la-liga/season-compare.js"></script>' if compare else ''}
</head>
<body>
<header class="site-header"><div class="page-width header-flex">
  <a class="site-brand" href="/"><img src="/favicon.svg" width="35" height="35" alt=""> THE USURPER LEAGUE</a>
  <nav aria-label="Navegación"><a href="/">Inicio</a><a href="/spain/?lang=es">España</a><a href="/england/">Inglaterra</a><a href="/es/la-liga/">El archivo</a></nav>
  <div class="archive-language" role="group" aria-label="Idioma">
    <a href="{e(english_path)}" lang="en" aria-label="View in English">EN</a>
    <a href="{e(spanish_path)}" lang="es" aria-current="true" aria-label="Ver en español">ES</a>
  </div>
</div></header>
<main class="page-width">{content}</main>
<footer class="footer"><div class="page-width footer-grid">
  <span><b>The Usurper League.</b> Que los clubes ricos jueguen por su cuenta. Nosotros tenemos otra liga.</span>
  <span>Un experimento independiente de fútbol, sin afiliación con LaLiga ni sus clubes. Las fuentes y limitaciones aparecen junto a las tablas.</span>
</div></footer>
</body>
</html>
"""


def table(rows, heading):
    headings = ["#", "Equipo", "PJ", "G", "E", "P", "DG", "Pts"]
    body = []
    for row in rows:
        diff = f"+{row['GD']}" if row["GD"] > 0 else str(row["GD"])
        values = [row["position"], row["name"], row["P"], row["W"], row["D"],
                  row["L"], diff, row["Pts"]]
        cells = "".join(f'<th scope="row">{e(v)}</th>' if i == 0 else f'<td>{e(v)}</td>'
                        for i, v in enumerate(values))
        body.append(f'<tr{" class=champion" if row["position"] == 1 else ""}>{cells}</tr>')
    return ('<div class="table-scroll"><table aria-label="' + e(heading) +
            '"><thead><tr>' + "".join(f'<th scope="col">{x}</th>' for x in headings) +
            '</tr></thead><tbody>' + "".join(body) + '</tbody></table></div>')


def season_page(data, previous, following):
    sid, label = data["seasonId"], data["season"]
    facts = season_facts(data)
    ref = verified_final_table(data)
    real = ref["table"] if ref else None
    champ, runner = facts["winner"], facts["runner"]
    gap = facts["margin"]
    excluded = facts["removed"]
    kept = facts["kept"]
    total = data["completedMatches"]
    esc = lambda name: e(name)
    if real:
        leader = real[0]
        old = next(row for row in real if row["name"] == champ["name"])
        full_card = (f'<div class="duel-card"><span class="kicker">LIGA REAL / CLASIFICACIÓN FINAL VERIFICADA</span>'
                     f'<strong>{esc(leader["name"])}</strong><span>{leader["Pts"]} puntos · {leader["P"]} partidos</span></div>')
        comparison = (f'<strong>{esc(leader["name"])}</strong> encabezó la clasificación final '
                      f'publicada. Sin Madrid, Barça ni sus partidos, <strong>{esc(champ["name"])}</strong> '
                      'lidera nuestra liga alternativa.') if leader["name"] != champ["name"] else (
                        f'<strong>{esc(champ["name"])}</strong> también encabezó la clasificación publicada. '
                        'Cambiamos las reglas, pero no inventamos un ganador diferente.')
        winner_story = (
            f'<strong>{esc(champ["name"])}</strong> acabó en el puesto {old["position"]} '
            f'de la clasificación oficial, con {old["Pts"]} puntos. '
            f'Al quitar los partidos contra Madrid y Barça, suma {champ["Pts"]} '
            f'puntos en {champ["P"]} partidos. Nadie recibe puntos regalados.')
        switches = (
            '<div class="season-table-switch" role="group" aria-label="Comparar clasificaciones">'
            '<button type="button" data-season-view="usurper" aria-controls="spanish-usurper-table" aria-pressed="true" disabled>Sin Madrid ni Barça</button>'
            '<button type="button" data-season-view="everyone" aria-controls="spanish-everyone-table" aria-pressed="false" disabled>Con todos</button></div>')
        full_html = (
            '<div class="season-table-view" id="spanish-everyone-table" hidden>' +
            table(real, f"Clasificación final publicada de La Liga {label}") + '</div>')
        real_source = (
            f'<p>Clasificación final publicada: <a href="{e(ref["sourceUrl"])}" rel="noopener noreferrer">'
            'RSSSF</a>, fuente histórica independiente de LaLiga. '
            'Todos los equipos y sus estadísticas se han comprobado con los resultados archivados.</p>')
        caveat = ('«Con todos» reproduce el orden final publicado, incluidos los posibles '
                  'ajustes de puntos. La clasificación de Usurper es un cálculo alternativo independiente.')
    else:
        full_card = ('<div class="duel-card"><span class="kicker">LIGA COMPLETA</span>'
                     '<strong>En verificación</strong><span>No publicamos una clasificación sin comprobar.</span></div>')
        comparison = ('Todavía no hemos verificado la clasificación completa de esta temporada. '
                      'No vamos a fingir que conocemos el orden definitivo.')
        winner_story = (f'<strong>{esc(champ["name"])}</strong> consigue {champ["Pts"]} puntos '
                        f'en {champ["P"]} partidos en nuestra liga alternativa.')
        switches = ('<p class="unverified-full-note" role="status"><strong>Con todos: '
                    'todavía sin verificar.</strong> Ocultamos la tabla completa '
                    'hasta poder confirmar su clasificación real.</p>')
        full_html = ''
        real_source = '<p>La clasificación completa publicada aún no ha superado nuestra verificación independiente.</p>'
        caveat = 'Solo mostramos la clasificación alternativa verificada con resultados reales.'
    if gap:
        race = (f'<strong>{esc(champ["name"])}</strong> termina con {champ["Pts"]} puntos, '
                f'{gap} por delante de <strong>{esc(runner["name"])}</strong> '
                f'({runner["Pts"]}). Todos los resultados son reales.')
    else:
        race = (f'<strong>{esc(champ["name"])}</strong> y <strong>{esc(runner["name"])}</strong> '
                f'empatan a {champ["Pts"]} puntos. El desempate de nuestra liga se resuelve '
                'con la diferencia de goles y después los goles marcados.')
    movement = facts["biggest_gain"]
    if movement:
        gain, team, before, after = movement
        moved = (f'<strong>{esc(team["name"])}</strong> es quien más sube entre los '
                 f'equipos que quedan: del puesto {before} al {after} '
                 f'({gain} {"puesto" if gain == 1 else "puestos"}). '
                 'La comparación solo tiene en cuenta a los equipos supervivientes.')
    else:
        moved = ('El orden de los equipos supervivientes no cambia, aunque sí los puntos '
                 'y los partidos. No todas las revoluciones necesitan un giro de guion.')
    nav = (
        f'<a href="/es/la-liga/{e(previous)}/">← {previous.replace("-", "/")}</a>' if previous else '<span></span>'
    ) + '<a href="/es/la-liga/">Todas las temporadas ↑</a>' + (
        f'<a href="/es/la-liga/{e(following)}/">{following.replace("-", "/")} →</a>' if following else '<span></span>'
    )
    historic_note = (
        '<aside class="notice"><strong>Nota histórica:</strong> Esta temporada tuvo '
        'particularidades en el formato o las normas. Los resultados y las reglas '
        'de puntos originales se mantienen en nuestro archivo.</aside>'
        if data.get("historicalNote") else ''
    )
    body = f"""
<div class="breadcrumbs"><a href="/">Inicio</a> / <a href="/spain/?lang=es">España</a> / <a href="/es/la-liga/">Archivo de La Liga</a> / {e(label)}</div>
<section class="page-hero season-story-hero">
  <div class="kicker">THE USURPER LEAGUE / ESPAÑA / {e(label)} / NO ES LA CLASIFICACIÓN OFICIAL</div>
  <h1>La Liga {e(label)}.<br><em>Sin Madrid ni Barça.</em></h1>
  <p class="season-rule"><strong>La idea:</strong> quitamos al Real Madrid, al Barcelona <em>y todos los partidos que jugaron</em>. Recalculamos la clasificación únicamente con los resultados reales entre los demás. Sin victorias inventadas ni puntos regalados.</p>
  <p class="standfirst"><strong>{esc(champ["name"])}</strong> gana nuestra liga alternativa de <strong>{e(label)}</strong> con <strong>{champ["Pts"]} puntos</strong>. <strong>{esc(runner["name"])}</strong> acaba segundo con {runner["Pts"]}. No es un título oficial: es otra manera de contar los mismos partidos.</p>
  <div class="season-duel" aria-label="Comparación entre la liga real y la alternativa">
    {full_card}
    <div class="duel-card alternative"><span class="kicker">SIN MADRID NI BARÇA / NUESTRO CAMPEÓN</span><strong>{esc(champ["name"])}</strong><span>{champ["Pts"]} puntos · {champ["P"]} partidos</span></div>
  </div>
  <p class="duel-note">Las dos tablas cuentan un número distinto de partidos; compara las posiciones, no los puntos como si fueran la misma competición.</p>
  <p class="season-result"><strong>{'Un campeón diferente.' if real and real[0]["name"] != champ["name"] else 'Mismo líder, otra liga.' if real else 'Nuestra liga alternativa ya está lista.'}</strong> {comparison}</p>
  <a class="primary-link" href="#our-table">Ver la clasificación recalculada ↓</a>
  <div class="facts">
    <div><span>Nuestro campeón</span><strong>{esc(champ["name"])}</strong></div>
    <div><span>Puntos</span><strong>{champ["Pts"]}</strong></div>
    <div><span>Partidos incluidos</span><strong>{kept}</strong></div>
    <div><span>Puntos por victoria</span><strong>{data["pointsPerWin"]}</strong></div>
  </div>
</section>
<section class="panel season-table-panel" aria-labelledby="our-table" data-alt-clubs="{facts["number_remaining"]}" data-alt-matches="{kept}" data-removed="{excluded}" data-full-clubs="{len(data["officialTableApproximation"])}" data-full-matches="{total}">
  <div class="panel-intro">
    <span class="kicker">DOS VERSIONES DE LA LIGA / {e(label)}</span>
    <h2 id="our-table">Cuando dejamos jugar a los demás.</h2>
    <p>Mismos partidos reales, otros protagonistas. Compara nuestra tabla con la clasificación final publicada cuando esté verificada.</p>
    {switches}
    <p class="season-view-explainer" id="season-view-explainer" role="status" aria-live="polite">Nuestra liga: {facts["number_remaining"]} equipos y {kept} partidos. Se eliminan los {excluded} encuentros de Madrid o Barça para ambos equipos.</p>
  </div>
  <div class="season-table-view" id="spanish-usurper-table">{table(data["alternativeTable"], f"Clasificación alternativa de La Liga {label}")}</div>
  {full_html}
  <p class="season-table-caveat">{caveat}</p>
</section>
<section class="season-findings" aria-labelledby="season-findings-heading">
  <div class="findings-head"><span class="kicker">LO QUE CAMBIÓ / {e(label)}</span><h2 id="season-findings-heading">Tres apuntes de este universo paralelo.</h2>
    <p>Estos datos salen de los resultados reales. Nada de inventarse partidos.</p></div>
  <div class="findings-grid">
    <article class="finding"><span class="finding-index">01 / LA LUCHA POR EL TÍTULO</span><h3>{esc(champ["name"])} contra {esc(runner["name"])}</h3><p>{race}</p></article>
    <article class="finding"><span class="finding-index">02 / QUIÉN SUBE</span><h3>Movimientos entre los supervivientes</h3><p>{moved}</p></article>
    <article class="finding"><span class="finding-index">03 / EL PRECIO DE LA EXCLUSIÓN</span><h3>{excluded} partidos reales eliminados</h3><p>{winner_story}</p></article>
  </div>
</section>
{historic_note}
<section class="sources">
  <h2>Sobre los números…</h2>
  <p>La clasificación alternativa es <strong>un cálculo independiente</strong>, no una clasificación oficial de LaLiga. No reproducimos todas las reglas históricas de desempate entre equipos.</p>
  {real_source}
  <p>Resultados reales: <a href="{e(data["sourceUrl"])}" rel="noopener noreferrer">{e(data["source"])}</a> (archivo CC0). Los {excluded} partidos eliminados no se asignan a nadie.</p>
</section>
<aside class="discovery-cta" aria-label="Descubre más ligas">
  <div><span class="kicker">¿TE APETECE CAMBIAR LAS REGLAS?</span><h2>Ahora le toca a la Premier League.</h2>
    <p>En Inglaterra puedes decidir qué clubes de los Big Six quedan fuera: uno, varios o todos. Recalculamos cada temporada con partidos reales.</p></div>
  <div class="discovery-links"><a class="primary-link" href="/england/">Diseña tu propia Premier League ↗</a><a href="/es/la-liga/">Explorar las 94 temporadas españolas →</a></div>
</aside>
<nav class="season-siblings" aria-label="Otras temporadas">{nav}</nav>
"""
    title = f"La Liga {label} sin Real Madrid ni Barcelona | {champ['name']} campeón"
    description = (f"Clasificación alternativa de La Liga {label}: {champ['name']} "
                   f"campeón con {champ['Pts']} puntos, {gap} más que {runner['name']}. "
                   f"{excluded} partidos eliminados.")
    return chrome(title, description, f"/la-liga/{sid}/", f"/es/la-liga/{sid}/", body,
                  compare=bool(ref))


def archive_page(index):
    records = index["seasons"]
    counts = Counter(s["champion"] for s in records)
    honours = "".join(f'<tr><th scope="row">{e(name)}</th><td>{num}</td></tr>'
                      for name,num in sorted(counts.items(), key=lambda x:(-x[1],x[0].casefold())))
    groups = {}
    for row in records:
        groups.setdefault(row["id"][:3] + "0s", []).append(row)
    periods = []
    for decade, items in sorted(groups.items(), reverse=True):
        rows = "".join(
            f'<tr><th scope="row"><a href="/es/la-liga/{e(item["id"])}/">{e(item["label"])}</a></th>'
            f'<td>{e(item["champion"])}</td><td>{item["points"]}</td><td>{item["matches"]}</td></tr>'
            for item in items)
        periods.append(
            f'<section class="decade-section"><h3>{e(decade)}</h3><div class="table-scroll">'
            '<table><thead><tr><th scope="col">Temporada</th>'
            '<th scope="col">Nuestro campeón</th><th scope="col">Pts</th>'
            '<th scope="col">Partidos incluidos</th></tr></thead><tbody>'
            + rows + '</tbody></table></div></section>')
    body = f"""
<div class="breadcrumbs"><a href="/">Inicio</a> / Archivo de La Liga</div>
<section class="page-hero index-hero">
  <span class="kicker">LA LIGA / 1928–2026 / THE USURPER LEAGUE</span>
  <h1>El fútbol español.<br><em>Con otros campeones.</em></h1>
  <p class="standfirst">{len(records)} temporadas completas recalculadas sin Real Madrid ni FC Barcelona. Partidos auténticos, salvo los jugados por los dos gigantes.</p>
  <p>¿Quién gana cuando los favoritos se quedan fuera? Bastantes clubes diferentes. Elige un año para ver cada resultado o descubre quién acumula más títulos alternativos.</p>
  <a class="primary-link" href="/spain/?lang=es">Ver la clasificación de esta temporada ↗</a>
</section>
<section class="split">
  <div class="panel"><div class="panel-intro"><span class="kicker">PALMARÉS ALTERNATIVO</span><h2>¿Quién se lleva los títulos?</h2><p>Veces que cada club termina primero en nuestras {len(records)} temporadas históricas. Trofeos imaginarios; partidos reales.</p></div>
    <div class="table-scroll"><table><thead><tr><th scope="col">Equipo</th><th scope="col">Títulos alternativos</th></tr></thead><tbody>{honours}</tbody></table></div></div>
  <div class="panel method-panel"><span class="kicker">LAS REGLAS</span><h2>Sin inventar resultados. Sin los gigantes.</h2>
    <p>Eliminamos <em>todos</em> los partidos del Madrid y del Barça: goles, puntos, victorias, derrotas. Calculamos las tablas de los demás con las reglas de puntuación de cada época.</p>
    <p>No publicamos temporadas con resultados incompletos. La Liga no se disputó durante la Guerra Civil (1936–1939), y falta una fuente completa de 1962/63 en el archivo.</p>
    <p>Nuestra clasificación alternativa sigue puntos, diferencia de goles y goles marcados, sin recrear necesariamente todos los desempates o sanciones históricas oficiales.</p>
  </div>
</section>
<section class="all-seasons"><span class="kicker">ELIGE UNA TEMPORADA</span><h2>Todas las temporadas disponibles</h2><p>Consulta cada clasificación alternativa, la tabla publicada con todos los equipos cuando esté verificada y las fuentes originales.</p>{''.join(periods)}</section>
"""
    return chrome("La Liga sin Madrid ni Barça: 94 temporadas | The Usurper League",
                  f"Explora {len(records)} temporadas de La Liga sin Real Madrid ni Barcelona, con campeones alternativos y partidos reales.",
                  "/la-liga/", "/es/la-liga/", body)


def build(entries, index):
    DEST.mkdir(parents=True, exist_ok=True)
    ids = {record["seasonId"] for record in entries}
    for i, data in enumerate(entries):
        prev_id = entries[i + 1]["seasonId"] if i+1 < len(entries) else None
        next_id = entries[i - 1]["seasonId"] if i > 0 else None
        persist(DEST / data["seasonId"] / "index.html",
                season_page(data, prev_id, next_id))
    for old in DEST.iterdir():
        if old.is_dir() and old.name not in ids:
            html = old / "index.html"
            if html.is_file():
                html.unlink()
                old.rmdir()
    persist(DEST / "index.html", archive_page(index))
    return ["/es/la-liga/"] + [f"/es/la-liga/{record['seasonId']}/" for record in entries]

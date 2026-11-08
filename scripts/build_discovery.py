#!/usr/bin/env python3
"""Rebuild Spanish home and static social/article metadata. No network or trackers.
Run after editing homepage copy or article headings: python scripts/build_discovery.py.
Spanish copy comes from the same home.js dictionary used by the live page.
"""
from pathlib import Path
import json, re, subprocess
from html import escape, unescape
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
BASE='https://usurperleague.com'
def meta(s,key,value,attr='property'):
    tag=f'<meta {attr}="{key}" content="{escape(value,quote=True)}">'
    pattern=rf'<meta {attr}="{re.escape(key)}"[^>]*>'
    return re.sub(pattern,lambda _:tag,s) if re.search(pattern,s) else s.replace('</head>',tag+'\n</head>')
def social(s,slug):
    image=BASE+'/social/'+slug+'.png'
    for key,value in [('og:image',image),('og:image:width','1200'),('og:image:height','630'),('og:image:type','image/png')]: s=meta(s,key,value)
    s=meta(s,'twitter:card','summary_large_image','name')
    s=meta(s,'twitter:image',image,'name')
    return s
s=(PUBLIC/'index.html').read_text()
s=social(s,'league')
s=re.sub(r'<link rel="alternate" hreflang="(?:en|es|x-default)"[^>]*>\n?','',s)
s=s.replace('</head>',''.join(f'<link rel="alternate" hreflang="{lang}" href="{BASE}{path}">\n' for lang,path in [('en','/'),('es','/es/'),('x-default','/')])+'</head>')
(PUBLIC/'index.html').write_text(s)
js=r'''const fs=require('fs'),vm=require('vm');const nodes={};
const document={documentElement:{},getElementById(id){return nodes[id]??=( {setAttribute(k,v){this[k]=v}})},querySelectorAll(){return []}};
vm.runInNewContext(fs.readFileSync('public/home.js','utf8'),{document,URLSearchParams,location:{search:'',pathname:'/es/'},fetch:()=>new Promise(()=>{}),Date,Number});
console.log(JSON.stringify(nodes));'''
nodes=json.loads(subprocess.check_output(['node','-e',js],cwd=ROOT))
for id,props in nodes.items():
    pattern=rf'(<[\w]+\b[^>]*\bid="{re.escape(id)}"[^>]*>)(.*?)(</[\w]+>)'
    if 'textContent' in props:
        s=re.sub(pattern,lambda m:m[1]+escape(props['textContent'])+m[3],s,flags=re.S)
    for attr in ['href','aria-label']:
        if attr in props:
            s=re.sub(rf'<[\w]+\b[^>]*\bid="{re.escape(id)}"[^>]*>',lambda m:re.sub(rf'{attr}="[^"]*"',lambda _:attr+'="'+escape(props[attr],quote=True)+'"',m[0]),s)
s=s.replace('<html lang="en">','<html lang="es">').replace('href="'+BASE+'/"','href="'+BASE+'/es/"',1)
s=s.replace('href="/" lang="en" hreflang="en" aria-current="page"','href="/" lang="en" hreflang="en"').replace('href="/es/" lang="es" hreflang="es"','href="/es/" lang="es" hreflang="es" aria-current="page"')
title='The Usurper League | El fútbol sin los ganadores de siempre'
desc='Clasificaciones alternativas con resultados reales. La Liga sin Madrid ni Barcelona y la Premier League con los clubes que tú decidas excluir.'
s=re.sub(r'<title>.*?</title>','<title>'+title+'</title>',s)
for key,val,attr in [('description',desc,'name'),('og:title',title,'property'),('og:description',desc,'property'),('og:url',BASE+'/es/','property'),('twitter:title',title,'name'),('twitter:description',desc,'name')]: s=meta(s,key,val,attr)
s=social(s,'league-es')
(PUBLIC/'es').mkdir(exist_ok=True)
(PUBLIC/'es/index.html').write_text(s)
for p in (PUBLIC/'journal').rglob('index.html'):
    s=p.read_text();slug=p.parent.name if p.parent.name!='journal' else 'league'
    s=social(s,slug)
    title=unescape(re.search(r'<h1[^>]*>(.*?)</h1>',s,re.S)[1])
    s=meta(s,'og:image:alt',title)
    s=re.sub(r'<script type="application/ld\+json" data-discovery>.*?</script>','',s,flags=re.S)
    if slug!='league':
        canonical=re.search(r'<link rel="canonical" href="([^"]+)"',s)[1]
        data={'@context':'https://schema.org','@type':'Article','headline':title,'inLanguage':'es' if slug.startswith('espanyol') else 'en','datePublished':'2026-11-08','mainEntityOfPage':canonical,'image':BASE+'/social/'+slug+'.png','author':{'@type':'Organization','name':'The Usurper League','url':BASE+'/'},'publisher':{'@type':'Organization','name':'The Usurper League','url':BASE+'/'}}
        s=s.replace('</head>','<script type="application/ld+json" data-discovery>'+json.dumps(data,ensure_ascii=False).replace('<','\\u003c')+'</script></head>')
    else: s=meta(s,'og:type','website')
    if 'data-share-status' not in s:
        es=slug.startswith('espanyol')
        controls='<div class="share-controls"><button type="button" data-share hidden>'+('Compartir artículo' if es else 'Share this page')+'</button><p data-share-status role="status"></p></div>'
        s=s.replace('</main>',controls+'</main>').replace('</body>','<script defer src="/journal/share.js"></script></body>')
    p.write_text(s)
for page in ['england/index.html','spain/index.html']:
    p=PUBLIC/page
    p.write_text(social(p.read_text(),'league'))
print('Rebuilt Spanish home and journal sharing metadata.')

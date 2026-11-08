#!/usr/bin/env python3
"""Render original typographic 1200x630 share cards (Pillow required).
No club marks or photographs. Numbers describe alternative tables, not real titles.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/social'; OUT.mkdir(exist_ok=True)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def card(slug,tag,title,lines,note):
    im=Image.new('RGB',(1200,630),'#102e25'); d=ImageDraw.Draw(im)
    def text(x,y,t,size=30,color='#f3efdf',bold=False):
        d.text((x,y),t,font=ImageFont.truetype(BOLD if bold else FONT,size),fill=color)
    d.rectangle((0,0,14,630),fill='#d8c38d')
    text(65,40,'THE USURPER LEAGUE',25,'#d8c38d',True)
    text(65,98,tag,23,'#d8c38d')
    for i,line in enumerate(title):text(62,152+i*64,line,52,bold=True)
    y=315
    for line in lines:
        d.line((65,y-8,1135,y-8),fill='#446252',width=1)
        text(65,y,line,30); y+=53
    text(65,510,note,22,'#d8c38d')
    text(65,568,'usurperleague.com',22)
    im.save(OUT/(slug+'.png'),optimize=True)
card('league','REAL RESULTS. ALTERNATIVE LEAGUES.', ['Football without','the usual winners.'],['Remove the biggest clubs.','Remove every match they played.','Recalculate with the real results left.'],'Independent football thought experiment.')
card('league-es','RESULTADOS REALES. LIGAS ALTERNATIVAS.', ['El fútbol sin','los ganadores de siempre.'],['Excluye a los grandes clubes.','Elimina todos sus partidos.','Recalcula con los resultados restantes.'],'Un experimento futbolístico independiente.')
card('norwich-1992-93','ENGLAND / 1992–93 / WITHOUT THE BIG SIX',['Norwich. A different ending.'],['1   Norwich City                               55 pts','2   QPR                                            54 pts','3   Blackburn Rovers                        51 pts'],'Real results. Alternative table. No real title awarded.')
card('espanyol-1998-99','ESPAÑA / 1998–99 / SIN MADRID NI BARÇA',['Espanyol. Del séptimo','al primero.'],['1   Espanyol       60 puntos   +17 DG   48 GF','2   Mallorca        60 puntos   +17 DG   43 GF'],'Tabla alternativa: puntos, diferencia de goles, goles a favor.')
card('why-every-match-goes','THE RULEBOOK',['You cannot keep','half a match.'],['One excluded club.','Every fixture involving it removed.','For both teams.'],'Real results. Hypothetical competition.')

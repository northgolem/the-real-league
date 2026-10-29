#!/usr/bin/env python3
"""Read-only connectivity and source format diagnostic for historical standings."""
import urllib.request
import re
import html

for year in ["2023-24","1995-96","1928-29","1979-80"]:
    for label,url in [
        ("BDF",f"https://www.bdfutbol.com/en/t/t{year}.html"),
        ("RSSSF",f"https://www.rsssf.org/tabless/span{int(year[:4])+1}.html")
    ]:
        try:
            req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; UsurperLeague/1.0; historical archive verification)"})
            with urllib.request.urlopen(req,timeout=12) as result:
                body=result.read(300_000).decode("utf-8","replace")
                print(label,year,result.status,len(body),"tables",body.lower().count("<table"),"items",len(re.findall(r"<tr\\b",body,re.I)))
                for term in ["Classification","Real Madrid","Atlético","Sevilla","Final Table:"]:
                    idx=body.find(term)
                    if idx>=0:print(" >>",term,re.sub(r"\\s+"," ",html.unescape(re.sub(r"<[^>]*>"," ",body[max(0,idx-160):idx+240])))[:240])
        except Exception as e:
            print("ERR",label,year,type(e).__name__,str(e)[:160])

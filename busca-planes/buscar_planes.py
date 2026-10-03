"""Buscador de planes: busca planes gratuitos de una ciudad y un rango de fechas y deja el listado
en el mismo formato que lee agentes.py (base.json). Sin claves de API ni cuentas.

Tres vías, de más a menos fiable:
  1. Datos abiertos oficiales, si existe adaptador para la ciudad (Madrid y Barcelona).
  2. Búsqueda web (DuckDuckGo, sin clave) + descarga de las páginas + lectura de los datos
     estructurados "Event" (schema.org JSON-LD) que publican muchas webs de agenda.
  3. --urls: páginas que tú indicas (se descargan y se leen igual que en la vía 2).
Solo se copian campos que trae la fuente. Lo que no trae queda en null. No se inventa nada.

Si un buscador pide resolver un captcha, el programa NO lo evita: se detiene, te avisa, y
continúa cuando lo has resuelto en tu navegador y pulsas Intro (o vuelves a lanzarlo).

Uso:
  python buscar_planes.py --ciudad Madrid --desde 2026-10-03 --hasta 2026-10-25 --salida base.json
  python buscar_planes.py --ciudad Barcelona --desde 2026-10-03 --hasta 2026-10-25 --salida base_bcn.json
  python buscar_planes.py --ciudad Valencia --desde 2026-10-03 --hasta 2026-10-10 --web
  python buscar_planes.py --ciudad Madrid --desde 2026-10-03 --hasta 2026-10-25 --mezclar base_1.json base_2.json base_3.json base_4.json
"""
import json,re,sys,html,argparse,time,datetime as D
import urllib.request,urllib.error,urllib.parse
URL='https://datos.madrid.es/egob/catalogo/206974-0-agenda-eventos-culturales-100.json'
CAT={'CursosTalleres':'taller','ItinerariosOtrasActividadesAmbientales':'naturaleza','ExcursionesItinerariosVisitas':'visita / excursión','Musica':'música','JazzSoulFunkySwingReagge':'música','CoroGospel':'música','CantautorFolkCountry':'música','RockPop':'música','Clasica':'música','Zarzuela':'música','TeatroPerformance':'teatro','CuentacuentosTiteresMarionetas':'familiar / cuentacuentos','Exposiciones':'exposición','ConferenciasColoquios':'charla','CineActividadesAudiovisuales':'cine','CineFiccion':'cine','DanzaBaile':'baile','Flamenco':'flamenco','SalonTango':'baile','RecitalesPresentacionesActosLiterarios':'literatura','Literatura':'literatura','ClubesLectura':'literatura','ActividadesCalleArteUrbano':'arte urbano','Fiestas':'fiestas','Ferias':'feria','CircoMagia':'circo / magia','ActividadesDeportivas':'deporte','ComediaMonologo':'comedia','Historia':'patrimonio','Arte':'arte'}
DIAS={'MO':0,'TU':1,'WE':2,'TH':3,'FR':4,'SA':5,'SU':6}
RX_RES=re.compile(r'reserva previa|imprescindible reserva|inscripci[oó]n previa|inscripci[oó]n obligatoria|previa inscripci[oó]n|obligatoria la reserva|reserva obligatoria|con reserva|hasta completar (el )?aforo|hasta completar plazas|plazas limitadas|aforo limitado|retirada de entradas|entradas? (se )?(repartir|retir|recoger)|con invitaci[oó]n|inscr[ií]be|inscribirse',re.I)
RX_PAGO=re.compile(r'\d+\s*(€|euros?)',re.I)
def norm(s):return re.sub(r'[^a-z0-9]','',s.lower())

def descargar(url=URL,intentos=3,espera=3):
    """Descarga el JSON de la agenda. Falla con un mensaje claro si la respuesta no es el JSON esperado."""
    ultimo=None
    for i in range(intentos):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'buscar_planes/1.0 (datos abiertos)'})
            with urllib.request.urlopen(req,timeout=60) as r:
                raw=r.read()
            try:datos=json.loads(raw.decode('utf-8'))
            except ValueError:raise RuntimeError('la respuesta no es JSON (¿página de bloqueo o de verificación?): '+raw[:80].decode('utf-8','replace'))
            if '@graph' not in datos:raise RuntimeError('el JSON no trae el campo @graph')
            return datos['@graph']
        except (urllib.error.URLError,RuntimeError,TimeoutError) as e:
            ultimo=e;time.sleep(espera)
    raise SystemExit('No se pudo descargar la agenda abierta tras %d intentos: %s'%(intentos,ultimo))

def convertir(graph,desde,hasta,existentes=(),hoy=None):
    """Aplica los mismos filtros que build_base.py y devuelve registros AGM-* en el formato de agentes.py."""
    hoy=hoy or D.datetime.now().astimezone().isoformat(timespec='seconds')
    exist={norm(t) for t in existentes}
    out=[]
    for e in graph:
        e=dict(e)
        for k in ('title','description','price','event-location'):e[k]=html.unescape(e.get(k) or '')
        if e.get('free')!=1:continue
        ds,de=e['dtstart'][:10],e['dtend'][:10]
        if de<desde or ds>hasta:continue
        txt=(e['price']+' '+e['description'])
        if RX_PAGO.search(e['price']) and not re.search(r'gratuit',e['price'],re.I):continue
        span=(D.date.fromisoformat(de)-D.date.fromisoformat(ds)).days
        rec=e.get('recurrence') or {}
        dias=[DIAS[x] for x in rec.get('days','').split(',') if x in DIAS] if span>1 else None
        if span>1 and (not dias or len(dias)==7 and span>31):continue
        if span>31:continue
        if span>1 and (e.get('@type') or '').split('/')[-1]!='Exposiciones':continue
        hora=e.get('time') or None
        if not hora:continue
        if norm(e['title']) in exist:continue
        if not (e['event-location'] or ((e.get('address') or {}).get('area') or {}).get('street-address')):continue
        exc=[]
        for x in (e.get('excluded-days') or '').split(';'):
            p=x.strip().split('/')
            if len(p)==3:exc.append('%s-%02d-%02d'%(p[2],int(p[1]),int(p[0])))
        tipo=(e.get('@type') or '').split('/')[-1]
        cat=CAT.get(tipo,'cultura')
        low=(e['title']+' '+e['description']).lower()
        if cat=='taller' and re.search(r'naturaleza|huerto|jardin|jardín|plantas|aves|botánic',low):cat='naturaleza / taller'
        publico=e.get('audience') or None
        infantil=bool(publico and re.search(r'Ni[ñn]os|Familias|Beb',publico)) or bool(re.search(r'edad recomendada|infantil|familiar',low))
        reserva='obligatoria' if RX_RES.search(txt) else 'no_indicada'
        dist=((e.get('address') or {}).get('district') or {}).get('@id','').split('/')[-1]
        out.append({'id':'AGM-%s'%e['id'],'titulo':re.sub(r'\s+',' ',e['title']).strip(),'categoria':cat,'ciudad':'Madrid','zona':dist or None,
         'lugar':e['event-location'] or ((e.get('address') or {}).get('area') or {}).get('street-address') or None,'fecha_inicio':ds,'fecha_fin':de,'hora_inicio':hora[:5],'hora_fin':None,'horario_texto':None,
         'precio_eur':0,'precio_texto':'Gratuito (campo "free" de la agenda oficial)'+('; '+e['price'].strip()[:120] if e['price'].strip() else ''),
         'recurrencia':None,'dias_semana':dias,'fechas_excluidas':exc or None,'fuente':e.get('link') or e['@id'],'editor':'Ayuntamiento de Madrid (datos abiertos, agenda de eventos)',
         'fuentes_adicionales':[e['@id']],'estado_verificacion':'datos_abiertos_oficiales','disponibilidad':'no_comprobada','elegible_por_defecto':True,
         'notas':('Reserva o aforo limitado según el texto oficial. ' if reserva=='obligatoria' else '')+'Dato leído de la agenda oficial el %s; no se comprobó plaza ni cancelación.'%hoy[:10],
         'evidencia':re.sub(r'\s+',' ',txt).strip()[:300],'verificado_en':hoy,'origen':'datos.madrid.es/egob/catalogo/206974-0','fechas_sesiones':None,
         'reserva':reserva,'publico':'infantil / familiar' if infantil else 'general'})
    return out


# ---------- Barcelona: datos abiertos (API CKAN del Ayuntamiento) ----------
BCN_API='https://opendata-ajuntament.barcelona.cat/data/api/3/action/datastore_search'
BCN_RECURSO='877ccf66-9106-4ae2-be51-95a9f6469e4c'   # agenda diaria de actividades y eventos
BCN_DATASET='https://opendata-ajuntament.barcelona.cat/data/dataset/agenda-diaria'
DIAS_CA={'dilluns':0,'dimarts':1,'dimecres':2,'dijous':3,'divendres':4,'dissabte':5,'diumenge':6}
RX_RES_CA=re.compile(r'inscripci|reserv|places limitades|entrades? (limitades|anticipad)|aforament limitat|cal (retirar|recollir)',re.I)
class Captcha(Exception):pass

def _get(url,params=None,intentos=3,espera=3,json_out=True):
    if params:url+=('&' if '?' in url else '?')+urllib.parse.urlencode(params)
    ultimo=None
    for i in range(intentos):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) buscar_planes/1.0','Accept-Language':'es-ES,es;q=0.9,ca;q=0.8'})
            with urllib.request.urlopen(req,timeout=60) as r:
                raw=r.read();status=r.status
            txt=raw.decode('utf-8','replace')
            if status==202 or re.search(r'captcha|bot detection|unusual traffic|confirm this search was made by a human|prove that you are human',txt[:6000],re.I) and not txt.lstrip().startswith(('{','[')):
                raise Captcha(url)
            return json.loads(txt) if json_out else txt
        except Captcha:raise
        except urllib.error.HTTPError as e:
            if e.code in (403,429):raise Captcha('%s (HTTP %d)'%(url,e.code))
            ultimo=e;time.sleep(espera)
        except (urllib.error.URLError,TimeoutError,ValueError) as e:
            ultimo=e;time.sleep(espera)
    raise RuntimeError('no se pudo leer %s: %s'%(url,ultimo))

def _esperar_captcha(donde):
    sys.stderr.write('\nCAPTCHA o bloqueo en %s.\nEste programa no lo evita. Ábrelo en tu navegador, resuélvelo y vuelve aquí.\n'%donde)
    if sys.stdin.isatty():
        input('Pulsa Intro para reintentar (Ctrl+C para cancelar)... ');return True
    sys.stderr.write('Sin terminal interactivo: se detiene. Resuélvelo y vuelve a lanzar el programa.\n');return False

def con_captcha(fn,*a,**k):
    while True:
        try:return fn(*a,**k)
        except Captcha as c:
            if not _esperar_captcha(c):raise SystemExit(3)

def _hora_ca(s):
    m=re.search(r"(\d{1,2})[.:](\d{2})\s*h",s)
    return '%02d:%s'%(int(m.group(1)),m.group(2)) if m else None
def _dias_ca(s):
    s=s.lower()
    if 'tots els dies' in s or 'cada dia' in s:return list(range(7))
    m=re.search(r'de (\w+) a (\w+)',s)
    if m and m.group(1) in DIAS_CA and m.group(2) in DIAS_CA:
        a,b=DIAS_CA[m.group(1)],DIAS_CA[m.group(2)];return list(range(a,b+1)) if a<=b else None
    d=sorted({DIAS_CA[w] for w in re.findall(r'[a-zç]+',s) if w in DIAS_CA})
    return d or None

def bcn_descargar():
    out=[];offset=0
    while True:
        d=_get(BCN_API,{'resource_id':BCN_RECURSO,'limit':5000,'offset':offset})
        if not d.get('success'):raise RuntimeError('la API de Barcelona no devolvió success')
        rec=d['result']['records'];out+=rec;offset+=len(rec)
        if not rec or offset>=d['result']['total']:break
    return out

def bcn_convertir(rows,desde,hasta,hoy=None):
    """Una fila de la fuente = una actividad. Se crea un registro por franja horaria GRATUITA de su tabla de horarios."""
    from bs4 import BeautifulSoup
    hoy=hoy or D.datetime.now().astimezone().isoformat(timespec='seconds');out=[]
    for e in rows:
        ds=(e.get('start_date') or '')[:10];de=(e.get('end_date') or e.get('start_date') or '')[:10]
        if not ds or de<desde or ds>hasta or not e.get('timetable'):continue
        rid=re.sub(r'\D','',e['register_id'] or '')
        soup=BeautifulSoup(e['timetable'],'lxml');precio=None;n=0;infantil=bool(re.search(r'infantil|familiar|nens|nenes|beb[eè]s',(e.get('name') or '')+' '+(e.get('values_description') or ''),re.I))
        for tr in soup.select('tr'):
            dia=tr.select_one('.timetable-day');hor=tr.select_one('.timetable-hour');pr=tr.select_one('.timetable-price');obs=tr.select_one('.timetable-description')
            if pr is not None:precio=pr.get_text(' ',strip=True)
            if dia is None or hor is None:continue
            if not (precio and re.search(r'gratu',precio,re.I)):continue
            h=_hora_ca(hor.get_text(' ',strip=True));dias=_dias_ca(dia.get_text(' ',strip=True))
            if not h or not dias:continue
            ot=obs.get_text(' ',strip=True) if obs else ''
            reserva='obligatoria' if RX_RES_CA.search(ot) else 'no_indicada';n+=1
            lugar=' '.join(x for x in [e.get('institution_name'),e.get('addresses_road_name'),e.get('addresses_start_street_number')] if x) or None
            out.append({'id':'BCN-%s-%d'%(rid,n),'titulo':re.sub(r'\s+',' ',html.unescape(e['name'] or '')).strip(),'categoria':'cultura','ciudad':'Barcelona','zona':e.get('addresses_district_name'),
             'lugar':lugar,'fecha_inicio':ds,'fecha_fin':de,'hora_inicio':h,'hora_fin':None,'horario_texto':re.sub(r'\s+',' ',dia.get_text(' ',strip=True)+' '+hor.get_text(' ',strip=True)),
             'precio_eur':0,'precio_texto':'Gratuito (tabla de horarios de la fuente: "%s")'%precio[:80],'recurrencia':None,'dias_semana':None if len(dias)==7 else dias,'fechas_excluidas':None,
             'fuente':BCN_DATASET,'editor':'Ajuntament de Barcelona (datos abiertos, agenda)','fuentes_adicionales':[BCN_DATASET],'estado_verificacion':'datos_abiertos_oficiales','disponibilidad':'no_comprobada','elegible_por_defecto':True,
             'notas':('Inscripción, reserva o aforo limitado según el texto oficial. ' if reserva=='obligatoria' else '')+'Dato leído de la agenda abierta el %s; no se comprobó plaza ni cancelación. Las fechas de la fuente vienen con hora de desfase; se usa solo el día.'%hoy[:10],
             'evidencia':re.sub(r'\s+',' ',(dia.get_text(' ',strip=True)+' | '+hor.get_text(' ',strip=True)+' | '+precio+' | '+ot))[:300],'verificado_en':hoy,'origen':'opendata-ajuntament.barcelona.cat/agenda-diaria','fechas_sesiones':None,
             'reserva':reserva,'publico':'infantil / familiar' if infantil else 'general'})
    return out

# ---------- Web: buscador sin clave + datos estructurados Event ----------
def ddg_buscar(consulta,max_urls=10):
    t=_get('https://html.duckduckgo.com/html/',{'q':consulta},json_out=False)
    urls=[]
    for m in re.finditer(r'class="result__a"[^>]*href="([^"]+)"',t):
        u=html.unescape(m.group(1))
        q=urllib.parse.parse_qs(urllib.parse.urlparse(u).query)
        u=urllib.parse.unquote(q['uddg'][0]) if 'uddg' in q else u
        if u.startswith('http') and u not in urls:urls.append(u)
    return urls[:max_urls]

def _eventos_jsonld(pagina):
    from bs4 import BeautifulSoup
    soup=BeautifulSoup(pagina,'lxml');ev=[]
    def visita(x):
        if isinstance(x,list):
            for y in x:visita(y)
        elif isinstance(x,dict):
            t=x.get('@type');ts=t if isinstance(t,list) else [t]
            if any(isinstance(s,str) and s.endswith('Event') for s in ts):ev.append(x)
            for v in x.values():
                if isinstance(v,(list,dict)):visita(v)
    for s in soup.find_all('script',type='application/ld+json'):
        try:visita(json.loads(s.string or s.get_text()))
        except ValueError:pass
    return ev

def _fecha_hora(v):
    """(día, hora) de una fecha ISO. Si trae zona horaria se pasa a hora de Madrid/Barcelona (se asume una ciudad de España). Sin hora: (día, None)."""
    v=str(v or '').strip()
    if not re.match(r'\d{4}-\d{2}-\d{2}',v):return '',None
    if len(v)<=10:return v,None
    try:
        t=D.datetime.fromisoformat(v.replace('Z','+00:00'))
        if t.tzinfo:
            from zoneinfo import ZoneInfo
            t=t.astimezone(ZoneInfo('Europe/Madrid'))
        return t.date().isoformat(),t.strftime('%H:%M')
    except ValueError:return v[:10],None

def web_convertir(ev,url,ciudad,desde,hasta,hoy):
    out=[]
    for e in ev:
        ini,hora=_fecha_hora(e.get('startDate'));fin=_fecha_hora(e.get('endDate') or e.get('startDate'))[0]
        if not re.match(r'\d{4}-\d{2}-\d{2}$',ini) or fin<desde or ini>hasta:continue
        of=e.get('offers');of=of[0] if isinstance(of,list) and of else of
        gratis=e.get('isAccessibleForFree') is True or (isinstance(of,dict) and str(of.get('price','')).strip() in ('0','0.0','0.00'))
        if not gratis:continue
        loc=e.get('location');loc=loc[0] if isinstance(loc,list) and loc else loc
        lugar=(loc.get('name') if isinstance(loc,dict) else loc) if loc else None
        ciudad_ev=None
        if isinstance(loc,dict) and isinstance(loc.get('address'),dict):ciudad_ev=loc['address'].get('addressLocality')
        if ciudad_ev and norm(ciudad_ev)!=norm(ciudad):continue
        out.append({'id':'WEB-%s'%re.sub(r'\W','',url)[-24:]+'-%d'%len(out),'titulo':re.sub(r'\s+',' ',html.unescape(str(e.get('name') or ''))).strip(),'categoria':'cultura','ciudad':ciudad,'zona':None,'lugar':lugar,
         'fecha_inicio':ini,'fecha_fin':fin,'hora_inicio':hora,'hora_fin':None,'horario_texto':None,'precio_eur':0,
         'precio_texto':'Gratuito según los datos estructurados de la página','recurrencia':None,'dias_semana':None,'fechas_excluidas':None,'fuente':str(e.get('url') or url),'editor':urllib.parse.urlparse(url).netloc,
         'fuentes_adicionales':[url],'estado_verificacion':'web_datos_estructurados','disponibilidad':'no_comprobada','elegible_por_defecto':bool(hora),
         'notas':'Leído de la página el %s; no se comprobó plaza ni cancelación. Sin hora en la fuente: no elegible por defecto.'%hoy[:10],'evidencia':re.sub(r'\s+',' ',html.unescape(str(e.get('description') or '')))[:300],
         'verificado_en':hoy,'origen':url,'fechas_sesiones':None,'reserva':'no_indicada','publico':'general'})
    return [r for r in out if r['titulo']]

def buscar_web(ciudad,desde,hasta,urls=None,max_urls=10,hoy=None):
    hoy=hoy or D.datetime.now().astimezone().isoformat(timespec='seconds');log=[]
    if not urls:
        urls=[]
        for q in ('planes gratis %s %s %s'%(ciudad,desde,hasta),'agenda cultural gratuita %s %s'%(ciudad,desde[:7]),'eventos gratis %s %s'%(ciudad,desde)):
            urls+=[u for u in con_captcha(ddg_buscar,q,max_urls) if u not in urls]
    regs=[]
    for u in urls[:max_urls*3]:
        try:pg=con_captcha(_get,u,None,1,3,False)
        except (RuntimeError,SystemExit) as e:log.append((u,'error: %s'%e));continue
        ev=_eventos_jsonld(pg);r=web_convertir(ev,u,ciudad,desde,hasta,hoy);regs+=r;log.append((u,'%d eventos Event, %d gratuitos en fechas'%(len(ev),len(r))))
    return regs,log

# ---------- principal ----------
def main(argv=None):
    p=argparse.ArgumentParser(description='Busca planes gratuitos de una ciudad y los deja en el formato de agentes.py')
    p.add_argument('--ciudad',default='Madrid');p.add_argument('--desde',required=True);p.add_argument('--hasta',required=True);p.add_argument('--salida',default='base.json')
    p.add_argument('--web',action='store_true',help='usar también búsqueda web (o solo ella si la ciudad no tiene datos abiertos)')
    p.add_argument('--urls',nargs='*',help='páginas concretas a leer (datos estructurados Event)')
    p.add_argument('--mezclar',nargs='*',default=[],help='ficheros base_*.json con registros MAD-* leídos a mano que se conservan (Madrid)')
    p.add_argument('--feed',help='fichero JSON local de la agenda de Madrid (pruebas sin red)')
    a=p.parse_args(argv);D.date.fromisoformat(a.desde);D.date.fromisoformat(a.hasta)
    ciudad=a.ciudad.strip();c=norm(ciudad);hoy=D.datetime.now().astimezone().isoformat(timespec='seconds');manual=[];meta={};nuevos=[];fuentes=[]
    for f in a.mezclar:
        b=json.load(open(f,encoding='utf-8'))
        if not meta:meta={k:v for k,v in b.items() if k!='registros'}
        manual+=[r for r in b['registros'] if r['id'].startswith('MAD-')]
    abierto=False
    if c=='madrid':
        graph=json.load(open(a.feed,encoding='utf-8'))['@graph'] if a.feed else con_captcha(descargar)
        nuevos+=convertir(graph,a.desde,a.hasta,[r['titulo'] for r in manual],hoy);fuentes.append('agenda abierta del Ayuntamiento de Madrid (%d eventos descargados)'%len(graph));abierto=True
    elif c=='barcelona':
        rows=con_captcha(bcn_descargar);nuevos+=bcn_convertir(rows,a.desde,a.hasta,hoy);fuentes.append('agenda abierta del Ajuntament de Barcelona (%d actividades descargadas)'%len(rows));abierto=True
    if a.web or a.urls or not abierto:
        regs,log=buscar_web(ciudad,a.desde,a.hasta,a.urls,hoy=hoy)
        for u,m in log:print('  web:',u[:90],'->',m)
        vistos={norm(r['titulo']) for r in manual+nuevos};regs=[r for r in regs if norm(r['titulo']) not in vistos and not vistos.add(norm(r['titulo']))]
        nuevos+=regs;fuentes.append('búsqueda web + datos estructurados (%d páginas leídas)'%len(log))
    base=dict(meta) if meta else {'notas_schema':'null = dato no comprobado. Precio cero solo cuando la fuente declara gratis; puede haber reserva o costes aparte.'}
    base['registros']=manual+nuevos;base['schema_version']=2;base['generado_en']=hoy
    base['alcance']='%s, %s a %s. %d leídos a mano + %d de: %s. Gratis según la fuente; reserva y plazas no comprobadas.'%(ciudad,a.desde,a.hasta,len(manual),len(nuevos),'; '.join(fuentes))
    json.dump(base,open(a.salida,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
    print('%s: %d planes gratis entre %s y %s (más %d a mano). Fuentes: %s. Guardado en %s'%(ciudad,len(nuevos),a.desde,a.hasta,len(manual),'; '.join(fuentes),a.salida))
if __name__=='__main__':main()

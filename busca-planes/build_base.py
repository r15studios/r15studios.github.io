"""Construye base v2: 62 registros revisados a mano (v1) + agenda oficial del Ayuntamiento (datos abiertos).
Solo copia campos del feed; no inventa nada. Ejecutar: python build_base.py base_v1.json agenda.json base.json"""
import json,re,sys,html,datetime as D
v1,feed,out=sys.argv[1:4]
base=json.load(open(v1));g=json.load(open(feed))['@graph']
DESDE,HASTA='2026-10-03','2026-10-25'
CAT={'CursosTalleres':'taller','ItinerariosOtrasActividadesAmbientales':'naturaleza','ExcursionesItinerariosVisitas':'visita / excursión','Musica':'música','JazzSoulFunkySwingReagge':'música','CoroGospel':'música','CantautorFolkCountry':'música','RockPop':'música','Clasica':'música','Zarzuela':'música','TeatroPerformance':'teatro','CuentacuentosTiteresMarionetas':'familiar / cuentacuentos','Exposiciones':'exposición','ConferenciasColoquios':'charla','CineActividadesAudiovisuales':'cine','CineFiccion':'cine','DanzaBaile':'baile','Flamenco':'flamenco','SalonTango':'baile','RecitalesPresentacionesActosLiterarios':'literatura','Literatura':'literatura','ClubesLectura':'literatura','ActividadesCalleArteUrbano':'arte urbano','Fiestas':'fiestas','Ferias':'feria','CircoMagia':'circo / magia','ActividadesDeportivas':'deporte','ComediaMonologo':'comedia','Historia':'patrimonio','Arte':'arte'}
DIAS={'MO':0,'TU':1,'WE':2,'TH':3,'FR':4,'SA':5,'SU':6}
RX_RES=re.compile(r'reserva previa|imprescindible reserva|inscripci[oó]n previa|inscripci[oó]n obligatoria|previa inscripci[oó]n|obligatoria la reserva|reserva obligatoria|con reserva|hasta completar (el )?aforo|hasta completar plazas|plazas limitadas|aforo limitado|retirada de entradas|entradas? (se )?(repartir|retir|recoger)|con invitaci[oó]n|inscr[ií]be|inscribirse',re.I)
RX_PAGO=re.compile(r'\d+\s*(€|euros?)',re.I)
def norm(s):return re.sub(r'[^a-z0-9]','',s.lower())
exist={norm(r['titulo']) for r in base['registros']}
regs=list(base['registros'])
for r in regs:
    t=r['precio_texto']+' '+r['notas']
    r.setdefault('reserva','obligatoria' if re.search(r'reserva previa|inscripci[oó]n previa|con inscripci',t,re.I) and not re.search(r'sin inscripci',t,re.I) else 'no_indicada')
    r.setdefault('publico',None)
n=0
for e in g:
    for k in ('title','description','price','event-location'):e[k]=html.unescape(e[k] or '')
    if e['free']!=1:continue
    ds,de=e['dtstart'][:10],e['dtend'][:10]
    if de<DESDE or ds>HASTA:continue
    txt=(e['price']+' '+e['description'])
    if RX_PAGO.search(e['price']) and not re.search(r'gratuit',e['price'],re.I):continue
    span=(D.date.fromisoformat(de)-D.date.fromisoformat(ds)).days
    rec=e.get('recurrence') or {}
    dias=[DIAS[x] for x in rec.get('days','').split(',') if x in DIAS] if span>1 else None
    if span>1 and (not dias or len(dias)==7 and span>31):continue
    if span>31:continue
    if span>1 and (e.get('@type') or '').split('/')[-1]!='Exposiciones':continue  # un rango no garantiza actividad cada día salvo en exposiciones
    hora=e['time'] or None
    if not hora:continue
    if norm(e['title']) in exist:continue
    if not (e['event-location'] or ((e.get('address') or {}).get('area') or {}).get('street-address')):continue
    exc=[]
    for x in e['excluded-days'].split(';'):
        p=x.strip().split('/')
        if len(p)==3:exc.append('%s-%02d-%02d'%(p[2],int(p[1]),int(p[0])))
    tipo=(e.get('@type') or '').split('/')[-1]
    cat=CAT.get(tipo,'cultura')
    low=(e['title']+' '+e['description']).lower()
    if cat in('taller',) and re.search(r'naturaleza|huerto|jardin|jardín|plantas|aves|botánic',low):cat='naturaleza / taller'
    publico=e.get('audience') or None
    infantil=bool(publico and re.search(r'Ni[ñn]os|Familias|Beb',publico)) or bool(re.search(r'edad recomendada|infantil|familiar',low))
    reserva='obligatoria' if RX_RES.search(txt) else 'no_indicada'
    addr=(e.get('address') or {}).get('area') or {}
    dist=((e.get('address') or {}).get('district') or {}).get('@id','').split('/')[-1]
    n+=1
    regs.append({'id':'AGM-%s'%e['id'],'titulo':re.sub(r'\s+',' ',e['title']).strip(),'categoria':cat,'ciudad':'Madrid','zona':dist or None,
     'lugar':e['event-location'] or ((e.get('address') or {}).get('area') or {}).get('street-address') or None,'fecha_inicio':ds,'fecha_fin':de,'hora_inicio':hora[:5],'hora_fin':None,'horario_texto':None,
     'precio_eur':0,'precio_texto':'Gratuito (campo "free" de la agenda oficial)'+('; '+e['price'].strip()[:120] if e['price'].strip() else ''),
     'recurrencia':None,'dias_semana':dias,'fechas_excluidas':exc or None,'fuente':e['link'] or e['@id'],'editor':'Ayuntamiento de Madrid (datos abiertos, agenda de eventos)',
     'fuentes_adicionales':[e['@id']],'estado_verificacion':'datos_abiertos_oficiales','disponibilidad':'no_comprobada','elegible_por_defecto':True,
     'notas':('Reserva o aforo limitado según el texto oficial. ' if reserva=='obligatoria' else '')+'Dato leído de la agenda oficial el 2026-10-03; no se comprobó plaza ni cancelación.',
     'evidencia':re.sub(r'\s+',' ',txt).strip()[:300],'verificado_en':'2026-10-03T12:13:00+02:00','origen':'datos.madrid.es/egob/catalogo/206974-0','fechas_sesiones':None,
     'reserva':reserva,'publico':'infantil / familiar' if infantil else 'general'})
for r in regs:
    if r['id']=='MAD-025':r['aviso_publico']='Aparece en la "programación familiar" de la fuente (con sesión de pintacaras): pensado para público familiar/infantil.'
base['registros']=regs;base['schema_version']=2;base['generado_en']='2026-10-03T12:20:00+02:00'
base['alcance']='Madrid capital, 3-25 oct 2026. 62 registros v1 (lectura de fuentes) + agenda oficial del Ayuntamiento (datos abiertos). Gratis según la fuente; reserva y plazas no comprobadas.'
base['notas_schema']+=' v2: reserva = obligatoria si el texto oficial pide reserva/inscripción/aforo; publico = infantil/familiar si la fuente lo indica; dias_semana/fechas_excluidas filtran rangos.'
json.dump(base,open(out,'w'),ensure_ascii=False,indent=1)
print('añadidos',n,'total',len(regs))

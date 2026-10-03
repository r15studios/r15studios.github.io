"""Evaluación sencilla: casos con comprobación objetiva en código (no puntúa 'calidad' subjetiva).
Para cada resultado comprueba: existe en la base, coincide con la fecha, es gratis, encaja con cada tema pedido en al menos un plan,
y lleva aviso de reserva si la base marca reserva obligatoria."""
import json,sys
from pathlib import Path
import agentes
from consultar_base import consultar
CASOS=[
 ('c1','¿Qué puedo hacer en Madrid el domingo 4 de octubre de 2026 sin gastar? Quiero un taller y algo de naturaleza.','2026-10-04',['taller','naturaleza']),
 ('c2','¿Qué concierto gratis hay en Madrid el sábado 10 de octubre de 2026?','2026-10-10',['música']),
 ('c3','Quiero teatro o baile gratis en Madrid el sábado 17 de octubre de 2026.','2026-10-17',['teatro']),
 ('c4','¿Hay alguna exposición gratis en Madrid el sábado 3 de octubre de 2026?','2026-10-03',['exposición']),
 ('c5','Busco un taller y naturaleza gratis en Madrid el domingo 25 de octubre de 2026.','2026-10-25',['taller','naturaleza']),
 ('c6','¿Qué charla o cine gratis hay en Madrid el martes 13 de octubre de 2026?','2026-10-13',['charla','cine']),
]
if __name__=='__main__':
 m=agentes.Agentes();informe=[]
 base={r['id']:r for r in json.load(open('base.json'))['registros']}
 for cid,q,f,temas in CASOS:
  Path('prueba_'+cid+'.json').write_text(json.dumps({'question':q,'date':f,'free_only':True,'temas':temas,'publico':'general','log':[]},ensure_ascii=False))
  print('\n=== CASO',cid,q,flush=True)
  for st in ['search','analyze','validate']:m.log=[];m.stage(st,cid)
  s=json.load(open('prueba_'+cid+'.json'));vivos={r['id'] for r in consultar(f,'base.json')}
  res=s.get('results',[]);chk={'resultados':len(res)}
  chk['todos_existen_en_base']=all(r['id'] in base for r in res)
  chk['todos_en_la_fecha']=all(r['id'] in vivos for r in res)
  chk['todos_gratis']=all(base[r['id']]['precio_eur']==0 for r in res)
  chk['cada_tema_cubierto']={t:any(agentes.tiene_tema(base[r['id']],t) for r in res) for t in temas}
  chk['tema_existia_en_base']={t:any(agentes.tiene_tema(r,t) for r in consultar(f,'base.json') if r['precio_eur']==0 and r.get('publico')!='infantil / familiar') for t in temas}
  chk['aviso_reserva_correcto']=all(bool(r['aviso_reserva'])==(base[r['id']].get('reserva')=='obligatoria') for r in res)
  chk['sin_titulos_repetidos']=len({r['titulo'] for r in res})==len(res)
  chk['ids_inventados']=[r['id'] for r in res if r['id'] not in base]
  informe.append({'caso':cid,'pregunta':q,'fecha':f,'comprobaciones':chk,'titulos':[r['titulo'] for r in res],'segundos_modelo':round(sum(l['seconds'] for l in s.get('log',[])),1)})
 Path('informe_evaluacion.json').write_text(json.dumps(informe,ensure_ascii=False,indent=1))
 print(json.dumps(informe,ensure_ascii=False,indent=1))

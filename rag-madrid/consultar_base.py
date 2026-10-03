"""Lee la base curada. No busca en la web, no llama a un modelo y no comprueba plazas."""
import json,datetime,argparse
from pathlib import Path

def consultar(fecha,base='base.json',incluir_pendientes=False):
    d=datetime.date.fromisoformat(fecha)
    rows=json.loads(Path(base).read_text(encoding='utf-8'))['registros']
    out=[]
    for r in rows:
        if not incluir_pendientes and not r['elegible_por_defecto']: continue
        rec=r.get('recurrencia')
        if rec:
            if rec['tipo']=='semanal':
                hit=d.weekday() in rec['dias_semana']
            elif rec['tipo']=='mensual':
                hit=d.weekday()==rec['dia_semana'] and ((d.day-1)//7+1) in rec['ordinales'] and d.month not in rec['meses_excluidos']
            else:hit=False
            if d.year!=2026:hit=False
        elif r.get('fechas_sesiones'):
            hit=fecha in r['fechas_sesiones']
        elif r['fecha_inicio'] and r['fecha_fin']:
            hit=r['fecha_inicio']<=fecha<=r['fecha_fin']
            if r['titulo'].startswith('Materia viva') and d.weekday()==0:hit=False
            # v2: rangos con días de la semana y días excluidos publicados por la fuente
            if hit and r.get('dias_semana') and d.weekday() not in r['dias_semana']:hit=False
            if hit and fecha in (r.get('fechas_excluidas') or []):hit=False
        else:hit=False
        if hit:
            entry=dict(r)
            entry['fecha_consulta']=fecha
            entry['aviso']='Coincide con calendario publicado, NO garantiza plaza ni ausencia de cancelación. Revalidar fuente antes de acudir.'
            out.append(entry)
    return out

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('fecha');p.add_argument('--base',default='base.json');p.add_argument('--incluir-pendientes',action='store_true');a=p.parse_args()
    print(json.dumps(consultar(a.fecha,a.base,a.incluir_pendientes),ensure_ascii=False,indent=2))

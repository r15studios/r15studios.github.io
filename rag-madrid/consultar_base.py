"""Read a curated base. Does not search web, call a model, or verify available places."""
import json,datetime,argparse,calendar
from pathlib import Path

def consultar(fecha,base='planes_madrid_base.json',incluir_pendientes=False):
    d=datetime.date.fromisoformat(fecha)
    rows=json.loads(Path(base).read_text(encoding='utf-8'))['registros']
    out=[]
    for r in rows:
        if not incluir_pendientes and not r['elegible_por_defecto']: continue
        rec=r.get('recurrencia')
        if rec:
            if rec['tipo']=='semanal':
                # Holidays are not guessed without an explicit calendar.
                hit=d.weekday() in rec['dias_semana']
            elif rec['tipo']=='mensual':
                hit=d.weekday()==rec['dia_semana'] and ((d.day-1)//7+1) in rec['ordinales'] and d.month not in rec['meses_excluidos']
            else:hit=False
            # Do not extend a 2026 source calendar indefinitely.
            if d.year!=2026:hit=False
        elif r.get('fechas_sesiones'):
            hit=fecha in r['fechas_sesiones']
        elif r['fecha_inicio'] and r['fecha_fin']:
            hit=r['fecha_inicio']<=fecha<=r['fecha_fin']
            if r['titulo'].startswith('Materia viva') and d.weekday()==0:hit=False
        else:hit=False
        if hit:
            entry=dict(r)
            entry['fecha_consulta']=fecha
            entry['aviso']='Coincide con calendario publicado, NO garantiza plaza ni ausencia de cancelación. Revalidar fuente antes de acudir.'
            out.append(entry)
    return out

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('fecha');p.add_argument('--base',default='planes_madrid_base.json');p.add_argument('--incluir-pendientes',action='store_true');a=p.parse_args()
    print(json.dumps(consultar(a.fecha,a.base,a.incluir_pendientes),ensure_ascii=False,indent=2))

# Plan que sí apetece (busca-planes)

Tres roles (buscador, analizador, validador) sobre un modelo abierto local (Qwen2.5-1.5B-Instruct, Q4_K_M, solo CPU, sin API). Es un sistema de agentes que busca planes gratuitos de una ciudad por sí solo y enseña lo que hace en cada paso.

- `buscar_planes.py`: deja el listado en `base.json`, el formato que lee `agentes.py`. Ver la sección siguiente.
- `base_1.json` a `base_4.json`: el listado que usa la demo: 715 registros de Madrid, 3-25 oct 2026. 62 leídos a mano de sus fuentes (`MAD-*`) y 653 de la agenda oficial del Ayuntamiento (`AGM-*`, datos abiertos). Solo planes gratis según la fuente, con hora y lugar.
- `consultar_base.py`: recuperación por fecha. No usa web ni modelo.
- `agentes.py`: los tres roles. El código añade las comprobaciones objetivas (precio, hora, lugar, reserva) y un control de cobertura por tema.
- `build_base.py`: reconstruye la parte `AGM-*` desde la agenda oficial (`datos.madrid.es`).
- `evaluar.py`: 6 casos con comprobaciones en código (existe en la base, fecha, gratis, tema cubierto, aviso de reserva, sin repetidos).

El cargador debe unir los registros de `base_1.json`, `base_2.json`, `base_3.json` y `base_4.json`, en ese orden, manteniendo los metadatos de la primera parte, y guardar el resultado como `base.json` local antes de ejecutar el código.

Si la fuente pide reserva, el resultado lleva un aviso: puede estar completo. El sistema no comprueba plazas ni cancelaciones.

## buscar_planes.py: busca los planes de una ciudad por sí solo

```
pip install beautifulsoup4 lxml
python buscar_planes.py --ciudad Madrid --desde 2026-10-03 --hasta 2026-10-25 --salida base.json
python buscar_planes.py --ciudad Barcelona --desde 2026-10-03 --hasta 2026-10-25 --salida base.json
python buscar_planes.py --ciudad Valencia --desde 2026-10-03 --hasta 2026-10-10 --web
python buscar_planes.py --ciudad Madrid --desde 2026-10-03 --hasta 2026-10-25 --mezclar base_1.json base_2.json base_3.json base_4.json
```

Sin claves de API ni cuentas. Tres vías:

1. **Datos abiertos oficiales**, si hay adaptador para la ciudad: Madrid (agenda del Ayuntamiento) y Barcelona (agenda del Ajuntament, vía su API CKAN).
2. **Búsqueda web** (`--web`, o por defecto en ciudades sin adaptador): consulta DuckDuckGo sin clave, descarga las páginas y lee los datos estructurados `Event` (schema.org JSON-LD) que publican muchas webs de agenda. Solo entra lo que la página declara gratuito y con fechas dentro del rango. Lo que la página no trae queda en `null`.
3. **`--urls`**: páginas que indicas tú, leídas igual que en la vía 2.

Solo se copian campos de la fuente. Nada se inventa. `--mezclar` conserva los registros `MAD-*` leídos a mano.

**Captchas y bloqueos.** Si un buscador o una web pide resolver un captcha o responde con bloqueo (403, 429), el programa no lo evita. Se detiene y avisa; con terminal interactivo espera a que lo resuelvas en tu navegador y pulses Intro para reintentar. Sin terminal sale con código 3.

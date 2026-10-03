# Plan que sí apetece (busca-planes)

Tres roles (buscador, analizador, validador) sobre un modelo abierto local (Qwen2.5-1.5B-Instruct, Q4_K_M, solo CPU, sin API) que trabajan sobre un listado de planes gratuitos de una ciudad. Cada paso imprime qué hizo.

- `buscar_planes.py`: deja el listado en `base.json`, el formato que lee `agentes.py`. Ver la sección siguiente.
- `base_1.json` a `base_4.json`: el listado que usa la demo, preparado antes de la demo: 715 registros de Madrid, 3-25 oct 2026. 62 leídos a mano de sus fuentes (`MAD-*`) y 653 de la agenda oficial del Ayuntamiento (`AGM-*`, datos abiertos). Solo planes gratis según la fuente, con hora y lugar.
- `consultar_base.py`: recuperación por fecha. No usa web ni modelo.
- `agentes.py`: los tres roles. El código añade las comprobaciones objetivas (precio, hora, lugar, reserva) y un control de cobertura por tema.
- `build_base.py`: reconstruye la parte `AGM-*` desde la agenda oficial (`datos.madrid.es`).
- `evaluar.py`: 6 casos con comprobaciones en código (existe en la base, fecha, gratis, tema cubierto, aviso de reserva, sin repetidos).

El cargador debe unir los registros de `base_1.json`, `base_2.json`, `base_3.json` y `base_4.json`, en ese orden, manteniendo los metadatos de la primera parte, y guardar el resultado como `base.json` local antes de ejecutar el código.

Si la fuente pide reserva, el resultado lleva un aviso: puede estar completo. El sistema no comprueba plazas ni cancelaciones.

## buscar_planes.py: buscar planes de una ciudad en vivo

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

### Qué se probó (3 de octubre de 2026, desde un servidor, no desde un ordenador doméstico)

- **Madrid, datos abiertos: funciona.** Descarga en vivo de 1.511 eventos; 653 planes gratis del 3 al 25 de octubre. Los 653 identificadores coinciden con los de la base de la demo y los campos también (salvo las fechas de lectura).
- **Barcelona, datos abiertos: funciona.** API CKAN, 5.957 actividades descargadas en unos 9 s; 1.870 registros gratis del 3 al 25 de octubre (uno por franja horaria gratuita de su tabla de horarios). Probado `agentes.py` sin cambios sobre ese listado para el domingo 4 de octubre (196 registros ese día, tema «taller»): devolvió 5 planes, 2 con aviso de reserva y 1 con datos incompletos.
- **Captcha:** DuckDuckGo devolvió captcha al servidor de pruebas y el programa se detuvo con el aviso (sin terminal, salida 3). La ruta interactiva de «esperar y reintentar» no se ha probado.
- **Lectura de datos estructurados:** probada sobre una página real (Meetup, Barcelona): 9 eventos `Event` leídos, 0 declarados gratuitos, 0 registros. También con un evento sintético, solo para comprobar la conversión y el cambio de zona horaria.

### Qué no se probó

- **La búsqueda web de extremo a extremo no se ha podido probar.** Desde el servidor de pruebas, DuckDuckGo y Startpage pidieron captcha, Brave devolvió 429, Mojeek 403 y Bing no devolvió resultados útiles. Es posible que funcione desde un ordenador doméstico, pero no está comprobado.
- Ninguna ciudad aparte de Madrid y Barcelona.
- Barcelona: la descarga del fichero completo de su portal fue bloqueada por detección de bots; se usa su API, que sí responde. Los textos vienen en catalán, y los temas de `agentes.py` están en español: solo se probó el tema «taller». Muchas entradas son actividades recurrentes; las fechas de la fuente traen desfase horario y se usa solo el día.
- Plazas, cancelaciones y precios reales: no se comprueban. «Gratis» es lo que dice la fuente.

## Límites

La demo usa una base cerrada de Madrid preparada antes. No hay prueba de que tres roles superen a uno solo.

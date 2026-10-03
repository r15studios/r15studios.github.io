# Plan que sí apetece (rag-madrid)

Tres roles (buscador, analizador, validador) sobre un modelo abierto local (Qwen2.5-1.5B-Instruct, Q4_K_M, solo CPU, sin API) y una base cerrada de planes de Madrid. Cada paso imprime qué hizo.

- `base_1.json` a `base_4.json`: 715 registros de Madrid, 3-25 oct 2026. 62 leídos a mano de sus fuentes (`MAD-*`) y 653 de la agenda oficial del Ayuntamiento (`AGM-*`, datos abiertos). Solo planes gratis según la fuente, con hora y lugar.
- `consultar_base.py`: recuperación por fecha. No usa web ni modelo.
- `rag.py`: los tres roles. El código añade las comprobaciones objetivas (precio, hora, lugar, reserva) y un control de cobertura por tema.
- `build_base.py`: reconstruye la base a partir de la agenda oficial (`datos.madrid.es`).
- `evaluar.py`: 6 casos con comprobaciones en código (existe en la base, fecha, gratis, tema cubierto, aviso de reserva, sin repetidos).

Si la fuente pide reserva, el resultado lleva un aviso: puede estar completo. El sistema no comprueba plazas ni cancelaciones.

El cargador debe unir los registros de `base_1.json`, `base_2.json`, `base_3.json` y `base_4.json`, en ese orden, manteniendo los metadatos de la primera parte, y guardar el resultado como `base.json` local antes de ejecutar el código.

Límites: base cerrada, solo Madrid, sin búsqueda en vivo, no hay prueba de que tres roles superen a uno solo.

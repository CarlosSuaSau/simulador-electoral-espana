# España, escaño a escaño

Laboratorio electoral local, independiente y apartidista. La edición actual usa ocho institutos distintos del CIS, acuerdos territoriales cerrados y escenarios editables de retención. El histórico de 2023 se conserva como referencia y prueba del reparto electoral.

La pestaña **Variación del voto** permite seleccionar una candidatura y ver sus cambios provinciales frente al resultado oficial de 2023, en puntos porcentuales sobre votos válidos. Los mapas usan verde para subidas, rojo para bajadas y gris para igualdad, con una escala común saturada en ±15 puntos. Incluyen cifras sobre las 52 provincias, detalle al seleccionar y tabla completa. Para nuevas coaliciones se suman sus orígenes históricos configurados; se muestra la correspondencia y se advierte de papeletas retiradas o sin referencia, incluido Vox en Tenerife. La comparación sigue la proyección determinista y el estado del botón de corrección histórica.

## Arrancar y verificar

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd test
npm.cmd run build
```

Abre la URL de Vite. `npm.cmd` evita restricciones de ejecución de `npm.ps1` en PowerShell. No se necesitan claves, bases de datos ni servicios de pago.

## Encuestas y exclusiones

Catálogo comprobado el **17 de octubre de 2026**: `src/data/polls-2026.json`.

| Instituto | Publicación | Muestra comprobada | Alcance de la transcripción |
| --- | --- | --- | --- |
| GAD3 / ABC | 12 octubre | 1.077 | PP, PSOE, Vox y Sumar; ficha del instituto |
| Sigma Dos / El Mundo | 12 octubre | 2.017 | Desglose de 13 categorías del instituto; campo no publicado en el texto |
| IMOP / El Confidencial | 9 octubre | 900 | Cuatro categorías del instituto y ficha completa |
| SocioMétrica / El Español | 11 octubre | 1.000 | Ocho categorías contrastadas en el artículo y ficha |
| DYM / 20minutos | 9 octubre | 1.011 | PP, PSOE y Vox; separación Sumar/Podemos pendiente de gráfico original |
| NC Report / La Razón | 8 octubre | Sin comprobar | Seis categorías; campo y muestra ausentes en el texto consultado |
| InvyMark / laSexta | 9 octubre | Sin comprobar | Diez categorías; campo y muestra ausentes en la pieza consultada |
| 40dB. / EL PAÍS–SER | 5 octubre | 2.000 | Seis categorías; ficha excluye Ceuta y Melilla |

Cada registro incluye URL, fecha, categorías transcritas, denominador y notas de verificación. Los datos faltantes son `null` o categorías ausentes, no valores inventados. Solo IMOP explicita en el texto consultado el denominador válido; los otros registros lo señalan como supuesto pendiente de tablas completas. La extrapolación de 40dB. a Ceuta y Melilla también se señala.

**CIS excluido por instrucción del usuario.** La exclusión está en el motor, no solo en una casilla. Recuperar escenarios antiguos o importar un CIS activado no lo incorpora al agregado. El archivo anterior se conserva únicamente en `data/archive/excluded-polls/`. No se asigna una puntuación de credibilidad inventada a los demás institutos.

Se usa la encuesta activa más reciente de cada instituto, con peso manual y decaimiento temporal. Si falta el fin del campo se usa la publicación, identificándolo como tal. La muestra no se usa como tamaño efectivo. Una categoría ausente no se interpreta como cero: su media utiliza solo los institutos que la desglosan. El resultado puede depender del desglose, por lo que se muestra el comparador de cifras y la sensibilidad al retirar cada instituto.

La búsqueda incluyó también GESOP, Hamalgama Métrica, Target Point, Ipsos y Simple Lógica, además de publicaciones más recientes de 40dB. Lo que no se pudo contrastar suficientemente no se añadió al cálculo. Detalle y motivos: `data/research/poll-audit-20261017.json`. No se copian proyecciones, datos privados ni métodos propietarios de otros simuladores.

## Documentos originales y ejemplos importables

```powershell
node scripts/export-examples.mjs
python scripts/download-poll-sources.py
```

El primer script genera una encuesta JSON por instituto en `data/polls/` y el escenario completo en `data/scenarios/base-2026.json`. El segundo intenta archivar las páginas originales con SHA-256 y registra fallos en `data/raw/polls/download-status.json`. En esta revisión se archivaron seis publicaciones; los accesos a 40dB. e InvyMark fallaron, aunque su contenido sí pudo consultarse con la herramienta web.

No necesitas descargar nada para probar la aplicación. Para completar la trazabilidad y ampliar el catálogo serían útiles: PDF/tablas de la encuesta flash de 40dB. del 9 de octubre; ficha de Sigma Dos de 2.017 entrevistas; fichas de NC Report e InvyMark; gráfico/tablas DYM que separen Sumar y Podemos; y el informe GESOP de octubre. Guarda esos originales en `data/raw/polls/`; importa sus cifras contrastadas desde la interfaz. No se extraen automáticamente cifras de un documento que no se haya validado.

## Acuerdos cerrados y retenciones desconocidas

La configuración separa **hechos sobre papeletas** de **parámetros sobre votantes**:

- UPC: acuerdo de NC–BC, Podemos, IU y Movimiento Sumar, anunciado el 15 de octubre y contrastado con EFE.
- Mesa de Unidad Canaria: alianza CC–Primero Canarias, con esa denominación en la presentación recogida por SER/EFE el 17 de octubre.
- Drago Canarias: candidatura en solitario, fuera de UPC.
- Frente Amplio: acuerdo estatal y sus marcas territoriales; Sumar de las encuestas se utiliza como origen de voto, no como una segunda papeleta.
- Compromís–Front Valencià: acuerdo territorial valenciano.
- Colaboración Podemos–ERC en Cataluña: apoyo que se dirige a la papeleta de ERC; no se añade una segunda papeleta de ERC.

Fuentes y territorios: `src/model/coalitions.ts`. Se utiliza el estado **acuerdo cerrado**, que no equivale a afirmar que se ha leído el documento oficial del registro. El contraste con actas electorales sigue pendiente. Los pactos de listas conjuntas al Senado no se aplican al Congreso.

`successors` identifica la papeleta que recibe el voto retenido de cada origen en cada provincia. El escenario inicial canario ensaya NC: 60 % UPC y 40 % CC–Primero Canarias; CC: 98 % sucesora y 2 % abstención; PP/UPN en Navarra: 99 % coalición y 1 % abstención; restantes orígenes con alianza: 97 % sucesora y 3 % abstención. Partidos sin cambios: 100 % a sí mismos. Son experimentos ilustrativos, no estimaciones empíricas. La matriz permite editar todos los destinos de cada origen y conserva el 100 % de cada fila. Para simular retención inferior añade destinos alternativos: otras papeletas, abstención, blancos o nulos. El remanente sigue la sucesora; no se deja voto en una papeleta que ha dejado de concurrir. Las filas se aplican simultáneamente y nunca duplican electores.

En Canarias puedes desviar NC hacia Mesa de Unidad Canaria, parte de Sumar hacia Drago o reducir retención de UPC mediante abstención. Los porcentajes no se deducen automáticamente de las organizaciones de una coalición. Una ruta explícita hacia la propia sucesora no reduce su retención: solo la reducen los destinos alternativos.

Los escenarios anteriores se migran al nuevo catálogo conservando los trasvases propios y excluyendo CIS. El formato sigue siendo versión 2 y se añade `dataRevision: 6`. Se conserva por separado la copia histórica en `snapshots/2023-reference/` y el almacenamiento de escenarios de 2023.

## Interfaz y funciones

1. **Encuestas:** activa fuentes, ajusta pesos/fecha de corte e importa nuevos registros. El comparador muestra cifras publicadas y la sensibilidad del reparto al retirar cada encuestadora.
2. **Coaliciones y trasvases:** consulta acuerdos y papeletas sucesoras; cambia las hipótesis de retención, incertidumbre y perfiles provinciales.
3. **Proyección:** compara hemiciclos, abre provincias y consulta D’Hondt, últimos escaños y distancias exactas por adición, pérdida o transferencia.
4. **Probabilidades:** configura semilla y factores de error y ejecuta Monte Carlo en un trabajador cancelable. Cambiar parámetros invalida los resultados anteriores.
5. **Guardar/exportar:** escenarios completos JSON, resultados provinciales CSV y distribuciones probabilísticas con sus parámetros.

El hemiciclo se rellena **por ángulo**, formando sectores continuos de izquierda a derecha que atraviesan las filas. Bloques de izquierda a la izquierda, derecha a la derecha y partidos territoriales/menores en el centro. No se pinta por anillos de dentro hacia fuera. La posición es una convención visual; no interviene en ningún cálculo.

Las marcas territoriales del PSOE, PP y Sumar usan identificadores nacionales comunes. PSdeG, PSE, PSIB y PSC aparecen como PSOE en tablas y leyendas. Las papeletas originales se conservan en el histórico para auditoría. Las marcas autonómicas de Frente Amplio se presentan conjuntamente como Frente Amplio. No se atribuye de antemano una coalición nueva a un grupo parlamentario futuro no confirmado.

## Proyección y límites

El modelo ajusta porcentajes nacionales y totales provinciales mediante raking/IPF. El perfil inicial usa las generales de 2023 (100 %). Los pesos de mezcla de 2019 siguen editables para experimentos; no se activan por defecto. Se normaliza por la fuerza nacional de cada partido en cada elección. La ausencia documentada de Vox en Tenerife se imputa con cocientes de localización de noviembre de 2019 (peso 2) y abril de 2019 (peso 1), sin diluirlos con el cero de 2023. El voto contrafactual incorporado se descuenta proporcionalmente de las otras papeletas de 2023 de Tenerife para conservar el total provincial; no modifica el archivo oficial. Los ceros comunes a todas las referencias se mantienen. Las papeletas conjuntas CC–NC y Navarra Suma de 2019 se excluyen de las referencias individuales; no se inventa su descomposición. Podemos utiliza inicialmente un proxy de Sumar y SALF uno de Vox; los proxies son editables. Las categorías no publicadas comparten el residuo según su peso histórico, sin crear una papeleta agregada de «otros». Este supuesto sigue siendo especialmente débil para NC y otros partidos territoriales no desglosados.

D’Hondt usa votos enteros, productos BigInt para comparar cocientes, barrera del 3 % sobre válidos incluidos blancos y mayoría en uninominales. Los márgenes distinguen adición, retirada y transferencia directa. Los empates de votos se marcan como pendientes de sorteo; en Monte Carlo se sortea con la semilla registrada.

Cada iteración probabilística simula el Congreso completo. Hay factores nacionales compartidos, autonómicos, provinciales, de bloques, participación y rutas. Las escalas iniciales son **exploratorias y sin calibración**. La nacional se refiere nominalmente a una categoría del 25 % y se adapta por `sqrt(p/25)` antes del cierre multiplicativo. Las categorías no desglosadas mantienen su residuo nacional fijo. No se descartan muestras incompatibles silenciosamente: se detiene con un error.

Se distingue P(exactamente X diputados), P(escaños ≥ Y) y P(ganar el puesto Y del orden de cocientes). El error Monte Carlo solo expresa precisión numérica, no error electoral. Más iteraciones no corrigen un perfil territorial ni una retención mal estimados.

## Histórico y siguientes pasos

Para regenerar el histórico:

```powershell
python -m pip install -r scripts/requirements.txt
python scripts/build-official-results.py
```

Se preservan los datos oficiales originales y la validación de 52 repartos y 350 escaños. El censo y los escaños de la simulación siguen siendo los de 2023; hay que actualizarlos con la convocatoria. El contraste independiente BOE/ISTAC sigue pendiente.

Prioridades siguientes: completar los documentos y categorías faltantes del catálogo; contrastar el registro definitivo de papeletas; incorporar datos canarios y europeas 2024 para sustituir proxies; estimar retenciones con encuestas/microdatos y calibrar incertidumbre mediante validación retrospectiva. Falta revisión visual en navegador de escritorio y móvil; las pruebas de geometría y React/DOM no la sustituyen.


## Iteración de perfiles y mapas

- Regenerar las referencias: `python scripts/build-reference-profiles.py`. Conserva el SHA-256 y las correspondencias de las papeletas del Excel oficial.
- Mapa principal por ganador en votos; mapa del último escaño con selección independiente, último cociente adjudicado, siguiente cociente y distancia exacta. El filtro del 1 % afecta a la disputa visible, nunca al motor legal.
- UPN–PP tiene una sola papeleta en Navarra. Se conserva como coalición porque los electos de UPN se integrarían en el Mixto, según el acuerdo publicado por RTVE el 14 de octubre.
- El panel de encuestas contrasta escaños regionales de Sigma Dos del 13 de octubre. No convierte escaños en votos. Se revisaron también los resúmenes de cierre territorial de RTVE, EFE y SER; los pactos del Senado no se aplican al Congreso.
- `territorialReferences` admite porcentajes provinciales publicados con partido, fuente, fecha, peso y porcentaje nacional comparable. Las autonómicas reciben un factor de influencia 0,2; es una convención de trabajo sin calibrar. No hay registros autonómicos ni porcentajes provinciales de encuestadoras cargados: falta reunir y revisar esos datos. La importación no sustituye esa investigación.
- Migración: se añaden las nuevas referencias y la papeleta navarra, preservando rutas propias. Se introducen rutas canarias de ejemplo sólo para orígenes sin rutas guardadas.


## Auditoría de anomalías y corrección de 2023

`node scripts/audit-projection.mjs` genera `data/research/projection-audit-20261017.json` para las 52 provincias: porcentajes, ganadores, ventajas, conservación de censo, 350 escaños, ajuste nacional y escenarios con/sin corrección. Los ganadores no se fuerzan en el motor. El escenario inicial corregido devuelve PSOE en Las Palmas y PP en Cádiz y Ceuta. Ningún resultado autonómico está cargado por defecto.

Se corrige otro fallo independiente: el perfil de Adelante Andalucía de 2023 sólo tenía voto en Cádiz y concentraba allí su objetivo nacional de 2026. Ahora se usa, explícitamente como proxy, la geografía de Sumar en las ocho provincias andaluzas. AA concurre separada de Frente Amplio; no se suman sus votos. Falta sustituir ese proxy por datos propios comparables de la candidatura.

El selector provincial ofrece España, con votos, porcentajes, diferencias y suma provincial de escaños. No calcula D’Hondt como si España fuera una circunscripción única.

El botón inicial activa `halfError2023`, un escenario opcional, desactivado inicialmente y persistente al guardar/exportar. Se conservan intactas las encuestas originales. `src/data/poll-errors-2023.json` contiene una observación preelectoral por cada uno de los ocho institutos, publicada hasta el cierre legal del 17 de julio de 2023. Se excluyen CIS y sondeos de cierre de urnas. La tabla de la interfaz enlaza las fuentes y distingue los porcentajes DYM y NC Report con contraste secundario.

El error firmado es resultado oficial definitivo menos estimación de encuesta. Se calcula el resultado desde el archivo oficial, incluyendo voto exterior. Media simple de los ocho: PP −1,67 pp, PSOE +3,74 pp, Vox −0,34 pp, Sumar −0,53 pp. No todos los partidos de izquierda fueron infravalorados.

Para cada encuesta actual, entre las categorías comparables publicadas, se calcula `delta = 0.5 * (error2023 - mediaErroresComparables)`. Se conserva así el total publicado y el residuo de partidos no desglosados. Si hubiera recorte de negativos se vuelve a conservar ese total. El error de Sumar 2023 se aplica a Sumar+Podemos y se reparte proporcionalmente a sus cuotas actuales; no se duplica. El agregado vuelve a usar la selección y pesos vigentes. Las diferencias relativas entre dos categorías se compensan exactamente en la mitad de su error relativo de 2023, salvo recorte. No equivale a una validación de que el sesgo se repetirá en 2026.

La migración sustituye solamente la mezcla inicial 70/20/10 de la revisión anterior. Conserva pesos diferentes editados deliberadamente, rutas, encuestas y referencias territoriales propias. Si esos parámetros siguen activos, sus resultados pueden diferir del escenario inicial auditado.


## Monte Carlo nacional y matriz completa de trasvases

La información de coaliciones queda plegada. Cada partido con voto estimado en la provincia tiene una fila de trasvases, incluyendo los que retienen inicialmente el 100 %. Cambiar una celda ajusta el remanente; si no cabe, se reducen proporcionalmente los otros destinos, sin sumar más del 100 %. Los supuestos iniciales de alianza son editables, no estimaciones empíricas. La migración reemplaza el antiguo ejemplo canario 25/5 solamente si no se había editado y conserva rutas propias.

La pestaña **Monte Carlo nacional** tiene worker y resultados independientes de la consulta probabilística provincial. Por defecto ejecuta 1.000 elecciones completas con semilla 20261018. `halfError2023` se fuerza a false en la entrada nacional y se excluye de su identidad: alternar el botón no cambia ni invalida estos resultados. Los otros cambios de escenario sí exigen repetir la simulación.

En cada iteración se sortea un vector conjunto de errores nacionales de los institutos activos con referencia en 2023, ponderados como en el agregado; si ninguno tiene referencia se usa el conjunto histórico. La intensidad es uniforme en [-0,5, 1,5], media 0,5, cubriendo repetición ampliada y error contrario. Los pesos de los institutos actuales se remuestrean mediante bootstrap bayesiano (factores exponenciales). El agregado sorteado se normaliza al presupuesto medido inicial para evitar que categorías parcialmente observadas superen el 100 % o consuman el residuo. Se añaden errores compartidos nacionales y autonómicos, provinciales, participación y trasvases. Escalas mínimas nacionales: nacional 1,5 pp nominales, autonómica 1 pp, provincial 1 pp, bloques 1 pp, participación 1 pp; valores superiores del escenario se mantienen.

Se conserva la distribución **conjunta** de escaños por provincia. La vista de 350 plazas usa la combinación más frecuente en cada una, y para el diputado n de cada partido calcula P(N >= n). Clasificación con el límite inferior Wilson del 95 %: consolidado >=99 %, muy probable >=90 %, en juego el resto. Los grupos son excluyentes y suman 350; nunca se suman como plazas distintas las aspiraciones de varios partidos al mismo escaño. El mapa colorea y rotula el **número** de plazas en juego por provincia, que puede ser mayor que uno, y al seleccionar muestra también las probabilidades de los partidos fuera del reparto modal.

El intervalo Wilson controla el ruido de Monte Carlo; no valida el modelo electoral. No hay escaños garantizados en sentido absoluto: los errores territoriales, la distribución de repetición histórica y las retenciones siguen necesitando calibración retrospectiva. Un 100 % observado en 50 iteraciones no se presenta como consolidación al 99 %.

Verificación de producción: `node scripts/verify-national-worker.mjs` ejecuta 1.000 congresos (350.000 escaños) y guarda `data/research/national-worker-verification.json`, con desglose de las 52 provincias y diagnóstico de Junts. El panel de encuestas explica su agregado y la sensibilidad al retirar cada instituto. Las fuentes discrepan: Sigma Dos publica 7 escaños; NC Report, 10–11 con 2,9 % nacional. El flash de 40dB. del 9 de octubre publica 7, y se muestra como contraste porque no es el registro del 5 de octubre activo en el catálogo.


## Vista pública de las disputas nacionales

La visualización agrupa consolidados y muy probables en una sola base consolidada. El hemiciclo utiliza sectores continuos con los colores de cada partido y un sector gris para las plazas en juego; los dos grupos suman 350. Las cifras pequeñas aparecen también en la leyenda.

El selector del mapa incluye solamente partidos que han obtenido al menos un diputado en alguna simulación. Para cada partido y provincia, el mapa muestra el máximo de diputados adicionales sobre su base consolidada observado en los escenarios, limitado al número de plazas provinciales en disputa. No se deben sumar las opciones de partidos rivales como plazas distintas.

El worker conserva el orden D’Hondt real de una elección representativa para cada distribución conjunta provincial observada. La vista selecciona el reparto conjunto más frecuente y coloca sus plazas en ese orden. La solidez se refiere al número de diputados del partido, mientras que las barras de una plaza disputada muestran P(partido gana ese puesto del orden de adjudicación). Son preguntas distintas y la interfaz lo indica. El panel de encuestas público muestra la tabla de datos sin los desplegables de edición o diagnósticos internos.

Para GitHub Pages, ver `PUBLICAR.md`. Los archivos originales descargados y la copia histórica del workspace se conservan localmente, fuera del repositorio; la aplicación y las pruebas utilizan los datos normalizados incluidos en `src/data` y la cartografía de `public/data`.

# fichalba

Fichaje de entrada para el taller de **JS Integral del Motor**. Una tablet colgada en la
pared: cada trabajador toca su nombre, marca su PIN y queda registrada la hora de entrada.
Nada más.

![La pantalla de la tablet: los nombres, y en verde los que ya han fichado](docs/imagenes/tablet-lista.png)

| Marcar el PIN | Fichado |
|---|---|
| ![teclado de PIN](docs/imagenes/tablet-pin.png) | ![confirmación en verde](docs/imagenes/tablet-ok.png) |

## Cómo se usa

1. La tablet enseña los nombres. Los que ya han fichado salen **en verde con su hora**.
2. Tocas tu nombre → marcas tu PIN de 4 cifras → "Buenos días, Javier — 08:02".
3. A los cuatro segundos vuelve sola a la lista.

El jefe entra en `/admin` con su PIN: ve los fichajes del día, se descarga el mes en Excel,
da de alta o de baja a la gente y anula un fichaje equivocado dejando el motivo.

![La pantalla de administración](docs/imagenes/admin.png)

## Ponerlo en marcha

No hay dependencias que instalar: sólo hace falta **Node 22 o superior**.

```bash
npm run primer-arranque    # da de alta a la plantilla y enseña los PIN UNA vez
npm start                  # http://localhost:3000
```

Para el día a día:

```bash
npm run trabajador -- alta "Nombre Apellido" 1234   # añadir a alguien
npm run trabajador -- lista                          # ver quién hay
npm run copia                                        # copia de seguridad, en caliente
npm test                                             # las reglas que no se pueden romper
```

Los pasos completos —dónde poner el servidor, cómo conectar la tablet y qué contarle a la
plantilla el primer día— están en **[docs/EMPEZAR.md](docs/EMPEZAR.md)**.

| Variable | Para qué | Por defecto |
|---|---|---|
| `FICHALBA_PUERTO` | Puerto | `3000` |
| `FICHALBA_BD` | Dónde se guarda la base de datos | `datos/fichalba.db` |
| `FICHALBA_TZ` | Zona horaria del taller | `Europe/Madrid` |
| `FICHALBA_RED` | Si se define, sólo se ficha desde esas IPs (`192.168.1.,88.12.34.56`) | sin restricción |
| `FICHALBA_TRAS_PROXY` | `1` si hay un proxy delante (Caddy, nginx) | `0` |

## Dónde se guarda todo

En **un solo fichero**: `datos/fichalba.db`. Ahí dentro están los trabajadores, los PIN
(cifrados), todos los fichajes y las anulaciones con su motivo. Copiar ese fichero es la
copia de seguridad completa. En la tablet no se queda nada.

Para mirarlo cómodamente, `/admin` → **Descargar el mes en Excel**: un `.xlsx` con el mes de
un vistazo (cada trabajador, cada día, su hora de entrada) y el detalle de todos los
fichajes. El Excel es una foto para consultar y enviar; el original es siempre el `.db`.

## Las tres cosas que no se negocian

1. **Un fichaje no se modifica ni se borra.** Nunca. Si está mal, el administrador lo
   *anula* dejando el motivo: el original se queda en la base de datos para siempre. No es
   una promesa del código, lo impide la propia base de datos con disparadores — y hay una
   prueba automática que lo comprueba.
2. **La hora es la del servidor.** El reloj que se ve en la tablet lo manda el servidor, así
   que aunque el iPad tenga la hora mal puesta, lo que se ve y lo que se guarda coinciden.
3. **La tablet no guarda nada.** Ni nombres, ni PIN, ni fichajes. Todo vive en el servidor.

## Documentación

| Documento | Qué contiene |
|---|---|
| [`docs/EMPEZAR.md`](docs/EMPEZAR.md) | **De cero a fichar el lunes**: dónde poner el servidor, la red, el primer día con la plantilla y la rutina |
| [`docs/TABLET.md`](docs/TABLET.md) | La **Galaxy Tab Active5**: dejarla clavada en el fichaje (Fijar apps) y cómo evitar que se fichen unos a otros — incluido por qué la huella no sirve para esto |
| [`docs/PROYECTO-FICHAJES.md`](docs/PROYECTO-FICHAJES.md) | El planteamiento completo: legalidad, RGPD, arquitectura |
| [`docs/ESTRUCTURA.md`](docs/ESTRUCTURA.md) | El diseño de la versión completa |
| [`docs/MODELO-DATOS.md`](docs/MODELO-DATOS.md) | El modelo de datos completo, con correcciones y cadena de integridad |
| [`docs/FASE-0-GESTORIA.md`](docs/FASE-0-GESTORIA.md) | Lo que hay que preguntar a la gestoría |
| [`docs/referencia/esquema-completo.sql`](docs/referencia/esquema-completo.sql) | El esquema completo, para cuando haga falta. Hoy **no se usa** |

## Dónde está esto, de verdad

Esto **registra la entrada y ya**. Para cumplir el art. 34.9 del Estatuto de los Trabajadores
falta registrar también la **salida**, y sacar un **resumen mensual**. Está a medio camino a
propósito: primero que la gente se acostumbre a tocar su nombre al entrar; lo demás se añade
encima sin rehacer nada (la tabla `fichaje` ya distingue entrada de salida).

Lo que hay hoy, y lo que falta:

- [x] Fichar la entrada desde la tablet, con PIN
- [x] Ver quién ha fichado y a qué hora
- [x] Anular un fichaje equivocado sin borrar el original
- [x] Alta y baja de trabajadores, cambio de PIN
- [x] Descargar el mes en **Excel** (y en CSV por fechas sueltas)
- [x] Copia de seguridad en caliente, sin parar el programa
- [ ] Fichar la salida  ← lo siguiente, cuando lo pidas
- [ ] Resumen mensual en PDF por trabajador
- [ ] Los tres documentos de RGPD (fase 0, con la gestoría)

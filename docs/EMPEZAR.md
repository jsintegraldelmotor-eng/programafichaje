# De cero a fichar el lunes

Los pasos, en orden, sin nada que no haga falta.

---

## Paso 1 — Decidir dónde vive el programa

Esto es lo único que hay que pensar. La tablet **no puede** llevar el programa dentro: es la
pantalla, no el cerebro. El programa tiene que correr en un ordenador que esté encendido a
las 8 de la mañana.

| Dónde | A favor | En contra |
|---|---|---|
| **El ordenador de la oficina** ← empieza por aquí | Gratis. Lo enciendes y ya. Todo se queda en el taller | Si está apagado, nadie ficha. La copia de seguridad la haces tú |
| Un VPS (5-10 €/mes) | Encendido siempre, copias automáticas, se ficha desde fuera | Cuesta dinero y hay que montarlo |
| Un mini-PC dedicado (60-100 €) | Encendido siempre, sigue todo en el taller | Hay que comprarlo y configurarlo |

**Mi consejo: empieza en el ordenador de la oficina.** Si a las dos semanas la cosa funciona
y os habéis acostumbrado, entonces se mueve a un sitio que esté siempre encendido — mover
esto es copiar una carpeta, nada más.

---

## Paso 2 — Arrancarlo la primera vez

En ese ordenador:

1. Instala **Node** (la versión LTS) desde [nodejs.org](https://nodejs.org). Siguiente,
   siguiente, siguiente.
2. Copia la carpeta del programa donde quieras que viva.
3. Abre una terminal ahí dentro y:

```bash
npm run primer-arranque
```

Eso da de alta a todo el mundo y **enseña los PIN una sola vez**. Apúntalos en un papel antes
de cerrar la ventana: en la base de datos sólo queda su huella cifrada, así que no hay forma
de recuperarlos. Si se pierde uno, le pones otro desde `/admin` y ya.

4. Arráncalo:

```bash
npm start
```

Tiene que decir `fichalba escuchando en http://localhost:3000`. Déjalo abierto.

### Que arranque solo al encender el ordenador

Para no depender de acordarte:

- **Windows:** crea un fichero `fichalba.bat` con estas dos líneas, y ponlo en la carpeta de
  inicio (tecla Windows + R → escribe `shell:startup` → Enter → pega el fichero ahí).
  ```bat
  cd C:\ruta\donde\esté\programafichaje
  npm start
  ```
- **Mac o Linux:** en `despliegue/fichalba.service` tienes el arranque automático con
  systemd preparado, o pregúntame y lo dejamos hecho.

---

## Paso 3 — Que la tablet llegue al programa

1. En el ordenador, averigua su dirección en la red:
   - **Windows:** abre la terminal y escribe `ipconfig`. Busca **Dirección IPv4**: algo como
     `192.168.1.35`.
   - **Mac:** Ajustes → Red → Wi-Fi → Detalles.
2. **Importante:** pide al router que a ese ordenador le dé **siempre la misma dirección**
   (en el router se llama "IP fija" o "reserva DHCP"). Si no, un día cambia sola y la tablet
   deja de encontrarlo.
3. **En Windows, la primera vez saldrá un aviso del cortafuegos** preguntando si permites
   Node en la red: di que **sí, en redes privadas**. Si no, la tablet no llegará.
4. En la tablet, con el wifi del taller, abre Chrome y entra en `http://192.168.1.35:3000`
   (con tu dirección). Deben salir los nombres.
5. Deja la tablet preparada: **[docs/TABLET.md](TABLET.md)** — añadirla a la pantalla de
   inicio y fijar la aplicación para que no se pueda salir.

---

## Paso 4 — El primer día con la gente

Cinco minutos en el taller, todos juntos. Lo que funciona es decirlo entero y de una vez:

- **Qué es:** "el registro de jornada que pide la ley; hay que fichar la entrada todos los
  días". No lo vendas como un control, porque no lo es: es una obligación de la empresa, y si
  no se lleva, la multa es para la empresa.
- **Cómo:** tocas tu nombre, marcas tus cuatro números, y ya. Tres segundos.
- **Su PIN, a cada uno en la mano**, no en voz alta.
- **Lo que ve todo el mundo:** quién ha fichado y a qué hora. Que se sepa desde el principio,
  que no parezca que se descubre después.
- **Lo que NO hace:** no lleva GPS, no sabe dónde estás, no usa la cámara, no toca vuestros
  móviles. Esto tranquiliza más de lo que parece.
- **Si te olvidas:** se lo dices al jefe y lo arregla. No pasa nada, pero el original queda
  registrado con el motivo — así es como tiene que ser.

Los primeros días, échales un ojo por `/admin` a media mañana: siempre hay alguien que se
olvida la primera semana.

---

## Paso 5 — La rutina

**Cada mañana** (diez segundos): mira `/admin` y comprueba que están todos. Al que falte, se
lo recuerdas.

**Cada mes** (un minuto): `/admin` → **Descargar el mes en Excel**. Guárdalo en una carpeta
del ordenador, y que la gestoría lo tenga si lo pide.

**Cada semana** (treinta segundos): haz la copia de seguridad.

```bash
npm run copia                          # queda en la carpeta copias/
npm run copia -- "D:\\Drive\\taller"    # o donde tú quieras: un pendrive, Drive...
```

Se puede hacer con gente fichando, no hay que parar nada. Es **toda** la información en un
solo fichero: si el ordenador se muere y no tienes esa copia, se han perdido los fichajes —
y ésos hay que conservarlos cuatro años. Guarda además **una copia de cada año** en un sitio
distinto del ordenador del taller.

---

## Dónde está la información, exactamente

```
programafichaje/
└── datos/
    └── fichalba.db        ← TODO está aquí dentro
```

**Un solo fichero.** Dentro están los trabajadores, los PIN (cifrados, no se pueden leer),
todos los fichajes y las anulaciones con su motivo. Copiar ese fichero es hacer la copia de
seguridad completa; restaurarla es volver a ponerlo en su sitio.

**En la tablet no hay nada.** Ni nombres, ni PIN, ni fichajes. La tablet enseña lo que le
manda el servidor y no se queda con nada.

**Para verlo cómodamente: el Excel.** En `/admin`, "Descargar el mes en Excel" da un fichero
con dos hojas:

- **Resumen del mes** — una fila por trabajador, una columna por día, y en cada casilla la
  hora a la que entró. De un vistazo ves el mes entero y los huecos.
- **Fichajes uno a uno** — el detalle: fecha, día de la semana, hora, quién, y si alguno fue
  anulado, con su motivo.

El fichero `.db` es el original y el que manda; el Excel es una foto para mirarlo y para
enviárselo a quien lo pida. Si alguien cambia el Excel, no cambia nada: los fichajes de
verdad siguen intactos, y eso es justo lo que la ley pide.

---

## Cuando esto ya funcione

Lo siguiente, por este orden y cuando tú lo digas:

1. **Fichar la salida.** Hoy sólo se registra la entrada. La ley pide las dos, así que esto
   es lo primero que falta.
2. **El resumen mensual en PDF** por trabajador, que es el formato que suele querer la
   gestoría.
3. **Los tres papeles de protección de datos** — ver [FASE-0-GESTORIA.md](FASE-0-GESTORIA.md).

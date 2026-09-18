# De cero a fichar el lunes

Cuatro pasos, y el último es opcional. No hace falta ningún ordenador encendido, ni pagar
nada, ni instalar programas.

---

## Paso 1 — La página ya está en internet

**Hecho.** La aplicación se publica sola cada vez que cambia algo de `app/`, y vive aquí:

### https://jsintegraldelmotor-eng.github.io/programafichaje/

Necesita esa dirección **sólo para abrirla la primera vez en la tablet**: después se queda
instalada dentro y funciona sola, incluso sin wifi.

> El repositorio es público porque GitHub sólo publica páginas gratis desde repositorios
> públicos. No hay riesgo: dentro no hay datos, ni PIN, ni fichajes, ni la dirección de tu
> hoja de cálculo. Sólo el código, que es un teclado numérico y una lista. Todo lo que
> identifica a tu taller se escribe en la tablet, nunca aquí.
>
> Si algún día hay que volver a montarlo: el flujo `.github/workflows/publicar.yml` enciende
> GitHub Pages él solo, no hay que tocar nada en los ajustes.

---

## Paso 2 — Instalarla en la tablet (5 minutos)

En la **Galaxy Tab Active5**, conectada al wifi:

1. Abre **Chrome** y entra en la dirección de arriba.
2. Menú **⋮ → Añadir a pantalla de inicio** (o *Instalar aplicación*). Acepta.
3. Cierra Chrome y abre la aplicación desde el icono nuevo: se abre a pantalla completa, sin
   barra de direcciones ni pestañas.

**A partir de aquí la tablet ya no necesita internet.** Puedes apagar el wifi y comprobarlo.

4. La primera vez te pide **los nombres** (ya vienen puestos los seis) y **tu PIN de jefe**.
   Toca *Crear*.
5. Te enseña **el PIN de cada uno, una sola vez**. Apúntalos en un papel: de los PIN sólo se
   guarda una huella cifrada, así que no se pueden recuperar. Si alguien pierde el suyo, le
   das otro desde la pantalla del jefe.

---

## Paso 3 — Dejar la tablet clavada en la aplicación (2 minutos)

Para que nadie salga de ahí a curiosear lo que tienes en la tablet:

1. **Ajustes → Pantalla → Barra de navegación → Botones.** La tablet viene con gestos y sin
   esto no hay ningún botón de "Recientes" que pulsar. Aparecen tres botones abajo;
   **Recientes es el de la izquierda, el de las tres rayas `|||`**.
2. **Ajustes → Seguridad y privacidad → Más ajustes de seguridad → Fijar apps.** Actívalo, y
   dentro activa **"Pedir PIN antes de dejar de fijar"**.
3. Abre la aplicación de fichar y pulsa **Recientes** (las tres rayas). Sale como una tarjeta.
4. Toca el **icono redondo de la aplicación justo encima de la tarjeta** → **Fijar esta
   aplicación**.

Para salir: mantén **Recientes + Atrás** a la vez unos 3 segundos, y te pide tu PIN.

Ojo: al **reiniciar** la tablet se suelta la fijación y hay que repetir el punto 2. Son diez
segundos, pero conviene saberlo.

Los pasos con más detalle, los ajustes que conviene repasar y la separación por usuarios
están en **[TABLET.md](TABLET.md)**.

---

## Paso 4 (opcional, pero merece la pena) — Que se escriba solo en una hoja

Diez minutos, una vez, y a partir de ahí **cada fichaje aparece solo como una fila en una
hoja de Google**, que puedes abrir desde el móvil o desde el ordenador y que se descarga como
Excel cuando quieras. Los pasos están en **[HOJA-DE-CALCULO.md](HOJA-DE-CALCULO.md)**.

Con esto te ahorras acordarte de descargar nada: la hoja se va llenando sola.

---

## El primer día con la gente

Cinco minutos en el taller, todos juntos. Lo que funciona es decirlo entero y de una vez:

- **Qué es:** "el registro de jornada que pide la ley; hay que fichar al entrar". No lo
  vendas como un control, porque no lo es: es una obligación de la empresa, y si no se lleva,
  la multa es para la empresa.
- **Cómo:** tocas tu nombre, marcas tus cuatro números. Tres segundos.
- **Su PIN, a cada uno en la mano**, no en voz alta.
- **Lo que ve todo el mundo:** quién ha fichado y a qué hora. Que se sepa desde el principio,
  no que parezca que se descubre después.
- **Lo que NO hace:** no lleva GPS, no sabe dónde estás, no usa la cámara y no toca vuestros
  móviles para nada. Esto tranquiliza más de lo que parece.
- **Si te olvidas:** se lo dices al jefe. No pasa nada, pero queda registrado con el motivo,
  que es como tiene que ser.

La primera semana, échale un ojo a media mañana: siempre hay alguien que se olvida.

---

## La rutina

**Cada mañana**, diez segundos: mira la tablet al pasar. Los que faltan salen en gris.

**Si conectaste la hoja de Google** (paso 4): nada más. Se llena sola y ya está fuera de la
tablet. Cuando la gestoría pida el mes, abres la hoja y **Archivo → Descargar → Excel**.

**Si no la conectaste**, una vez al mes: engranaje → tu PIN → **Descargar ese mes**. El
fichero se guarda en la tablet (Descargas) y desde ahí lo mandas a tu correo o a Drive.
Guárdalo en algún sitio que no sea la tablet: es lo que te queda si un día se pierde, se
rompe, o alguien borra los datos de Chrome.

---

## Cuando esto ya funcione

1. **Fichar la salida.** Hoy sólo se registra la entrada, y la ley pide las dos.
2. **Los tres papeles de protección de datos** — ver [FASE-0-GESTORIA.md](FASE-0-GESTORIA.md).
3. Si algún día hace falta fichar desde dos sitios a la vez, o desde los móviles, la versión
   con servidor ya está escrita y probada en [`../servidor/`](../servidor/).

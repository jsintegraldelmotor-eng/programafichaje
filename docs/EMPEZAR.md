# De cero a fichar el lunes

Tres pasos. No hace falta ningún ordenador encendido, ni pagar nada, ni instalar programas.

---

## Paso 1 — Poner la página en internet (una vez, 5 minutos)

La aplicación es una página web. Necesita una dirección en internet **sólo para abrirla la
primera vez en la tablet**: después se queda instalada dentro y ya funciona sola, incluso sin
wifi. Esa dirección la da GitHub gratis:

1. En el repositorio, **Settings → Pages**.
2. En *Source*, elige **GitHub Actions**.
3. Ya está. Cada vez que cambie algo de `app/`, se vuelve a publicar solo.

La dirección queda así:
`https://jsintegraldelmotor-eng.github.io/programafichaje/`

> **Un aviso:** GitHub sólo publica páginas gratis desde repositorios **públicos**. Este está
> en privado, así que tienes dos opciones:
>
> - **Ponerlo público** (Settings → General → abajo del todo → *Change visibility*). No hay
>   ningún riesgo: dentro no hay datos, ni PIN, ni nombres de nadie. Sólo el código, que es
>   un teclado numérico y una lista.
> - **Dejarlo privado** y pagar GitHub Pro (unos 4 $/mes), que permite publicar desde
>   repositorios privados.
>
> Si no te convence ninguna, dímelo: la página son ficheros sueltos y se puede subir a
> cualquier otro sitio gratis.

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

1. **Ajustes → Seguridad y privacidad → Más ajustes de seguridad → Fijar apps.** Actívalo, y
   dentro activa **"Pedir PIN antes de dejar de fijar"**.
2. Abre la aplicación de fichar, pulsa **Recientes**, toca el **icono de la aplicación**
   arriba de la tarjeta → **Fijar esta aplicación**.

Para salir: **Atrás + Recientes** a la vez, y te pide tu PIN de desbloqueo (o tu huella).

Ojo: al **reiniciar** la tablet se suelta la fijación y hay que repetir el punto 2. Son diez
segundos, pero conviene saberlo.

Los pasos con más detalle, los ajustes que conviene repasar y la separación por usuarios
están en **[TABLET.md](TABLET.md)**.

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

**Cada mes**, un minuto: engranaje → tu PIN → **Descargar ese mes**. El fichero se guarda en
la tablet (Descargas) y desde ahí lo mandas a tu correo, a Drive o a la gestoría, como
prefieras.

Ese Excel es el registro. Guárdalo en algún sitio que no sea la tablet: es lo que te queda si
un día la tablet se pierde, se rompe o alguien borra los datos de Chrome. No hace falta nada
más complicado que eso.

---

## Cuando esto ya funcione

1. **Fichar la salida.** Hoy sólo se registra la entrada, y la ley pide las dos.
2. **Los tres papeles de protección de datos** — ver [FASE-0-GESTORIA.md](FASE-0-GESTORIA.md).
3. Si algún día hace falta fichar desde dos sitios a la vez, o desde los móviles, la versión
   con servidor ya está escrita y probada en [`../servidor/`](../servidor/).

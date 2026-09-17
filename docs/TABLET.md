# La tablet: dejarla clavada en el fichaje, y que nadie fiche por otro

Dos preguntas, dos respuestas. La segunda tiene una parte que no te va a gustar.

---

## 1. Que el iPad no tenga nada más (y nada sensible)

### Lo primero: la aplicación no guarda nada en el iPad

Esto es una decisión de diseño, no una casualidad. La aplicación **no usa memoria del
navegador, ni guarda la lista de nombres, ni los PIN, ni sesiones** en la tablet. La lista
se pide al servidor cada vez y vive sólo mientras la pantalla está encendida.

Traducido: si mañana pierdes el iPad o te lo roban, **quien lo abra no encuentra ni un
fichaje ni un nombre**. Como mucho, la página de "toca tu nombre" — y sin PIN no pasa de ahí.
Todo lo demás está en el servidor.

### Segundo: dejar el iPad clavado en la aplicación

Se llama **Acceso Guiado** y ya viene en el iPad. No hace falta comprar nada ni borrar el
aparato:

1. **Ajustes → Accesibilidad → Acceso Guiado** → actívalo.
2. Dentro, **Ajustes de código → Definir código de Acceso Guiado**. Pon uno que sólo sepas
   tú. En esa misma pantalla puedes activar **Touch ID**, y entonces sales con tu huella:
   éste sí es un buen uso de la huella del iPad (ver §2).
3. Abre Safari, entra en la dirección del fichaje y añádela a la pantalla de inicio
   (**Compartir → Añadir a pantalla de inicio**). Así se abre a pantalla completa, sin la
   barra de Safari.
4. Abre esa aplicación y pulsa **tres veces seguidas** el botón de inicio (o el botón
   superior en los iPad sin botón de inicio) → **Iniciar**.

A partir de ahí el iPad **no sale de esa pantalla**: ni se va al escritorio, ni cambia de
aplicación, ni se ve una notificación. Para salir: tres pulsaciones + tu código (o tu huella).

Dos avisos honestos:

- Tras apagar y encender el iPad, **comprueba que vuelve solo al Acceso Guiado**. Si no
  vuelve, se reactiva en diez segundos con los pasos 4. Merece la pena comprobarlo una vez.
- Si algún día el iPad se va a usar para otra cosa a la vez, esto es exactamente lo que
  querías: sales con el código, haces lo tuyo, y vuelves a iniciarlo.

**Si el iPad va a ser SÓLO para fichar**, existe algo más férreo: el *modo de aplicación
única*, que se configura con Apple Configurator desde un Mac y aguanta reinicios sin
intervención. Obliga a borrar y reconfigurar el iPad. Para un taller, el Acceso Guiado
sobra; esto queda apuntado por si algún día lo quieres.

### Tercero: repasar el propio iPad

Media hora, una vez, y te quitas el problema de encima:

- **Sin cuenta de iCloud** o con una cuenta creada sólo para esto. Nada de tu Apple ID
  personal ni el de la empresa con el correo dentro.
- **Sin Mail, sin Fotos, sin WhatsApp, sin archivos.** Si no está, no se puede filtrar.
- **Código de desbloqueo** en el iPad (Ajustes → Touch ID y código) y bloqueo automático.
- **Siri desactivada** y **avisos sin vista previa** en la pantalla bloqueada.
- En **Safari**: autorrelleno desactivado y sin contraseñas guardadas.
- **AirDrop** en "Desactivado".

Con esto, la respuesta a tu pregunta es: **el iPad no llega a contener ningún dato
sensible**, ni siquiera los fichajes.

---

## 2. Que no se fichen unos a otros

### La huella del iPad no sirve para esto (y conviene saber por qué)

Es la respuesta que menos gusta, pero es la correcta.

El Touch ID del iPad contesta a una sola pregunta: *"¿este dedo es uno de los que están
registrados en este iPad?"*. **Nunca dice de quién es el dedo.** Se pueden registrar hasta
cinco huellas, y el sistema no distingue entre ellas: si registras a cinco trabajadores,
cualquiera de los cinco desbloquea cualquier cosa y la tablet no sabe cuál ha sido. Para
identificar a quién ficha, es literalmente inútil.

Y hay una segunda razón, más seria: registrar las huellas de la plantilla **para controlar
la presencia** es tratar datos biométricos. La AEPD publicó en noviembre de 2023 una guía
sobre control de presencia con biometría que, en la práctica, cierra esa puerta para el
control horario: se considera desproporcionado salvo casos muy justificados. Un taller de
ocho personas no es ese caso. Esto lo debe confirmar la gestoría, pero mi recomendación es
clara: **la huella, para salir del Acceso Guiado y para nada más**.

### Lo que sí funciona, por orden de eficacia real

**1. El PIN — ya está puesto.** Cada trabajador tiene su PIN de cuatro cifras. No es una
barrera criptográfica: es lo que convierte "le doy al nombre de Manolo" en un acto
deliberado y consciente. Si alguien ficha por otro, ha tenido que pedirle el PIN. Eso deja
de ser un descuido y pasa a ser un asunto disciplinario, y todo el mundo lo entiende.
Además, cinco PIN fallidos seguidos bloquean a esa persona un minuto: se acabó el probar.

**2. La lista a la vista — ya está puesta.** La pantalla enseña **quién ha fichado y a qué
hora**, en verde. En un taller de ocho personas que se ven la cara todos los días, ése es el
control antifraude que de verdad funciona: si Manolo aparece fichado a las 8:02 y entra por
la puerta a las 9:15, lo ve todo el mundo, empezando por ti.

**3. Dónde cuelgas la tablet.** A la entrada y **a la vista**, no en un rincón. Suena
tonto y es probablemente la medida más eficaz de las tres.

**4. Sólo desde el wifi del taller — ya está puesto, apagado.** Si algún día publicas esto
en internet para fichar desde el móvil, arrancar el servidor con `FICHALBA_RED` hace que sólo
se pueda fichar desde la conexión del taller. Mientras el servidor esté sólo en la red
local, no hace falta.

**5. La foto del momento — NO está puesta, y creo que no debes ponerla todavía.** La cámara
frontal saca una foto al fichar y se guarda junto al fichaje. Es la medida que de verdad
acaba con cualquier discusión, y es un día de trabajo añadirla. Pero mete la aplicación en
un terreno con papeleo de protección de datos (hay que informar por escrito) y cambia el
ambiente del taller. Mi consejo: **guárdatela en la recámara**. Si algún día hay una
sospecha real, se activa. Antes, no.

### Lo que NO tiene arreglo técnico

Que alguien fiche a su hora y se vaya a desayunar una hora. Eso no lo resuelve ningún
programa: lo resuelve mirar. Conviene tenerlo claro para no gastar dinero persiguiéndolo.

---

## Resumen

| Lo que te preocupaba | Cómo queda |
|---|---|
| Datos sensibles en el iPad | Ninguno: la aplicación no guarda nada en la tablet |
| Que salgan de la aplicación | Acceso Guiado con código (o tu huella) para salir |
| Que se fichen unos a otros | PIN por persona + la lista a la vista de todos + bloqueo por intentos |
| La huella para identificar | No sirve técnicamente y además es terreno minado de RGPD |

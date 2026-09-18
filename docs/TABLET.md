# La tablet: Samsung Galaxy Tab Active5 (SM-X306B)

Cómo dejarla clavada en el fichaje para que nadie ande viendo lo que hay dentro, y qué se
puede hacer de verdad contra que se fichen unos a otros.

> **Ojo:** esto es Android, no iPad. La función que en Apple se llama *Acceso Guiado*, en
> Samsung se llama **Fijar apps**. Los pasos de abajo son los de One UI (la capa de Samsung);
> si algún nombre no te cuadra exactamente, busca "fijar" en el buscador de Ajustes.

---

## 1. Que no vean lo que hay en la tablet

Tienes cosas internas del taller en ella, así que el trabajador tiene que poder fichar **sin
poder salir de la pantalla de fichar**. Hay dos niveles; empieza por el primero.

### Nivel 1 — Fijar la aplicación (2 minutos, gratis, es lo que necesitas)

Android deja "clavar" una aplicación en pantalla: el botón de inicio, el de atrás y el de
recientes dejan de funcionar hasta que metas tu PIN.

**Preparar, una sola vez:**

1. **Ajustes → Seguridad y privacidad → Más ajustes de seguridad → Fijar apps.**
   (en algunas versiones se llama *Anclar ventanas* o *Fijar ventanas*)
2. Actívalo, y dentro activa también **"Pedir PIN antes de dejar de fijar"** — esto es lo
   importante: sin esa opción, cualquiera la suelta con dos toques.
3. Asegúrate de que la tablet tiene **PIN o patrón de desbloqueo** (Ajustes → Pantalla de
   bloqueo). Sin eso, lo anterior no sirve de nada.

**Poner la aplicación de fichar en la pantalla de inicio:**

4. Abre **Chrome** y entra en la dirección del fichaje.
5. Menú **⋮ → Añadir a pantalla de inicio** (o "Instalar aplicación"). Así se abre a pantalla
   completa, sin la barra de direcciones ni las pestañas de Chrome.

**Antes de nada: ¿tienes botones abajo o no?**

La Tab Active5 viene de fábrica con **gestos**, y entonces **no existe ningún botón de
"Recientes"** que pulsar. Se ve una rayita fina abajo y nada más. Antes de seguir, pon los
botones —hace esto mucho más fácil, y además te va a hacer falta para salir:

**Ajustes → Pantalla → Barra de navegación → Botones.**

Aparecen tres abajo. En Samsung el orden, de izquierda a derecha, es:

```
   |||              ⌂              <
 Recientes        Inicio          Atrás
```

**Recientes es el de la izquierda, el de las tres rayas.** Ése es el que yo llamaba
"Recientes".

**Fijarla (y repetirlo después de cada reinicio):**

6. Abre la aplicación de fichar.
7. Pulsa **Recientes** (las tres rayas, abajo a la izquierda). Sale la aplicación como una
   *tarjeta* en el centro.
8. Toca el **icono redondo de la aplicación que hay justo encima de la tarjeta** (no la
   tarjeta: el iconito de arriba). Se abre un menú pequeño.
9. Elige **Fijar esta aplicación** (según la versión: *Anclar esta app* o un icono de
   chincheta 📌).

Ya está: la tablet no sale de ahí. **Para salir:** mantén pulsados **Recientes + Atrás** a la
vez unos 3 segundos, y te pedirá el PIN de desbloqueo.

> Si prefieres quedarte con los gestos: para abrir Recientes hay que **deslizar hacia arriba
> desde el borde de abajo y NO soltar el dedo** — mantenerlo un instante hasta que aparezcan
> las tarjetas. Si sueltas enseguida, te vas al escritorio y por eso parece que no hay nada.
> Para soltar la aplicación fijada, desliza hacia arriba y mantén.

Dos avisos honestos:

- **Al reiniciar la tablet, la fijación se pierde.** Hay que repetir los pasos 6-8. Son diez
  segundos, pero conviene saberlo: si un día alguien la reinicia, revísala.
- Si alguien suelta la aplicación, lo único que puede hacer con ella es fichar: para ver los
  fichajes o tocar nada hace falta tu PIN de jefe.

### Nivel 2 — Un usuario aparte (si lo interno es serio)

Si lo que hay en la tablet no puede verlo nadie bajo ningún concepto, Android tiene usuarios
separados, como en un ordenador: **Ajustes → Cuentas y copia de seguridad → Usuarios**
(o busca "Usuarios" en Ajustes) → **Añadir usuario**.

Creas un usuario "Taller — fichaje" que **sólo** tiene Chrome y el acceso al fichaje. Ese
usuario **no ve** tus aplicaciones, ni tus archivos, ni tus fotos, ni tu correo: no es que
estén escondidos, es que para ese usuario no existen. Dejas la tablet encendida en ese
usuario, y para volver al tuyo hace falta tu PIN o tu huella.

Es media hora de faena y es la separación de verdad. Si el nivel 1 te vale, no lo necesitas.

**Cuidado con una cosa:** si creas un usuario nuevo, la aplicación hay que instalarla *en ese
usuario*, y los fichajes que se guarden ahí sólo se ven desde ahí. Decide en qué usuario va a
vivir el fichaje **antes** de empezar a usarlo de verdad, no después.

### Nivel 3 — Modo quiosco de Samsung (Knox)

Existe, es lo que usan las empresas con cientos de tablets, aguanta reinicios solo y se
gestiona a distancia. Para un taller con una tablet es pasarse de largo, y encima se paga.
Queda apuntado por si algún día tienes cinco.

### Cuatro ajustes más que valen la pena

- **Que no se apague la pantalla**: Ajustes → Pantalla → Apagado de pantalla → el máximo.
  (colgada y enchufada, mejor que esté siempre despierta)
- **Avisos sin contenido en la pantalla de bloqueo**: Ajustes → Notificaciones → Pantalla de
  bloqueo → Ocultar contenido. Que no se lea un WhatsApp desde la pared.
- **La Tab Active5 puede funcionar enchufada sin batería** (mira en Ajustes → si aparece
  *Modo sin batería* / *No battery mode*). Si lo tiene, para una tablet que va a estar
  colgada y enchufada para siempre es justo lo que quieres: la batería no se hincha.
- **El wifi sólo hace falta el primer día**, para abrir la página e instalarla. Después la
  aplicación funciona sola: puedes apagar el wifi y los datos móviles y sigue fichando.

---

## 2. Que no se fichen unos a otros

### La huella de la tablet no sirve para esto

La Tab Active5 lee la huella en el botón de encendido, y es muy buena para desbloquear la
tablet. Pero para esto no vale, y la razón es de fondo, no de Samsung:

El lector contesta a **una sola pregunta**: *"¿este dedo es uno de los registrados en esta
tablet?"*. **Nunca dice de quién es el dedo.** Puedes registrar varias huellas y el sistema
no distingue entre ellas: si registras a Salvador, a Aziz y a Paco, cualquiera de los tres
abre lo de cualquiera y la tablet no sabe cuál ha sido. Para saber *quién* ficha es
literalmente inútil, y eso no lo arregla ningún programa: es así como funciona Android (y
el iPhone igual).

Y hay una segunda razón, más seria: registrar las huellas de la plantilla **para controlar la
presencia** es tratar datos biométricos. La guía que publicó la AEPD en noviembre de 2023
sobre control de presencia con biometría prácticamente cierra esa puerta para el control
horario: se considera desproporcionado salvo casos muy justificados, y un taller de siete
personas no es ese caso. Que lo confirme la gestoría, pero mi recomendación es clara.

**Dónde sí es útil la huella:** para soltar la aplicación fijada y para entrar en tu usuario.
Ahí es perfecta, porque la pregunta que contesta ("¿eres tú, el jefe?") sí es la correcta.

### Lo que sí funciona, por orden de eficacia real

**1. El PIN — ya está puesto.** Cada uno tiene el suyo, de cuatro cifras. No es una barrera
criptográfica: es lo que convierte "le doy al nombre de Paco" en un acto deliberado que ha
tenido que pasar por pedirle el PIN a Paco. Eso deja de ser un descuido y pasa a ser un
asunto disciplinario, y todo el mundo lo entiende sin que haya que explicarlo. Además, cinco
PIN fallidos seguidos bloquean a esa persona un minuto: se acabó el ir probando.

**2. La lista a la vista — ya está puesta.** La pantalla enseña **quién ha fichado y a qué
hora**, en verde, todo el día. En un taller de siete personas que se ven la cara, ése es el
control que de verdad funciona: si Paco aparece fichado a las 8:02 y entra por la puerta a
las 9:15, lo ve todo el mundo, empezando por ti.

**3. Dónde cuelgas la tablet.** A la entrada y **a la vista**, no en un rincón. Suena tonto y
probablemente es la medida más eficaz de las tres.

**4. La foto del momento — NO está puesta, y creo que todavía no debes ponerla.** La cámara
frontal saca una foto al fichar y se guarda con el fichaje. Acaba con cualquier discusión, y
es un día de trabajo añadirla. Pero mete la aplicación en terreno de protección de datos (hay
que informar por escrito) y cambia el ambiente del taller. **Guárdatela en la recámara:** si
algún día hay una sospecha real, se activa en un día. Antes, no.

### Lo que no tiene arreglo técnico

Que alguien fiche a su hora y se vaya a desayunar una hora. Eso no lo resuelve ningún
programa: lo resuelve mirar. Conviene tenerlo claro para no gastar dinero persiguiéndolo.

---

## Resumen

| Lo que te preocupaba | Cómo queda |
|---|---|
| Que vean lo interno de la tablet | **Fijar apps** con PIN para soltarla; si es serio, un usuario aparte |
| Los fichajes | Se guardan en la tablet. Descarga el Excel una vez al mes y guárdalo fuera |
| Que se fichen unos a otros | PIN por persona + lista a la vista + bloqueo tras cinco fallos |
| La huella para identificar | No sirve técnicamente, y además es terreno minado de RGPD |

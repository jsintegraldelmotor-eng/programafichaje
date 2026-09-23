# Pasar el fichaje a otro aparato

De la tablet a un ordenador, o al revés. Se lleva **todo**: los nombres, los PIN de cada uno,
el tuyo de jefe, los fichajes que ya hay y la hoja de cálculo conectada. Nadie tiene que
aprender un PIN nuevo y la hoja sigue llenándose igual.

Diez minutos. Hazlo con calma y **en este orden**.

---

## 1. En el aparato viejo: sacar el fichero

1. Abre la aplicación → **engranaje → tu PIN de jefe**.
2. Baja hasta **"Pasar a otro aparato"** → **Descargar el fichero**.
3. Se guarda un fichero llamado `fichalba_traspaso_2026-09-23.json` (con la fecha de hoy).

**¿Dónde se ha guardado?** En la tablet, en **Descargas**: abre la aplicación **Mis archivos**
→ **Descargas**, y ahí está.

**Para que llegue al ordenador**, cualquiera de éstas:

- **Por correo:** mantén pulsado el fichero → **Compartir** → Gmail → envíatelo a ti mismo.
  En el ordenador abres el correo y descargas el adjunto.
- **Por Drive:** Compartir → Drive → subir. En el ordenador, drive.google.com → descargar.
- **Por cable:** conecta la tablet al ordenador, en la tablet elige **Transferencia de
  archivos**, y copia el fichero de la carpeta Descargas.

> ⚠️ **Ese fichero lleva los PIN de todo el mundo.** No es para el grupo de WhatsApp del
> taller: guárdalo como guardarías las llaves, y bórralo en cuanto el aparato nuevo funcione.

---

## 2. En el ordenador: abrir la aplicación

Con **Chrome** o **Edge**, entra en:

### https://jsintegraldelmotor-eng.github.io/programafichaje/

Si quieres que se abra como un programa más, sin barra de direcciones: en Chrome, el icono de
instalar que sale a la derecha de la barra (o **⋮ → Enviar, guardar y compartir → Instalar
página como aplicación**). En Edge: **··· → Aplicaciones → Instalar este sitio como una
aplicación**. Queda un icono en el escritorio.

No hace falta instalar nada más: ni Node, ni programas, ni permisos raros.

---

## 3. En el ordenador: traer los datos

La aplicación arranca **vacía**, pidiéndote los nombres y una contraseña de jefe. Es normal:
el ordenador todavía no sabe nada. **No rellenes nada de eso** — si lo haces, te crea una
instalación nueva con PIN distintos, que es justo lo que no quieres. Debajo del botón
verde hay una línea:

> ¿Ya lo tenías funcionando en otro aparato?
> **Traer sus datos desde un fichero**

Púlsala, elige el fichero del paso 1, y ya está: salen los seis nombres, los que hubieran
fichado hoy aparecen en verde, y todo lo de antes está donde estaba.

> **¿Ya lo habías configurado a mano en el ordenador?** Entonces esa pantalla ya no sale, pero
> no pasa nada: **engranaje → tu PIN → "Pasar a otro aparato" → Traer datos de otro aparato**.
> Avisa de que sustituye todo lo que haya en el ordenador y te pide confirmación.

**Compruébalo antes de dar el cambio por bueno:**

- Ficha con alguien usando **su PIN de siempre**. Tiene que entrar.
- Entra con **tu PIN de jefe** y mira que están los fichajes de los días anteriores.
- Si tenías la hoja de Google conectada, en la pantalla del jefe debe poner
  **"✓ Conectada y al día"**, y el fichaje de prueba debe aparecer en la hoja.

---

## 4. Y sólo entonces: apagar el viejo

Cuando el aparato nuevo funcione, **deja de fichar en el viejo**. Si los dos siguen en marcha,
cada uno lleva su cuenta por su lado y acabaréis con dos registros a medias.

En la tablet, para que nadie fiche ahí por costumbre, quita el icono de la pantalla de inicio
(mantener pulsado → Eliminar). Eso no borra nada, sólo quita el acceso.

> Por si acaso: al traer el fichero, el aparato nuevo se identifica con un número distinto del
> viejo. Así, si alguien ficha en la tablet por error, su fila no pisa a las del ordenador en
> la hoja de cálculo — aparecerán las dos y se ve lo que ha pasado.

---

## Si se ha perdido el fichero y la tablet ya no está

Entonces los PIN no se pueden recuperar: de cada uno se guarda sólo una huella cifrada, a
propósito, para que nadie pueda leerlos. Pero si los tienes apuntados en papel, **puedes
volver a ponerlos tal cual y de una sentada**.

En la pantalla de primer arranque, escribe en cada línea **el nombre y su PIN detrás**:

```
Salvador 7391
Aziz 1087
Zakaria 2244
Israel
```

Vale con espacio, coma o guion. **Al que no le pongas PIN, se le inventa uno** (arriba,
Israel). Tu contraseña de jefe la escribes debajo, como siempre. Con eso queda todo el taller
montado igual que estaba, de una vez.

Si la instalación ya está hecha y sólo quieres corregir a uno: pantalla del jefe →
**Cambiar PIN** → te deja escribir el que quieras.

---

## Esto también sirve de red de seguridad

Aunque no vayas a cambiar de aparato: **ese fichero es una copia completa**. Si un día el
aparato se rompe o alguien borra los datos del navegador, con él vuelves a estar como estabas
en cualquier otro sitio. Sacarlo de vez en cuando no cuesta nada.

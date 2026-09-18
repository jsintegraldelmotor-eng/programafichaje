# Que los fichajes se escriban solos en una hoja de cálculo

Con esto, cada vez que alguien ficha **aparece una fila nueva en una hoja de Google**, al
momento, sin que nadie toque nada. La abres desde tu móvil o desde el ordenador y ves el día
según va pasando.

Es opcional: la aplicación funciona igual sin esto, y el botón de Excel sigue estando. Pero
si lo que quieres es "que escriba en una hoja y ya", esto es exactamente eso.

> **Por qué Google y no un Excel del ordenador:** una página web no puede abrir un fichero de
> tu disco e ir escribiendo en él; eso no existe en Android. Lo que sí puede es mandar cada
> fichaje a una hoja que vive en internet. La hoja de Google **se abre con Excel** y se
> descarga como `.xlsx` cuando quieras (Archivo → Descargar → Microsoft Excel), así que a
> efectos prácticos tienes tu Excel, y encima actualizado solo.

**No hay ningún servidor nuestro en medio.** La tablet le habla directamente a tu hoja.

---

## Montarlo (10 minutos, una vez)

### 1. La hoja

En [drive.google.com](https://drive.google.com): **Nuevo → Hojas de cálculo de Google**.
Ponle de nombre, por ejemplo, *Fichajes del taller*. Déjala vacía: las columnas las crea
sola la primera vez.

### 2. El programita que va dentro

1. En esa misma hoja: menú **Extensiones → Apps Script**.
2. Se abre un editor con algo de código de ejemplo. **Bórralo todo.**
3. Copia y pega entero el contenido de
   [`hoja-de-calculo/Codigo.gs`](../hoja-de-calculo/Codigo.gs).
4. Busca arriba esta línea y **cambia la palabra** por una tuya (sin espacios, la que
   quieras; es la que impide que un desconocido escriba en tu hoja):

   ```js
   const CLAVE = 'cambia-esta-palabra';
   ```

5. Guarda con el icono del disquete.

### 3. Publicarlo

1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En el engranaje de la izquierda, elige **Aplicación web**.
3. Rellena así:
   - *Descripción*: `fichalba`
   - *Ejecutar como*: **Yo** (tu cuenta)
   - *Quién tiene acceso*: **Cualquier usuario**
4. **Implementar**. Te pedirá permiso para que el script use tu hoja: acéptalo.
   - Saldrá un aviso de **"Google no ha verificado esta aplicación"**. Es normal: la
     aplicación eres tú mismo, la acabas de escribir. Pincha en **Configuración avanzada** y
     luego en **Ir a fichalba (no seguro)**.
5. Copia la **URL de la aplicación web**. Es larga y **termina en `/exec`**.

> ⚠️ **Esa dirección es como una llave: no la publiques ni la metas en el repositorio.**
> Quien la tenga, junto con tu clave, puede escribir en la hoja. Sólo va a la tablet.

### 4. Conectarla en la tablet

1. En la aplicación de fichar, toca el **engranaje** y mete tu PIN de jefe.
2. Baja a **Hoja de cálculo de Google**.
3. Pega la dirección en la primera casilla y tu palabra clave en la segunda.
4. **Conectar**.

Si todo está bien pone **"✓ Conectada y al día"**. Si no, te dice qué ha fallado (lo más
habitual: la clave no es la misma que pusiste en el paso 2.4, o publicaste la aplicación como
"Sólo yo" en vez de "Cualquier usuario").

Haz la prueba: ficha con cualquiera y mira la hoja. La fila aparece en el momento.

---

## Cómo queda la hoja

| Fecha | Hora | Trabajador | Estado | Ref |
|---|---|---|---|---|
| 2026-09-18 | 08:02 | Salvador | Válido | 7c1683-7 |
| 2026-09-18 | 08:09 | Aziz | ANULADO — fichó por error, hoy libra | 7c1683-8 |
| 2026-09-18 | 08:14 | Zakaria | Válido | 7c1683-9 |

- **Estado** dice si el fichaje vale. Cuando anulas uno desde la tablet, **la fila no se
  borra**: se marca con el motivo. Así se ve lo que pasó, que es justo lo que la ley pide.
- **Ref** es el número interno del fichaje. No lo toques: es lo que evita que se dupliquen
  filas si la tablet reintenta un envío.

Puedes ordenar, filtrar y hacer tus cuentas en **otras hojas** del mismo libro sin problema.
Lo único: **no cambies a mano las filas de la hoja `Fichajes`**, porque el registro de verdad
está en la tablet y esa hoja es su reflejo.

---

## Qué pasa si se va internet

Nada. Se sigue fichando exactamente igual: el fichaje se guarda en la tablet al instante, y
lo de la hoja va por detrás. Lo que no se haya podido mandar se queda en cola y sube solo
cuando vuelva la conexión.

En la pantalla del jefe verás *"2 fichajes sin enviar a la hoja"* mientras tanto, y un botón
para mandarlos a mano si tienes prisa.

---

## Si algún día quieres quitarlo

Borra la dirección de la casilla y toca **Conectar**. La aplicación deja de mandar nada y
sigue funcionando como antes, con su botón de Excel.

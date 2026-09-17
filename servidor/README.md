# La versión con servidor — aparcada

**Esto no hace falta para nada hoy.** La aplicación que se usa está en
[`../app/`](../app/) y vive entera dentro de la tablet: no necesita servidor, ni ordenador
encendido, ni red.

Lo que hay en esta carpeta es la misma aplicación construida como servidor (Node + SQLite),
de cuando el plan era tenerla en un ordenador del taller. Se conserva funcionando y con sus
pruebas porque el día que haga falta alguna de estas cosas, será el punto de partida:

- **Fichar desde varios sitios a la vez** (dos tablets, o el móvil de cada uno).
- **Que los fichajes no vivan sólo en la tablet**, con copias automáticas.
- **Que la gestoría o la Inspección puedan entrar a consultar** sin pedirte el Excel.

Para arrancarla: `npm run test-servidor` pasa sus pruebas, y
`node servidor/src/servidor.js` la levanta en el puerto 3000. Los detalles del diseño
completo están en [`../docs/MODELO-DATOS.md`](../docs/MODELO-DATOS.md).

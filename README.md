# fichalba

Registro de jornada de **JS Integral del Motor**. Aplicación web instalable (PWA) para que
los operarios fichen desde su móvil o desde la tablet del taller, con el registro diario que
exige el art. 34.9 del Estatuto de los Trabajadores.

> **Estado: diseño.** Todavía no hay aplicación. Lo que hay es el planteamiento, la
> estructura del proyecto y el modelo de datos de la fase 1, para revisar antes de escribir
> código.

## Por dónde empezar a leer

| Documento | Qué contiene |
|---|---|
| [`docs/PROYECTO-FICHAJES.md`](docs/PROYECTO-FICHAJES.md) | El planteamiento: legalidad, RGPD, arquitectura, fases. El *por qué* de todo |
| [`docs/ESTRUCTURA.md`](docs/ESTRUCTURA.md) | Alcance de la fase 1, decisiones técnicas, árbol de directorios, pantallas y API |
| [`docs/MODELO-DATOS.md`](docs/MODELO-DATOS.md) | El modelo de datos y las reglas de negocio |
| [`db/migraciones/001_inicial.sql`](db/migraciones/001_inicial.sql) | El esquema, ejecutable |
| [`docs/FASE-0-GESTORIA.md`](docs/FASE-0-GESTORIA.md) | Lo que hay que preguntar a la gestoría antes de poner esto en producción |

## Las cuatro reglas que no se negocian

1. **Un fichaje no se modifica ni se borra nunca.** Corregir es añadir una corrección con
   motivo y autor; el original se queda donde está.
2. **Jornada y orden de trabajo van separadas.** La jornada es la obligación legal; la
   imputación a OT (fase 2) es gestión interna.
3. **Presencia por el wifi del taller, no por GPS.** Se guarda "dentro/fuera", nunca dónde
   está nadie.
4. **La tablet del taller es obligatoria**, aunque todos fichen desde el móvil: a nadie se le
   puede exigir usar su teléfono personal.

## Fases

- **0** — Gestoría: estado del reglamento + los tres documentos de RGPD.
- **1** — Jornada: entrar, salir, pausa. Móvil y tablet. Mensual en PDF. Correcciones con
  rastro. ← **aquí estamos**
- **2** — Imputación a orden de trabajo, leyendo las OT abiertas de driver360.
- **3** — Horas reales vs. vendidas, absentismo, vacaciones.

## Relación con autoalba

Son proyectos distintos: [`autoalba`](https://github.com/jsintegraldelmotor-eng/autoalba)
automatiza albaranes de recambios en driver360 con n8n y no tiene ni base de datos ni
usuarios. Lo único que compartirán es el acceso de lectura a driver360, en la fase 2.

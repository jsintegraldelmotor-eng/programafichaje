# Fase 0 — lo que hay que cerrar antes de construir

La fase 0 no es código. Es la que decide si lo que se construye vale o no vale, así que va
delante. Esta lista está pensada para llevarla a la gestoría tal cual.

## A. Preguntas para la gestoría

1. **El reglamento de registro horario que está en tramitación, ¿en qué estado está a día de
   hoy?** Si ya se ha aprobado, cambian requisitos técnicos concretos:
   - ¿Acceso remoto de la Inspección al registro? Eso obliga a un modo de consulta para un
     tercero, no sólo a exportar PDF.
   - ¿Formato de exportación o interoperabilidad obligatorios? Si hay un formato oficial, se
     programa ése y no se inventa nada.
   - ¿Obligación de registro digital (adiós al papel como respaldo)?
2. **¿Basta con registrar lo que ocurre, o hay que cuadrar contra un horario pactado?**
   Cambia el modelo de datos y el informe.
3. **Las pausas: ¿se fichan o se descuentan a tanto alzado?** ¿La pausa de la comida es
   tiempo de trabajo efectivo en nuestro convenio?
4. **El informe mensual, ¿tiene que llevar algún formato o dato concreto** (CIF, centro de
   trabajo, convenio, firma del trabajador)?
5. **Al no haber representación legal de los trabajadores**, ¿qué documento hay que emitir y
   comunicar para dejar acreditado el sistema de registro? ¿Hace falta firma de recibí?
6. **Comprobar la presencia por el wifi del taller en lugar de por GPS**, ¿le parece
   suficiente y proporcionado? (Es la opción menos invasiva; conviene que quede por escrito
   que se eligió a propósito.)
7. **Conservación**: confirmado 4 años. ¿Algún otro plazo por convenio o por otra obligación?

## B. Los tres documentos (los redacta o valida la gestoría, van en `docs/legal/`)

1. **Información al trabajador sobre el tratamiento de datos** (art. 13 RGPD): qué se
   registra, para qué, base jurídica (obligación legal del art. 34.9 ET), plazo de
   conservación, y sus derechos. Se entrega y se firma el recibí.
2. **Registro de actividades de tratamiento**: la ficha interna del tratamiento "control
   horario".
3. **Política de uso del dispositivo propio**: que fichar desde el móvil personal es
   **voluntario**, que existe la tablet del taller como alternativa, que la aplicación no
   accede a la ubicación, a la agenda ni a nada del teléfono, y que sólo comprueba si la
   conexión es la del taller en el instante del fichaje.

## C. Decisiones del taller (no son de la gestoría)

- ¿La IP pública del router del taller es fija? (Si no, hay que resolverlo: ver
  `ESTRUCTURA.md` §7.)
- ¿El wifi llega a toda la nave, incluido el foso y la zona de chapa?
- ¿Qué tablet se pone y dónde se cuelga? Con cargador fijo.
- ¿Quién es el administrador único y quién le sustituye si está de vacaciones?

---

**Hasta que A esté contestado, la fase 1 se puede programar igual** —nada de lo anterior
cambia el modelo de datos de la jornada— pero **no se pone en producción**: la respuesta a
la pregunta 1 puede añadir requisitos de exportación, y las respuestas 2 y 3 cambian el
informe mensual.

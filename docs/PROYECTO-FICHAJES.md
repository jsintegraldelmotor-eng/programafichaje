# Fichajes del taller — planteamiento

> **Origen:** este documento se redactó en el repositorio `autoalba`
> (`docs/PROYECTO-FICHAJES.md`, rama `claude/gallant-keller-alnplh`) como semilla, con el
> acuerdo de moverlo al repositorio nuevo el primer día. Trasladado aquí el 2026-09-11.
> Queda como **contexto y justificación**; las decisiones de construcción viven en
> `ESTRUCTURA.md` y `MODELO-DATOS.md`.

---

## 1. ¿Es legal un programa hecho por nosotros?

**Sí.** En España el registro de jornada (art. 34.9 del Estatuto de los Trabajadores, desde
el RD-ley 8/2019) **no exige ningún software homologado, certificado ni autorizado**. No
existe una lista oficial de programas válidos. Una hoja de papel es legal. Un Excel es
legal. Un programa propio es legal.

Lo que la ley exige es **el resultado**, no la herramienta:

| Requisito | Qué significa para el programa |
|---|---|
| **Diario** | Se registra **hora de inicio y hora de fin** de la jornada de cada trabajador, cada día. |
| **Fiable e inalterable** | Si alguien corrige un fichaje, **el original no se borra**: queda la corrección, quién la hizo y por qué. Esto es lo más importante del diseño. |
| **Conservación 4 años** | Los registros se guardan 4 años y se pueden sacar. Copias de seguridad, no negociable. |
| **Accesible** | Deben poder consultarlos **el trabajador**, sus representantes y la **Inspección de Trabajo**. El trabajador tiene que poder ver *sus* horas cuando quiera. |
| **Totalizado** | Resumen mensual de horas por trabajador, entregable en PDF. |
| **Negociado** | El sistema se acuerda con la representación legal o, si no la hay, **se comunica y se documenta** (documento interno de organización del registro). |

**Aviso de fecha:** hay un reglamento de registro horario en tramitación que endurece esto
(acceso remoto de la Inspección, interoperabilidad, registro digital obligatorio). **Antes
de construir, confirmar en qué estado está**, porque cambia requisitos técnicos concretos.
Y esto es un planteamiento técnico, no asesoramiento jurídico: que lo valide la gestoría o
un laboralista antes de arrancar.

## 2. Fichar desde el móvil del trabajador

Se puede, pero con tres condiciones que **hay que meter en el diseño desde el principio**:

1. **No se puede obligar a nadie a usar su móvil personal.** Si alguien se niega (está en su
   derecho), tiene que existir **otra vía**. Por eso el plan incluye siempre una **tablet en
   el taller** como alternativa, aunque el 90% fiche desde su móvil. También resuelve el
   móvil sin batería y al que se le olvida en casa.
2. **La geolocalización es el punto delicado.** Es admisible si es **proporcional**, y eso
   significa: se comprueba la ubicación **sólo en el instante del fichaje**, se guarda
   **"dentro/fuera del taller"**, no un rastro de coordenadas, y **nunca** se sigue al
   trabajador fuera de ese instante (art. 90 LOPDGDD: hay que informar de forma expresa,
   clara e inequívoca). Seguimiento continuo = sanción.
3. **Papeleo obligatorio**: informar por escrito del tratamiento de datos, registro de
   actividades de tratamiento, y política de uso del dispositivo propio. Son tres documentos
   cortos, pero sin ellos el sistema es atacable aunque el software sea perfecto.

**Alternativa a valorar antes que el GPS:** que el fichaje desde móvil sólo funcione estando
conectado al **wifi del taller**. Da la misma garantía de presencia, es mucho menos invasivo
y no hay que pedir permiso de ubicación a nadie. Es mi recomendación.

## 3. Jornada + horas por orden de trabajo

Son **dos cosas distintas** y el mayor error de diseño sería mezclarlas:

- **Jornada** (entrada, pausas, salida) → es la **obligación legal**. Pocos fichajes al día,
  inalterable, 4 años.
- **Imputación a OT** (en qué coche está trabajando) → es **gestión interna**, no tiene valor
  legal y a nadie le multan por ella. Muchos cambios al día, corregible sin drama.

Van en **tablas separadas**. La jornada nunca se toca al corregir una imputación. Además,
así se puede arrancar sólo con jornada y añadir OT después sin rehacer nada.

El valor de la parte OT es el que de verdad da dinero: **horas reales vs. horas vendidas**
por orden. Y aquí conecta con lo que ya existe: driver360 ya sabe las órdenes abiertas y sus
matrículas — el mismo acceso que usa el bot de albaranes sirve para que el operario elija OT
de una lista en vez de teclear nada.

## 4. ¿Repositorio aparte?

**Sí, repositorio nuevo.** Recomendación firme.

`autoalba` es una cosa muy concreta: código JavaScript que se **pega dentro de nodos de n8n**
y se genera con `npm run build`. No tiene base de datos, no tiene servidor, no tiene usuarios,
no guarda nada. Fichajes es justo lo contrario: una aplicación web con base de datos,
sesiones, contraseñas y datos personales que hay que conservar 4 años.

Meterlas juntas significaría: un `npm test` que mezcla dos mundos, un despliegue que no se
parece en nada al otro, y datos personales de los trabajadores en el mismo sitio que un
automatismo de albaranes. Nombre propuesto: **`fichalba`**.

Lo único que comparten es el acceso a driver360. Eso se resuelve copiando el puñado de
llamadas que hagan falta — no justifica un repositorio común.

## 5. Arquitectura propuesta

```
Móvil del operario (web, se instala como app)
        │  (wifi del taller)
        ▼
   Servidor  ──►  Base de datos (fichajes, inalterables)
        │
        └──►  driver360 (sólo lectura: órdenes abiertas y matrículas)

   Tablet en el taller  ──┘   (misma web, alternativa obligatoria)
   Administración        ──┘   (misma web, pantalla de jefe)
```

- **App = página web instalable (PWA)**, no app de tiendas. Sin App Store, sin Google Play,
  sin esperar aprobaciones, se actualiza sola y funciona en Android y iPhone. Para fichar es
  más que suficiente.
- **Dónde alojarlo: un servidor pequeño en internet (VPS en España/UE)**, no un PC en el
  taller. Razones: para fichar desde el móvil hace falta llegar desde fuera; las copias de
  seguridad son automáticas; la gestoría puede entrar; y un PC en un taller acaba apagado,
  lleno de polvo o robado — y ahí se pierden 4 años de registro legal. Coste aproximado:
  5-10 €/mes.
  - *Contrapartida honesta:* si se cae internet, no se ficha desde el móvil. Se cubre
    guardando el fichaje en el propio móvil y subiéndolo al volver la conexión, y con la
    tablet como respaldo.

## 6. Qué hace la aplicación (versión mínima)

**El operario** ve una sola pantalla con un botón grande: `ENTRAR` / `SALIR`. Debajo, sus
horas de hoy y de la semana. Nada más.

**Pausas**: un botón `PAUSA` / `VOLVER`. Comer y descansos van fuera de la jornada efectiva.

**La OT** (fase 2): tras `ENTRAR`, una lista de las órdenes abiertas del taller; se toca una
y el tiempo empieza a contar contra ella. Al cambiar de coche, se toca otra.

**El administrador** ve el taller en tiempo real (quién está dentro), el mensual de cada uno
en PDF, y puede corregir un fichaje **dejando rastro** (original + corrección + motivo + quién).

**Olvidos**: un fichaje sin salida al cierre del día no se inventa. Se marca como incidencia
y el operario o el jefe lo justifican al día siguiente.

## 7. Fases

| Fase | Qué entra | Para qué |
|---|---|---|
| **0** | Confirmar con la gestoría el estado del reglamento y redactar los 3 documentos (información RGPD, registro de tratamiento, política de móvil propio). | Sin esto, lo demás es humo. |
| **1** | Jornada: entrar, salir, pausa. Móvil + tablet. Mensual en PDF. Correcciones con rastro. | Cumplir la ley. Es lo que se puede tener funcionando pronto. |
| **2** | Imputación a orden de trabajo, leyendo las OT abiertas de driver360. | Saber qué cuesta de verdad cada reparación. |
| **3** | Horas reales vs. vendidas, absentismo, vacaciones. | Gestión. |

## 8. Decisiones ya tomadas

- Menos de 10 personas, **un solo administrador**. Nada de jerarquías de permisos: dos roles,
  operario y administrador.
- Fichaje principal desde el **móvil del trabajador**, con **tablet del taller obligatoria**
  como alternativa.
- **Presencia por wifi del taller** en vez de GPS, salvo que la gestoría diga lo contrario.
- **Repositorio nuevo** (`fichalba`), separado de autoalba.

## 9. Pendiente de decidir

- Estado del reglamento de registro horario (fase 0).
- ¿Hay turnos y horarios teóricos que cuadrar, o sólo se registra lo que pasa?
- ¿La gestoría necesita un formato concreto para el mensual?
- ¿El taller tiene un wifi que llegue a toda la nave?

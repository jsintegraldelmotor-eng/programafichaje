# Estructura del proyecto — fase 1 (jornada)

> **Nota (17/09/2026):** este documento describe la versión **completa** del registro de
> jornada, que está aparcada. Lo que hay construido y funcionando hoy es la versión pequeña
> de la tablet — ver el [README](../README.md). Esto se mantiene como el sitio al que volver
> cuando toque añadir salidas, correcciones y mensual en PDF.

Propuesta para revisar. El *porqué* de fondo está en `PROYECTO-FICHAJES.md`; el modelo de
datos, en `MODELO-DATOS.md`.

---

## 1. Alcance de la fase 1

**Entra:**

- Alta de trabajadores y PIN (lo hace el administrador).
- Fichar `ENTRADA`, `SALIDA`, `PAUSA`, `VOLVER` desde móvil personal y desde la tablet.
- Comprobación de presencia por **wifi del taller** (sin GPS).
- Funcionamiento sin cobertura: el fichaje se guarda en el móvil y sube solo al volver la red.
- "Mis horas": hoy, la semana, el mes, y descargar **mi** mensual — lo exige la ley.
- Panel del administrador: quién está dentro ahora, día a día, incidencias.
- **Correcciones con rastro**: original intacto + corrección + motivo + autor.
- Incidencias automáticas (jornada sin salida, fichaje fuera de la red, secuencia imposible).
- **Informe mensual en PDF** por trabajador, con totales.
- Copia de seguridad automática y verificación de la cadena de integridad.

**No entra (y no se diseña ahora):**

- Órdenes de trabajo / driver360 → fase 2. El modelo ya deja el hueco: tabla aparte.
- Vacaciones, absentismo, horas vendidas → fase 3.
- Horarios teóricos y cuadre de turnos → pendiente de decidir (ver §7).
- Nóminas, fotos, huella, cara. Nada biométrico: para <10 personas es desproporcionado y
  multiplica el riesgo RGPD sin aportar nada.

---

## 2. Decisiones técnicas propuestas

| Decisión | Propuesta | Por qué | Alternativa descartada |
|---|---|---|---|
| Lenguaje | **TypeScript sobre Node 22 LTS** | Mismo ecosistema que autoalba; una sola cabeza que mantener | Python/PHP: otro mundo que mantener |
| Servidor HTTP | **Fastify** | Pequeño, rápido, validación de entrada incluida | Express (vale igual, menos validación) |
| Base de datos | **SQLite** (modo WAL, `better-sqlite3`) | <10 personas ≈ **20.000 filas al año**. La copia de seguridad es *copiar un fichero*. Cero servicios extra en el VPS | PostgreSQL: correcto pero es un servicio más que administrar, actualizar y respaldar para un volumen de juguete |
| Interfaz | **HTML + CSS + JS sin framework**, PWA con service worker | La pantalla del operario es **un botón**. Un framework aquí es peso muerto que caduca | React/Vue: cadena de build y dependencias que envejecen |
| PDF | **pdfkit** (en el servidor) | Una tabla mensual no necesita un navegador entero | Puppeteer: arrastra Chromium, inviable en un VPS de 5 € |
| Sesión | Cookie `httpOnly` + tabla `sesion` en BD | Se puede **revocar** al instante (móvil perdido, baja) | JWT: no se revoca sin inventar una lista negra |
| PIN | **argon2id** | Estándar actual para secretos cortos | SHA-256 pelado: se rompe en minutos |
| TLS / dominio | **Caddy** delante (certificado automático) + `systemd` | Dos ficheros de configuración y se olvida | Nginx + certbot a mano |
| Horas | **UTC en la base de datos**, `Europe/Madrid` sólo al mostrar | Los cambios de hora de marzo y octubre dejan de ser un problema | Guardar hora local: el día del cambio hay una hora duplicada |
| Idioma del código | Dominio en **castellano** (`marcaje`, `jornada`, `trabajador`), infraestructura en inglés | Los términos son los de la ley y los de la gestoría; traducirlos genera errores | Todo en inglés |
| Tests | `node:test` (nativo) | Sin dependencias, ya viene en Node | Jest/Vitest |

> **Si la gestoría dice que el reglamento nuevo exige acceso remoto de la Inspección**, lo que
> cambia no es la base de datos: cambia el *exportador*. SQLite aguanta igual. El plan B
> (migrar a PostgreSQL) es real pero sólo si aparece concurrencia de verdad o varios centros.

---

## 3. Árbol de directorios

```
fichalba/
├── README.md
├── docs/
│   ├── PROYECTO-FICHAJES.md      planteamiento y legalidad (traído de autoalba)
│   ├── ESTRUCTURA.md             este documento
│   ├── MODELO-DATOS.md           modelo de datos y reglas
│   ├── FASE-0-GESTORIA.md        lo que hay que preguntar antes de construir
│   └── legal/                    los 3 documentos RGPD (fase 0, los redacta/valida la gestoría)
│
├── db/
│   ├── migraciones/
│   │   └── 001_inicial.sql       esquema de la fase 1 (hoy en docs/referencia/)
│   └── semillas/                 datos de prueba para desarrollo
│
├── src/
│   ├── servidor.ts               arranque y montaje de rutas
│   ├── config.ts                 variables de entorno, con validación al arrancar
│   ├── tipos.ts
│   │
│   ├── dominio/                  ← reglas puras: ni BD ni HTTP. Aquí vive la ley.
│   │   ├── jornada.ts            marcajes → jornadas, minutos trabajados, pausas
│   │   ├── secuencia.ts          qué marcaje puede seguir a cuál
│   │   ├── incidencias.ts        detección de olvidos y anomalías
│   │   └── cadena.ts             cálculo y verificación del hash encadenado
│   │
│   ├── datos/                    ← acceso a la BD, una función por consulta
│   │   ├── conexion.ts
│   │   ├── migrar.ts
│   │   ├── marcajes.ts
│   │   ├── trabajadores.ts
│   │   ├── correcciones.ts
│   │   └── incidencias.ts
│   │
│   ├── servicios/
│   │   ├── fichar.ts             caso de uso completo: validar → red → cadena → insertar
│   │   ├── presencia.ts          ¿la petición viene del wifi del taller?
│   │   ├── informe-mensual.ts    totales + PDF
│   │   ├── auditoria.ts
│   │   └── sesiones.ts
│   │
│   └── rutas/
│       ├── auth.ts               login por PIN, alta de dispositivo
│       ├── fichar.ts             POST /api/fichar
│       ├── mis-horas.ts          lo que ve el trabajador de sí mismo
│       └── admin/
│           ├── panel.ts          quién está dentro
│           ├── trabajadores.ts
│           ├── correcciones.ts
│           ├── incidencias.ts
│           └── informes.ts
│
├── web/                          ← la PWA (se sirve tal cual, sin compilar)
│   ├── index.html                pantalla del operario: un botón
│   ├── app.js
│   ├── cola-offline.js           IndexedDB: fichajes pendientes de subir
│   ├── sw.js                     service worker
│   ├── estilos.css
│   ├── manifest.webmanifest
│   ├── iconos/
│   └── admin/
│       ├── index.html
│       └── admin.js
│
├── tests/
│   ├── dominio/                  ← el grueso: jornadas, secuencias, cambio de hora, cadena
│   └── api/
│
├── scripts/
│   ├── crear-admin.ts            primer administrador
│   ├── copia-seguridad.sh        VACUUM INTO + cifrado + subida fuera del VPS
│   ├── restaurar.sh              probada, no teórica
│   ├── verificar-cadena.ts       recalcula la cadena entera y avisa si algo no cuadra
│   └── purgar.ts                 IPs >12 meses; registros >4 años (desactivado por defecto)
│
└── despliegue/
    ├── fichalba.service          systemd
    ├── Caddyfile
    └── README.md                 montar el VPS desde cero, paso a paso
```

**La regla que sostiene todo esto:** `dominio/` no importa nada de `datos/` ni de `rutas/`.
Son funciones puras sobre listas de marcajes. Así el cálculo de horas —lo único que de
verdad hay que poder defender delante de un inspector— se prueba entero sin base de datos.

---

## 4. Pantallas

**Operario (móvil o tablet), tres pantallas:**

1. **Fichar.** Un botón enorme que dice lo único que puedes hacer ahora (`ENTRAR`, y si ya
   estás dentro `SALIR` + `PAUSA`). Debajo: hora de entrada, tiempo de hoy, tiempo de la
   semana. Y un aviso si el fichaje quedó en cola por falta de cobertura.
2. **Mis horas.** Calendario del mes, día a día, con entradas y salidas. Botón "descargar mi
   mensual en PDF". Esto no es un extra: el derecho de acceso del trabajador es obligatorio.
3. **Ajustes.** Cambiar PIN, ver mis dispositivos, cerrar sesión.

**Tablet del taller:** la misma aplicación en modo quiosco: lista de nombres → PIN → fichaje
→ vuelve sola a la lista a los 10 segundos. Nunca deja sesión abierta.

**Administrador:**

1. **Ahora mismo.** Quién está dentro, quién en pausa, desde qué hora.
2. **Día.** Tabla del día completo, con las incidencias arriba en rojo.
3. **Corregir.** Elegir marcaje → nueva hora o anular → **motivo obligatorio**. Se ve el
   antes y el después antes de confirmar.
4. **Mensual.** Mes + trabajador (o todos) → PDF.
5. **Trabajadores.** Alta, baja, reseteo de PIN.
6. **Ajustes.** Red del taller (con un botón "usar la IP desde la que estoy entrando"),
   datos de la empresa, estado de las copias de seguridad.

---

## 5. API (fase 1)

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| POST | `/api/auth/login` | público | nombre + PIN → cookie de sesión |
| POST | `/api/auth/dispositivo` | operario | registra este móvil como suyo |
| POST | `/api/auth/logout` | sesión | cierra |
| GET | `/api/estado` | operario | qué puede hacer ahora + totales de hoy/semana |
| POST | `/api/fichar` | operario | `{tipo, id_cliente, instante_dispositivo?}` → marcaje |
| GET | `/api/mis-horas?mes=YYYY-MM` | operario | sus jornadas |
| GET | `/api/mi-informe/YYYY/MM.pdf` | operario | su mensual |
| GET | `/api/admin/ahora` | admin | quién está dentro |
| GET | `/api/admin/dia/YYYY-MM-DD` | admin | jornadas + incidencias del día |
| POST | `/api/admin/correccion` | admin | alta / modificación / anulación con motivo |
| GET | `/api/admin/incidencias` | admin | abiertas |
| POST | `/api/admin/informe` | admin | genera y archiva el PDF mensual |
| GET | `/api/admin/exportar?desde&hasta` | admin | CSV/JSON íntegro para Inspección o gestoría |

`POST /api/fichar` es **idempotente por `id_cliente`**: si la cola offline reintenta, el
segundo envío devuelve el mismo marcaje en vez de duplicarlo.

---

## 6. Despliegue y copias de seguridad

- VPS pequeño en España/UE (2 GB RAM sobran), Debian estable, Node desde el repositorio
  oficial, Caddy delante, la aplicación como servicio `systemd` con usuario propio.
- **Copia diaria**: `VACUUM INTO` (copia consistente sin parar el servicio) → cifrado con
  `age` → subida a un almacenamiento de otro proveedor, también en la UE. 30 diarias +
  12 mensuales + 4 anuales (la ley pide 4 años; una copia anual es la red de seguridad).
- **Restauración probada trimestralmente.** Una copia que no se ha restaurado nunca no es
  una copia; es una carpeta.
- `verificar-cadena.ts` en el cron diario: si un solo marcaje no cuadra con la cadena de
  hashes, avisa por correo. Esto es lo que convierte "inalterable" en algo demostrable.

---

## 7. Decisiones abiertas (necesito respuesta antes de fase 1)

1. **Horarios teóricos: ¿sí o no?** ¿Basta con registrar lo que pasa (mi recomendación para
   empezar), o hay que cuadrar contra un horario pactado y marcar retrasos? Si hay que
   cuadrarlo, aparece una tabla `horario` y cambia el informe mensual.
2. **Las pausas: ¿se fichan o se descuentan?** ¿Obligamos a fichar la pausa de la comida, o
   se descuenta un rato fijo? Propongo **ficharla** (es más fiel y evita discusiones), pero
   hay que decirlo claro a la plantilla.
3. **El wifi del taller: ¿la IP pública es fija?** Si el router cambia de IP, la comprobación
   de red falla sola. Si es dinámica hay dos salidas: la tablet del taller avisa al servidor
   de la IP actual, o se contrata IP fija (suele ser barato).
4. **¿El administrador ficha también?** El modelo lo permite (campo `ficha`), pero conviene
   decidirlo ahora porque cambia el informe mensual.
5. **Formato del mensual:** ¿la gestoría quiere un formato concreto o vale el mío?
6. **El nombre.** El repositorio es `programafichaje`; el nombre propuesto en el documento
   original es `fichalba`. ¿Lo renombramos o `fichalba` se queda como nombre de la aplicación?

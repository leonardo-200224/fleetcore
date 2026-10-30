# FleetCore API

API REST para gestionar el mantenimiento de la flota de vehiculos de la empresa
de transporte FleetCore. Prueba de desempeno del modulo 6.2 de NestJS.

**Coder:** Leonardo Ayala
**Clan:** Node.js noche

Hecha con NestJS, TypeScript, TypeORM, PostgreSQL y JWT.

---

## Documentacion Swagger

Con el proyecto corriendo, la documentacion queda en:

```
http://localhost:3000/docs
```

Ahi se pueden probar todos los endpoints. Para los protegidos hay que pegar el
token en el boton **Authorize** (opcion *bearer*), y para el de integraciones
se usa el otro campo, el de la cabecera `x-api-key`.

---

## Como levantarlo

### 1. Lo que hace falta

- Node 20 o superior
- Docker y Docker Compose (para la base de datos)

### 2. Instalar las dependencias

```bash
npm install
```

### 3. Crear el archivo .env

```bash
cp .env.example .env
```

Hay que cambiar al menos `DB_PASSWORD` y `JWT_SECRET` (el secreto necesita 32
caracteres o mas, si no la aplicacion no arranca).

### 4. Levantar PostgreSQL

```bash
docker compose up -d db
```

Esto crea el contenedor `fleetcore_db` con la base `fleetcore_db` en el puerto
**5438**. Use el 5438 y no el 5432 porque en el equipo donde trabajo ya hay
otros PostgreSQL ocupando los puertos de siempre; si en otra maquina el 5438
esta libre igual funciona, y si no, se cambia `DB_PORT` en el `.env`.

Las tablas no hay que crearlas a mano: con `DB_SYNC=true` TypeORM las crea
solo al arrancar.

### 5. Poblar la base de datos

```bash
npm run seed
```

Se puede ejecutar las veces que haga falta: busca cada registro antes de
crearlo, asi que no duplica nada.

### 6. Arrancar la API

```bash
npm run start:dev
```

---

## Credenciales de prueba

Las crea el seeder:

| Rol | Correo | Contrasena |
|---|---|---|
| ADMIN | admin@fleetcore.com | la que pongas en `ADMIN_PASSWORD` del `.env` |
| TECHNICIAN | juan.perez@fleetcore.com | `Tecnico123` |
| TECHNICIAN | laura.gomez@fleetcore.com | `Tecnico123` |

Y las API Keys de ejemplo estan en `API_KEYS` del `.env`:
`demo-key-partner-1` y `demo-key-partner-2`.

---

## Que deja el seeder

- 1 usuario ADMIN y 2 TECHNICIAN
- 3 mecanicos: Juan y Laura activos y vinculados a los dos tecnicos, y Carlos
  Ruiz inactivo y sin cuenta de usuario
- 2 talleres: Taller Norte activo y Taller Centro inactivo
- 4 vehiculos: ABC123 y DEF456 disponibles, GHI789 en mantenimiento y JKL012
  inactivo
- 2 mantenimientos: uno COMPLETED sobre ABC123 (el historial) y uno
  IN_PROGRESS sobre GHI789

---

## Endpoints

Todas las rutas van bajo `/api`.

### Autenticacion

| Metodo | Ruta | Quien | Que hace |
|---|---|---|---|
| POST | `/auth/register` | publico | Registra un usuario (`role` opcional: ADMIN o TECHNICIAN) |
| POST | `/auth/login` | publico | Devuelve el token JWT |
| GET | `/users/me` | autenticado | Mis datos |
| GET | `/users` | ADMIN | Lista de usuarios |

### Vehiculos

| Metodo | Ruta | Quien |
|---|---|---|
| POST | `/vehicles` | ADMIN |
| GET | `/vehicles` | autenticado |
| GET | `/vehicles/plate/:plate` | autenticado |
| GET | `/vehicles/:id` | autenticado |
| PATCH | `/vehicles/:id` | ADMIN |
| PATCH | `/vehicles/:id/status` | ADMIN |
| DELETE | `/vehicles/:id` | ADMIN (borrado logico) |

### Mecanicos

| Metodo | Ruta | Quien |
|---|---|---|
| POST | `/mechanics` | ADMIN |
| GET | `/mechanics` | autenticado |
| GET | `/mechanics/:id` | autenticado |
| PATCH | `/mechanics/:id` | ADMIN |
| PATCH | `/mechanics/:id/status` | ADMIN |

### Talleres

| Metodo | Ruta | Quien |
|---|---|---|
| POST | `/workshops` | ADMIN |
| GET | `/workshops` | autenticado (solo los activos) |
| GET | `/workshops/:id` | autenticado |
| PATCH | `/workshops/:id/status` | ADMIN |

### Mantenimientos

| Metodo | Ruta | Quien |
|---|---|---|
| POST | `/maintenances` | ADMIN |
| GET | `/maintenances` | ADMIN |
| GET | `/maintenances/active` | ADMIN |
| GET | `/maintenances/mine` | TECHNICIAN |
| GET | `/maintenances/vehicle/:id` | ADMIN |
| GET | `/maintenances/vehicle/:id/history` | ADMIN (solo COMPLETED) |
| GET | `/maintenances/mechanic/:id` | ADMIN |
| GET | `/maintenances/:id` | ADMIN, o el TECHNICIAN asignado |
| PATCH | `/maintenances/:id/status` | ADMIN, o el TECHNICIAN asignado |
| PATCH | `/maintenances/:id/complete` | ADMIN, o el TECHNICIAN asignado |

### Integracion externa

| Metodo | Ruta | Como se entra |
|---|---|---|
| GET | `/integrations/vehicles/:plate` | cabecera `x-api-key` |

---

## Decisiones que tome

El enunciado tiene algunos puntos que se contradicen o que no cubren todos los
casos. Dejo aqui lo que decidi y por que, para que se entienda al leer el
codigo.

### El mecanico no es lo mismo que el usuario TECHNICIAN

Son dos tablas distintas y la relacion entre ellas es **opcional**. Lo hice asi
porque el seeder del requisito 9 pide tres mecanicos de los cuales solo dos
estan vinculados a tecnicos: el tercero existe en la flota pero no tiene cuenta
para entrar. Si los hubiera metido en una sola tabla, ese seeder no se podria
cumplir.

### El mecanico se valida por cruce de horarios; el vehiculo no

El requisito 6 dice que un tecnico no puede tener "simultaneamente" mas de un
mantenimiento activo, pero el requisito 3.10 dice que no puede tener dos
**cuyos horarios se crucen**, y pone ejemplos: si tiene uno de 7:30 a 9:00, no
se le puede asignar otro a las 8:00, pero **si** uno que empiece a las 9:00.

Entendi "simultaneamente" como "solapado en el tiempo" e implemente la regla de
cruces, porque es la unica que cumple los cuatro ejemplos. La formula es:

```
existente.inicio < nuevo.fin   Y   existente.fin > nuevo.inicio
```

Para el **vehiculo** es distinto: ahi si es un solo mantenimiento activo, sin
mirar horarios, porque el ejemplo de error del enunciado lo dice tal cual
("El vehiculo ABC123 ya tiene un mantenimiento activo").

### Guardo hora de inicio y hora de fin

El requisito 5.3 solo pide "fecha programada", pero sin saber cuando termina un
mantenimiento no hay forma de detectar que se cruza con otro. Como el enunciado
pide esos campos "como minimo", anadi `scheduledStart` y `scheduledEnd`.

### Que pasa al cancelar un mantenimiento ya empezado

El enunciado no lo dice. Decidi que el vehiculo vuelva a `AVAILABLE`, porque si
no quedaria `IN_MAINTENANCE` para siempre y nunca mas podria entrar a otro
mantenimiento. Las transiciones que permito son:

```
SCHEDULED   -> IN_PROGRESS | CANCELLED
IN_PROGRESS -> COMPLETED   | CANCELLED
COMPLETED   -> ninguna
CANCELLED   -> ninguna
```

Cualquier otra responde 409 diciendo que se intento.

### El vehiculo se queda con el kilometraje final

Al cerrar un mantenimiento, el kilometraje final pasa al vehiculo. Si no lo
hiciera, el odometro del vehiculo nunca avanzaria y la validacion de que "el
kilometraje no puede ser inferior al actual" dejaria de servir.

### Los enums van en ingles

Los requisitos los nombran en ingles (`PREVENTIVE`, `SCHEDULED`, `AVAILABLE`),
aunque el JSON de ejemplo muestre algunos en espanol. Use los del requisito,
que son los normativos. Los mensajes de error si van en espanol.

### "available" en el endpoint de integracion

El ejemplo del enunciado muestra `"available": true`, un booleano, pero el
requisito 2.8 pide tres estados. Por dentro el vehiculo tiene el enum completo
y solo en esa respuesta lo traduzco a `available`; el enum tambien viaja en
`status`, asi no se pierde informacion.

### JWT_EXPIRES_IN en segundos

El `.env.example` del enunciado trae `JWT_EXPIRES_IN=1h`, pero la validacion de
entorno del proyecto espera un numero. Lo deje en `3600`, que es lo mismo.

### El estado IN_MAINTENANCE no se pone a mano

`PATCH /vehicles/:id/status` solo acepta `AVAILABLE` o `INACTIVE`. El estado
`IN_MAINTENANCE` lo pone el sistema cuando arranca un mantenimiento, porque si
no el vehiculo podria quedar "en el taller" sin ningun mantenimiento detras.

### El tecnico solo toca lo suyo

Un TECHNICIAN puede consultar, iniciar, cancelar y cerrar sus mantenimientos,
pero recibe 403 si intenta tocar uno de otro mecanico. Esa comprobacion esta en
el servicio y no en un guard, porque el rol es correcto: lo que falla es que el
trabajo no es suyo, y para saberlo hay que mirar los datos.

---

## Formato de las respuestas

Todas las respuestas correctas salen con la misma forma, gracias al interceptor:

```json
{
  "success": true,
  "statusCode": 200,
  "data": { },
  "timestamp": "2026-10-20T19:00:00.000Z"
}
```

Y los errores pasan por el filtro de excepciones:

```json
{
  "success": false,
  "statusCode": 409,
  "message": "El vehiculo ABC123 ya tiene un mantenimiento activo",
  "path": "/api/maintenances",
  "timestamp": "2026-10-20T19:00:00.000Z"
}
```

---

## Estructura del proyecto

```
src/
  common/        guards, decoradores, interceptor, filtro, enums, entidad base
  config/        validacion de las variables de entorno con zod
  database/      seed.ts
  modules/
    auth/        registro, login y JWT
    users/
    vehicles/
    mechanics/
    workshops/
    maintenances/  aqui vive la logica de estados y las reglas de negocio
    integrations/  el endpoint con x-api-key
```

---

## Base de datos

El archivo `database/fleetcore_dump.sql` tiene la estructura y los datos del
seeder, por si se quiere restaurar sin levantar Docker:

```bash
psql -h localhost -p 5438 -U postgres -d fleetcore_db -f database/fleetcore_dump.sql
```

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>


# FICHAJE-CTI

1. Clonar proyecto
2. ``` yarn install ```
3. Clonar el archivo ``` .env.template ``` y renombrarlo a ``` .env ```
4. Cambiar las variables de entorno
5. Instalar cors ``` yarn add cors ```
6. Instalar schedule ``` yarn add @nestjs/schedule ```
7. Instalar socket.io ``` yarn add @nestjs/platform-socket.io  @nestjs/websockets```
7. Instalar cookie  ``` yarn add cookie-parser yar add @types/cookie-parser ```
8. Instalar ``` yarn add class-transformer class-validator ```
9. Levantar la base de datos.

Falta implementar obtener todas las solicitudes para el admin.

```
  docker-compose up -d

```


8. Dependencias Class-validator y Class-Transformer

```
yarn add class-validator class-transformer
```
9. Levantar: ``` yarn start:dev ```

La base de datos se borra cada vez, `EJECUTAR SEED` y `OBTENER TOKEN` de nuevo.

**app.module.ts / dropSchema:** **`true`** — Poner a **`false`** para no borrar la BBDD.


# FLUJO

```Ejecutar Seed ```-> ```Login SuperAdmin``` -> ```SuperAdmin crea Empresa/Admin ```
```Login Admin``` -> ```Admin Crea Horario``` -> ```Admin da de Alta Trabajador``` ->
```Login Trabajador``` -> ```Check-in``` -> ```Check-out``` -> ```Crear Solicitud``` -> ```Obtener Solicitud``` -> ```Admin Aprueba solicitud```


Aplicados cambios

# Endpoints - Alguna funcionalidad.


1. Ejecutar Seed
```
Post - Body none - Headers - KEY: x-seed-key - VALUE: 123


http://localhost:3000/api/seeds/run

```


2. Login 

``` 
http://localhost:3000/api/auth/login



SuperAdmin

Post

{
  "email": "superadmin@cti.com",
  "password": "superpassword123M"
}


Admin

Post

{
    "email": "marta.admin@globaltech.com",
    "password": "SecurePassword2026!"

}



Worker

Post

{
    "dni": "12345678Z", 
    "password": "contraseña123M"

}



```


3. Setup Inicial: Crea empresa + Admin principal.


```
Post - http://localhost:3000/api/empresa/crear-empresa

Token - SuperAdmin

Body - raw

{
  "nombreEmpresa": "Global Tech Logistics S.A.",
  "cif": "A87654321",
  "direccion": "Avenida Central 100, Planta 5",
  "poblacion": "Barcelona",
  "provincia": "Barcelona",
  "pais": "España",
  "email": "ops@globaltech.com",
  "codigoPostal": "08001",
  "nombreContacto": "Marta Sánchez",
  "telefonoContacto": "+34600111222",
  "telefonoEmpresa": "+34934123457",
  
  "admin": {
    "telefono": "+34600000001",
    "email": "marta.admin@globaltech.com",
    "password": "SecurePassword2026!"
  }
}


```


4.  Obtiene listado de todas las empresas.

```
GET - http://localhost:3000/api/empresa/list-empresas

Token - SUPER, Admin
BODY- none


```

5. Actualizar Empresa.


```
Put - http://localhost:3000/api/empresa/update/:id

Token - SuperAdmin

Body - raw


{
  "nombre": "Tech Ss",
  "cif": "B12345677",
  "direccion": "Calle Falsa 123",
  "provincia": "Murcia",
  "poblacion": "Murcia",
  "contactoNombre": "Juan Pérez",
  "telefonoContacto": "+34600111233",
  "telefonoEmpresa": "910000004",
  "pais": "España",
  "email": "info@techsolutions.es",
  "isActive": true,
  "admin": {
    "email": "admin@beta.com",
    "telefono": "+34655999888",
    "nombre": "Nombre FALSE",
    "apellidos": "Apellidos Reales"
  }
}


```



6. Borrar empresa.


```
Delete - http://localhost:3000/api/empresa/delete/:id

Token - SuperAdmin

Body - none

```

7.  Obtener una unica empresa.

```
GET - http://localhost:3000/api/empresa/:id

Token - SUPER, Admin
BODY- none


```




3. Check-in

```

http://localhost:3000/api/jornadas/check-in

Post

auth type:  bearer token.
Pegas el token de trabajador generado.

Body - Json:

{
  "latitud": 40.4167,
  "longitud": -3.7037
}


``` 




4. Check-out

```

http://localhost:3000/api/jornadas/check-out

Patch- none


``` 

5. Crear horario

```



Post  -  http://localhost:3000/api/schedules



Body - Json:

Ejemplo:

{
  "nombre": "Horario Oficina Central 2026",
  "fechaInicio": "2026-02-01",
  "fechaFin": "2026-12-31",
  "tipo": "Fijo",
  "distribuciones": [
    {
      "diaSemana": "Lunes",
      "horasDia": 9, 
      "franjas": [
        { "inicio": "08:00", "fin": "14:00" },
        { "inicio": "15:00", "fin": "18:00" }
      ]
    },
    {
      "diaSemana": "Martes",
      "horasDia": 8,
      "franjas": [
        { "inicio": "09:00", "fin": "17:00" }
      ]
    }
  ]
}

```



6. Dar de alta a Usuario



```

POST  -  http://localhost:3000/api/allowed-user

Body - Json

{
  "telefono": "600123456",
  "nombre": "Juan",
  "apellidos": "Pérez García",
  "password": "contraseña123",
  "dni": "12345678Z",
  "email": "juan.perez@empresa.com",
  "fechaNacimiento": "1992-03-10",
  "categoria": "Oficial de Primera",
  "actividad": "Construcción",
  "diaPertenece": 1
}

```

9. Permitir telefonos (Actualmente no implementado)

```

http://localhost:3000/api/allowed-phones

Post

http://localhost:3000/api/allowed-phones

{
    "telefono": "Telefono necesario"
}

``` 


10. Comprobar si admin solo ve su empresa

```
Token - Worker

Get - http://localhost:3000/api/empresas

Body - none

```

11. Aprobar solicitud - Admin

Requerido el token del admin.

```

Patch - http://localhost:3000/api/request/check/AQUI-PONER-ID-SOLICITUD

Body - Json

{
  "estado": "APROBADA",
  "comentarioAdmin": "Disfruta tus vacaciones"
}

```

12. Solicitudes - Solicitar

Crear solicitud para workers

```
Token Requerido

Post - http://localhost:3000/api/solicitudes

Body - Json

Tipos solicitud: 
  VACACIONES = 'VACACIONES',
  ENFERMEDAD = 'ENFERMEDAD',
  PERMISO = 'PERMISO',
  ASUNTOS_PROPIOS = 'ASUNTOS_PROPIOS',

{
  "tipo": "ENFERMEDAD",
  "fechaInicio": "2026-10-03",
  "fechaFin": "2026-11-15",
  "motivo": "Vacaciones de verano"
}


```

13. Obtener todas las solicitudes 

Para ver todas las solicitudes pendientes.

```
Token requerido.

Get - http://localhost:3000/api/solicitudes/mis-solicitudes

Body - none.

```

14. Obtener trabajador

Obtiene el trabajador por id

```

Token requerido

Patch - http://localhost:3000/api/users/ID-WORKER

Body - none

```

15. Crear horario

Admin token requerido.

```

http://localhost:3000/api/schedules

POST - Json 

{
  "nombre": "Horario Invierno 2026 - IT",
  "fechaInicio": "2026-01-01",
  "fechaFin": "2026-12-31",
  "tipo": "FIJO",
  "distribuciones": [
    {
      "diaSemana": "LUNES",
      "horasDia": 8.5,
      "franjas": [
        { "inicio": "08:30", "fin": "14:00" },
        { "inicio": "15:00", "fin": "18:00" }
      ]
    },
    {
      "diaSemana": "MIERCOLES",
      "horasDia": 8.5,
      "franjas": [
        { "inicio": "08:30", "fin": "14:00" },
        { "inicio": "15:00", "fin": "18:00" }
      ]
    },
    {
      "diaSemana": "VIERNES",
      "horasDia": 7,
      "franjas": [
        { "inicio": "08:00", "fin": "15:00" }
      ]
    }
  ]
}
```

16. Obtener horario por id

Admin token requerido.
```
http://localhost:3000/api/schedules/id


Get - Json none

``` 

17. Borrar horario por id

Admin token requerido.

```

http://localhost:3000/api/schedules/id

Delete - Json none

```


18. Asignar horario a trabajador.

Admin token requerido.

``` 
 http://localhost:3000/api/allowed-user/id-worker/assign-schedule

Patch - Json

{
  "horarioId": "a95e9f70-0e5a-4fba-9b3f-9d4417539099"
}


 ```




# Endpoints - Completos

```
SEED/LOGIN
🛠️ Método	📍 Endpoint	                            📝 Descripción	                                   📦 Requerimientos / Body
POST       /api/seeds/run           Inicializa el SuperAdmin y datos base.  Header: x-seed-key
POST       /api/auth/login          Inicio de sesión para todos los roles.  "{ email, password }"

```

```
EMPRESA (COMPANY)
🛠️ Método  📍 Endpoint                               📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/empresa/crear-empresa               Setup Inicial: Crea empresa + Admin principal.       Token (SUPERADMIN) + Body: SetupCompanyDto
GET         /api/empresa/list-empresas               Lista todas las empresas (con auditoría).            Token (SUPERADMIN/ADMIN)
GET         /api/empresa/find/:id                   Obtiene detalles de una empresa específica.          Token (SUPERADMIN)
PUT         /api/empresa/update/:id                  Actualiza datos de geolocalización o razón social.   Token (SUPERADMIN) + Body: UpdateCompanyDto
DELETE      /api/empresa/delete/:id                  Elimina la empresa y sus datos vinculados.           Token (SUPERADMIN)

```

```
USERS (USUARIOS)
🛠️ Método  📍 Endpoint                               📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/users/crear-user                    Crea un usuario (Admin o Worker).                    Token (SUPERADMIN/ADMIN) + Body: CreateUserDto
GET         /api/users/list-users                    Lista todos los usuarios (según permisos).           Token (SUPERADMIN/ADMIN)
GET         /api/users/find/:id                      Busca un usuario específico por su ID.               Token (SUPERADMIN/ADMIN)
PUT         /api/users/update/:id                    Actualiza los datos de un usuario.                   Token (ADMIN) + Body: UpdateUserDto
DELETE      /api/users/delete/:id                    Elimina un usuario (Borrado lógico).                 Token (ADMIN)

```


```
WORKER
🛠️ Método	📍 Endpoint	                           📝 Descripción	                                     📦 Requerimientos / Body
POST        /api/worker/crear-worker              Registra/Pre-autoriza un nuevo trabajador.
GET         /api/worker/list-workers              Lista todos los trabajadores de la empresa.
GET         /api/worker/find/:id                  Obtiene la ficha de un trabajador.
PUT         /api/worker/update/:id                Actualiza información del trabajador.
DELETE      /api/worker/delete/:id                Borra un trabajador autorizado.
PUT         /api/worker/assign-schedule/:id       Asignar Horario: Vincula horario a trabajador.

```

```
SOLICITUDES (REQUESTS)
🛠️ Método  📍 Endpoint                               📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/request/crear-request               Crea una nueva solicitud (Permisos, Bajas, etc.).    Token (ADMIN/WORKER) + Body: CreateRequestDto
PUT         /api/request/check/:id                   Aprueba o rechaza una solicitud específica.          Token (ADMIN) + Body: RevisarRequestDto
GET         /api/request/my-request                  Lista las solicitudes del usuario autenticado.       Token (ADMIN/WORKER)
GET         /api/request/company-request             Lista todas las solicitudes de la empresa.           Token (ADMIN)

```

```
HORARIOS (SCHEDULES)
🛠️ Método  📍 Endpoint                               📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/schedule/crear-schedule             Crea un nuevo horario (Planificación base).          Token (ADMIN) + Body: CreateHorarioDto
GET         /api/schedule/list-schedules             Lista los horarios de la empresa con sus franjas.    Token (ADMIN/WORKER)
GET         /api/schedule/find/:id                   Busca los detalles de un horario por su ID.          Token (ADMIN/WORKER)
DELETE      /api/schedule/delete/:id                 Elimina un horario completo del sistema.             Token (ADMIN)

```

```
LEAVES (VACACIONES Y PERMISOS)
🛠️ Método  📍 Endpoint                               📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/leaves/range                        Crea permisos en un rango de fechas (Vacaciones).    Token (ADMIN) + Body: CreateLeaveRangeDto
GET         /api/leaves/my-leaves                    Lista los permisos aprobados del usuario actual.     Token (ADMIN/WORKER)
GET         /api/leaves/user/:id                     Lista los permisos de un trabajador específico.      Token (ADMIN)

```


```
FRANJAS HORARIAS (TIME SLOTS)
🛠️ Método  📍 Endpoint                               📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/franja-horaria/crear                Crea una franja (valida solapamientos y empresa).    Token (ADMIN) + Body: CreateTimeSlotDto
GET         /api/franja-horaria/list-franja-horaria  Lista todas las franjas de la empresa.               Token (ADMIN/WORKER)
GET         /api/franja-horaria/find/:id             Busca una franja específica por ID.                  Token (ADMIN/WORKER)
PUT         /api/franja-horaria/update/:id           Actualiza horas de una franja existente.             Token (ADMIN) + Body: UpdateTimeSlotDto
DELETE      /api/franja-horaria/delete/:id           Elimina una franja del sistema (con Auditoría).      Token (ADMIN)
GET         /api/franja-horaria/by-schedule/:id      Lista las franjas vinculadas a un horario (Schedule). Token (ADMIN/WORKER)

```

```
JORNADAS (WORKDAYS)
🛠️ Método  📍 Endpoint                               📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/jornada/check-in                    Inicia una jornada (evalúa retraso y zona GPS).      Token (Cualquiera) + Body: CheckInDto
PATCH       /api/jornada/check-out                   Finaliza jornada activa (evalúa salida anticipada).  Token (Cualquiera) + Body: CheckInDto
GET         /api/jornada/status                      Indica si el usuario tiene una jornada abierta.      Token (Cualquiera)
GET         /api/jornada/historial                   Devuelve todas las jornadas del usuario actual.      Token (Cualquiera)
GET         /api/jornada/rango?desde=X&hasta=Y       Filtra jornadas del usuario en un rango de fechas.   Token (Cualquiera) + Query params
GET         /api/jornada/dashboard/resumen           Dashboard en tiempo real de la empresa de hoy.       Token (ADMIN)
```

```
ASISTENCIAS (ATTENDANCE)
🛠️ Método  📍 Endpoint                               📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/asistencia/crear-asistencia          Registra entrada/ausencia simple (con motivo).       Token (ADMIN/WORKER) + Body: CreateAttendanceDto
GET         /api/asistencia/my-history               Historial personal de asistencias del usuario.       Token (ADMIN/WORKER)
GET         /api/asistencia/empresa                  Historial global de todos los empleados de la empresa. Token (ADMIN)
GET         /api/asistencia/user/:id                 Consulta el historial de un trabajador específico.     Token (ADMIN)

```

```
ALARMAS (ALARMS)
🛠️ Método  📍 Endpoint                               📝 Descripción                                       📦 Requerimientos / Auth
GET         /api/alarmas/pendientes                  Lista todas las alertas sin revisar de la empresa.   Token (ADMIN)
PUT         /api/alarmas/revisar/:id                 Marca una alarma como leída de forma rápida.         Token (ADMIN)
PUT         /api/alarmas/resolver/:id                Resuelve una alarma añadiendo una nota de gestión.   Token (ADMIN) + Body: { nota: string }

```
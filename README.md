<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# FICHAJE-CTI - Sistema de Gestión de Presencia y Recursos

## 🚀 Instalación y Configuración

1. **Clonar proyecto** e instalar dependencias:
   ```bash
   yarn install

2. Variables de entorno: Clonar ``` .env.template ``` y renombrarlo a ```.env. ``` Configurar las variables según tu entorno

3. Dependencias necesarias:

```Bash
yarn add cors @nestjs/schedule @nestjs/platform-socket.io @nestjs/websockets cookie-parser class-validator class-transformer
yarn add -D @types/cookie-parser

```
4. Levantar Infraestructura (Base de Datos):

```Bash
docker-compose up -d
```

5. Levantar Aplicación:

```Bash
yarn start:dev

```

**app.module.ts / dropSchema:** **`true`** — Poner a **`false`** para no borrar la BBDD.



# Flujo de Trabajo (Workflow)

**Inicializar**: Ejecutar Seed para crear el SuperAdmin.

**Estructura**: Login SuperAdmin -> Crear Empresa y su Admin.

**Planificación**: Login Admin -> Crear Horario (Schedule).

**Personal**: Admin da de alta Trabajador -> Asignar Horario a Trabajador.

**Operativa**: Login Trabajador -> Check-in / Check-out.

**Gestión**: Crear Solicitudes/Incidencias -> Admin Aprueba/Resuelve.








# Endpoints - Completos


```
SEED/LOGIN
🛠️ Método	   📍 Endpoint	              📝 Descripción	                               📦 Requerimientos / Body
POST           /api/seeds/run             Inicializa el SuperAdmin y datos base.          Header: x-seed-key
POST           /api/auth/login            Inicio de sesión para todos los roles.          "{ email, password }"

```

```


EMPRESA (COMPANY)
🛠️ Método         📍 Endpoint                  📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/empresa/crear-empresa          Setup Inicial: Crea empresa + Admin principal.       Token (SUPERADMIN) + Body: 
GET         /api/empresa/list-empresas          Lista todas las empresas (con auditoría).            Token (SUPERADMIN/ADMIN)
GET         /api/empresa/find/:id               Obtiene detalles de una empresa específica.          Token (SUPERADMIN)
PUT         /api/empresa/update/:id             Actualiza datos de geolocalización o razón social.   Token (SUPERADMIN) + Body
DELETE      /api/empresa/delete/:id             Elimina la empresa y sus datos vinculados.           Token (SUPERADMIN)
PUT         /api/empresa/settings/archive     Configura días para archivar solicitudes e incidencias Token (SUPERADMIN) + Body: { daysArchiveRequests, daysArchiveIssues }

```


```
USERS (USUARIOS)
🛠️ Método       📍 Endpoint                    📝 Descripción                                       📦 Requerimientos / Auth
POST             /api/users/crear-user          Crea un usuario (Admin o Worker).                    Token (SUPERADMIN/ADMIN) + Body
GET              /api/users/list-users          Lista todos los usuarios (según permisos).           Token (SUPERADMIN/ADMIN)
GET              /api/users/find/:id            Busca un usuario específico por su ID.               Token (SUPERADMIN/ADMIN)
PUT              /api/users/update/:id          Actualiza los datos de un usuario.                   Token (ADMIN) + Body: UpdateUserDto
DELETE           /api/users/delete/:id          Elimina un usuario (Borrado lógico).                 Token (ADMIN)

```

```
WORKER
🛠️ Método	     📍 Endpoint	                     📝 Descripción	                                📦 Requerimientos / Body
POST             /api/worker/crear-worker           Registra/Pre-autoriza un nuevo trabajador.     Token (ADMIN) + Body
GET              /api/worker/list-workers           Lista todos los trabajadores de la empresa.    Token (ADMIN) + Body
GET              /api/worker/find/:id               Obtiene la ficha de un trabajador.             Token (ADMIN/WORKER)
PUT              /api/worker/update/:id             Actualiza información del trabajador.          Token (ADMIN) + Body
DELETE           /api/worker/delete/:id             Borra un trabajador autorizado.                Token (ADMIN)
PUT              /api/worker/assign-schedule/:id    Asignar Horario: Vincula horario a trabajador. Token (ADMIN) + Body

```


```
SOLICITUDES (REQUESTS)
🛠️ Método      📍 Endpoint                        📝 Descripción                                      📦 Requerimientos / Auth
POST            /api/request/crear-request         Crea una nueva solicitud (Permisos, Bajas, etc.).    Token (ADMIN/WORKER) + Body
PUT             /api/request/check/:id             Aprueba o rechaza una solicitud específica.          Token (ADMIN) + Body
GET             /api/request/my-request            Lista las solicitudes del usuario autenticado.       Token (ADMIN/WORKER)
GET             /api/request/company-request       Lista todas las solicitudes de la empresa.           Token (ADMIN)
GET	            /api/request/find/:id	             Obtiene el detalle de una solicitud específica por su ID.	Token (ADMIN/WORKER)
PATCH	          /api/request/edit-request/:id	     Permite al trabajador modificar una solicitud pendiente.	Token (WORKER) + Body
```

```
HORARIOS (SCHEDULES)
🛠️ Método     📍 Endpoint                          📝 Descripción                                       📦 Requerimientos / Auth
POST           /api/schedule/crear-schedule          Crea un nuevo horario (Planificación base).          Token (ADMIN) + Body
GET            /api/schedule/list-schedules          Lista los horarios de la empresa con sus franjas.    Token (ADMIN/WORKER)
GET            /api/schedule/find/:id                Busca los detalles de un horario por su ID.          Token (ADMIN/WORKER)
DELETE         /api/schedule/delete/:id              Elimina un horario completo del sistema.             Token (ADMIN)
PUT	           /api/schedule/editar/:id	             Actualiza un horario existente por su ID.	          Token (ADMIN) + Body
GET	           /api/schedule/stats/objetivo	         Obtiene las horas que el trabajador debe trabajar.	  Token (ADMIN/WORKER)
GET            /api/schedule/stats/real              Obtiene las horas que el trabajador lleva trabajadas.Token (ADMIN/WORKER)
GET            /api/schedule/stats/progreso          Obtiene el % de cumplimiento semanal (Real vs Objetivo).Token (ADMIN/WORKER)
GET            /api/schedule/stats/progreso/:userId  Consulta el progreso de cualquier trabajador por su  ID.Token (ADMIN) 
```

```
LEAVES (VACACIONES Y PERMISOS)
🛠️ Método     📍 Endpoint                           📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/leaves/range                        Crea permisos en un rango de fechas (Vacaciones).    Token (ADMIN) + Body
GET         /api/leaves/my-leaves                    Lista los permisos aprobados del usuario actual.     Token (ADMIN/WORKER)
GET         /api/leaves/user/:id                     Lista los permisos de un trabajador específico.      Token (ADMIN)

```

```
FRANJAS HORARIAS (TIME SLOTS)
🛠️ Método    📍 Endpoint                            📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/franja-horaria/crear                Crea una franja (valida solapamientos y empresa).     Token (ADMIN) + Body
GET         /api/franja-horaria/list-franja-horaria  Lista todas las franjas de la empresa.                Token (ADMIN/WORKER)
GET         /api/franja-horaria/find/:id             Busca una franja específica por ID.                   Token (ADMIN/WORKER)
PUT         /api/franja-horaria/update/:id           Actualiza horas de una franja existente.              Token (ADMIN) + Body
DELETE      /api/franja-horaria/delete/:id           Elimina una franja del sistema (con Auditoría).       Token (ADMIN)
GET         /api/franja-horaria/by-schedule/:id      Lista las franjas vinculadas a un horario (Schedule). Token (ADMIN/WORKER)

```

```
JORNADAS (WORKDAYS)
🛠️ Método  📍 Endpoint                            📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/jornada/check-in                  Inicia una jornada (evalúa retraso y zona GPS).      Token (Cualquiera) + Body
PUT         /api/jornada/check-out                 Finaliza jornada activa (evalúa salida anticipada).  Token (Cualquiera) + Body
GET         /api/jornada/status                    Indica si el usuario tiene una jornada abierta.      Token (Cualquiera)
GET         /api/jornada/historial                 Devuelve todas las jornadas del usuario actual.      Token (Cualquiera)
GET         /api/jornada/rango?desde=X&hasta=Y     Filtra jornadas del usuario en un rango de fechas.   Token (Cualquiera) + Query params
GET         /api/jornada/dashboard/resumen         Dashboard en tiempo real de la empresa de hoy.       Token (ADMIN)
```


```
ASISTENCIAS (ATTENDANCE)
🛠️ Método  📍 Endpoint                              📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/asistencia/crear-asistencia         Registra entrada/ausencia simple (con motivo).        Token (ADMIN/WORKER) + Body
GET         /api/asistencia/my-history               Historial personal de asistencias del usuario.        Token (ADMIN/WORKER)
GET         /api/asistencia/empresa                  Historial global de todos los empleados de la empresa.Token (ADMIN)
GET         /api/asistencia/user/:id                 Consulta el historial de un trabajador específico.    Token (ADMIN)
```

```
ALARMAS (ALARMS)
🛠️ Método  📍 Endpoint                              📝 Descripción                                      📦 Requerimientos / Auth
GET         /api/alarmas/pendientes                  Lista todas las alertas sin revisar de la empresa.   Token (ADMIN)
PUT         /api/alarmas/revisar/:id                 Marca una alarma como leída de forma rápida.         Token (ADMIN)
PUT         /api/alarmas/resolver/:id                Resuelve una alarma añadiendo una nota de gestión.   Token (ADMIN) + Body: { nota: string }

```


```
🛠️ Método	📍 Endpoint	                     📝 Descripción	                                                      📦 Requerimientos / Auth
POST	      /api/actividades/crear	         Crea un nuevo puesto (ej: Ingeniero, Operario).	                     Token (ADMIN) + Body
PUT	        /api/actividades/editar/:id	     Modifica nombre, descripción o tipo de un puesto.	                   Token (ADMIN) + Body
DELETE	    /api/actividades/delete/:id	     Borrado de la actividad. Los usuarios asociados pasan a actividadId=null	Token (ADMIN) + Param: id
GET	      /api/actividades/catalogo  	       Lista de puestos de la empresa (Filtrable por soloActivas).	         Token (ADMIN / WORKER)
GET	      /api/actividades/:id	             Obtiene el detalle de un puesto y sus trabajadores asignados.

```

```
🛠️ Método	 📍 Endpoint	                     📝 Descripción	                                             📦 Requerimientos / Auth
POST	       /api/incidencias/crear	           Reporta una nueva incidencia (Anti-spam 15 min).	            Token (ADMIN / WORKER) + Body
GET	         /api/incidencias/mis-incidencias	 Historial personal de incidencias reportadas por el usuario.	Token (ADMIN / WORKER)
GET	         /api/incidencias/empresa	         Panel del admin para ver incidencias (Filtrable por pendientes).	Token (ADMIN)
PUT	         /api/incidencias/resolver/:id	   Marca una incidencia como solucionada/resuelta.	            Token (ADMIN)
DELETE	     /api/incidencias/delete/:id	     Elimina un reporte de incidencia (Solo si es de su empresa).	Token (ADMIN) 
PUT	         /api/incidencias/edit-incidencia/:id	Edita una incidencia reportada (Solo si es de su empresa).Token (ADMIN / WORKER) + Body

```


# Endpoints - Alguna funcionalidad.




1. Inicialización y Seguridad (Seed & Auth)


1.1 Ejecutar Seed (Inicialización)
Método: ```POST```

Endpoint:``` /api/seeds/run ```

Descripción: ```Crea los datos básicos iniciales y el SuperAdmin en la base de datos.```

```
POST  -  http://localhost:3000/api/seeds/run

Headers - KEY: x-seed-key - VALUE: 123
Body - none

```

1.2 Inicio de Sesión (Login SuperAdmin)


Método: ```POST```

Endpoint:``` /api/auth/login ```

Descripción: ```Obtención del Bearer Token para SuperAdmin.```

```
POST  -  http://localhost:3000/api/auth/login

Body - Json

{
  "email": "superadmin@cti.com",
  "password": "superpassword123M"
}

```

1.3 Inicio de Sesión (Login Admin)


Método: ```POST```

Endpoint:``` /api/auth/login ```

Descripción: ```Obtención del Bearer Token para Administradores de empresa.```

```
POST  -  http://localhost:3000/api/auth/login

Body - Json

{
    "email": "marta.admin@globaltech.com",
    "password": "SecurePassword2026!"
}

```



1.4 Inicio de Sesión (Login Worker)


Método: ```POST```

Endpoint:``` /api/auth/login ```

Descripción: ```Obtención del Bearer Token para Trabajadores.```

```
POST  -  http://localhost:3000/api/auth/login

Body - Json

{
    "dni": "12345678Z", 
    "password": "contraseña123M"
}


```


2. Gestión de Empresas (Exclusivo SuperAdmin)


2.1 Setup Inicial (Crear Empresa + Admin Principal)
Método: ```POST```

Endpoint:``` /api/empresa/crear-empresa ```

Descripción: ```Crea la entidad empresa y vincula a su primer administrador.```

```
POST  -  http://localhost:3000/api/empresa/crear-empresa

Token - SuperAdmin
Body - Json

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


2.2 Obtiene listado de todas las empresas

Método: ```GET```

Endpoint:``` /api/empresa/list-empresas ```

Descripción: ```Lista todas las empresas (con auditoría).```

```
GET  -  http://localhost:3000/api/empresa/list-empresas

Token - SuperAdmin / Admin
Body - none

```

2.3 Obtener una única empresa


Método: ```GET```


Endpoint:``` /api/empresa/:id ```

Descripción: ```Obtiene detalles de una empresa específica.```

```
GET  -  http://localhost:3000/api/empresa/:id

Token - SuperAdmin / Admin
Body - none

```

2.4 Actualizar Empresa


Método: ```PUT```

Endpoint:``` /api/empresa/update/:id ```

Descripción: ```Actualiza datos de geolocalización o razón social.```

```
PUT  -  http://localhost:3000/api/empresa/update/:id

Token - SuperAdmin
Body - Json

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


2.5 Borrar empresa


Método: ```DELETE```

Endpoint:``` /api/empresa/delete/:id ```

Descripción: ```Elimina la empresa y sus datos vinculados.```

```
DELETE  -  http://localhost:3000/api/empresa/delete/:id

Token - SuperAdmin
Body - none

```

3. Gestión de Usuarios y Trabajadores (Admin)`


3.1 Dar de alta a nuevo Usuario/Trabajador


Método: ```POST```

Endpoint:``` /api/allowed-user ```

Descripción: ```Pre-autoriza a un trabajador para que pueda acceder al sistema.```

``` 
POST  -  http://localhost:3000/api/allowed-user

Token - Admin
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


3.2 Crear un usuario genérico (Admin o Worker manual)

Método: ```POST```

Endpoint:``` /api/users/crear-user ```

Descripción: ```Crea un usuario desde el panel.```

```
POST  -  http://localhost:3000/api/users/crear-user

Token - Admin
Body - Json

{
  "email": "empleado@empresa.com",
  "password": "Password123!",
  "nombre": "Carlos",
  "apellidos": "Ruiz",
  "rol": "WORKER"
}

```


3.3 Obtener trabajador por ID


Método: ```PATCH```

Endpoint:``` /api/users/:id ```

Descripción: ```Obtiene el trabajador por id (o actualiza según tu configuración anterior).```

```
PATCH  -  http://localhost:3000/api/users/:id

Token - Admin
Body - none (o Json con campos a actualizar)

```


3.4 Asignar Horario a un trabajador

Método: ```PUT```

Endpoint:``` /api/worker/assign-schedule/:id ```

Descripción: ```Asigna un horario predefinido a un trabajador.```

```
PUT  -  http://localhost:3000/api/worker/assign-schedule/:id

Token - Admin
Body - Json

{
  "horarioId": "3"
}

```


3.5 Comprobar visibilidad de empresa (Worker/Admin)

Método: ```GET```

Endpoint:``` /api/empresas ```

Descripción: ```Comprobar si admin solo ve su empresa.```

```
GET  -  http://localhost:3000/api/empresas

Token - Worker / Admin
Body - none

```


3.6 Listar todos los usuarios

Método: ```GET```
Método: ```GET```

Endpoint:``` /api/users/list-users ```

Descripción: ```Lista todos los usuarios (según permisos del admin).```

```
GET  -  http://localhost:3000/api/users/list-users

Token - Admin / SuperAdmin
Body - none

```

3.7 Actualizar un usuario

Método: ```PUT```

Endpoint:``` /api/users/update/:id ```

Descripción: ```Actualiza los datos de un usuario.```

```
PUT  -  http://localhost:3000/api/users/update/:id

Token - Admin
Body - Json

{
  "nombre": "Carlos Modificado",
  "apellidos": "Ruiz Gómez",
  "rol": "WORKER"
}
```

3.8 Eliminar un usuario 

Método: ```DELETE```

Endpoint:``` /api/users/delete/:id ```

Descripción: ```Elimina o desactiva un usuario del panel.```

```
DELETE  -  http://localhost:3000/api/users/delete/:id

Token - Admin
Body - none

```

3.9 Listar todos los trabajadores (Workers)

Método: ```GET```

Endpoint:``` /api/worker/list-workers ```

Descripción: ```Lista todos los trabajadores autorizados de la empresa.```

```
GET  -  http://localhost:3000/api/worker/list-workers

Token - Admin
Body - none

```

3.10 Actualizar Trabajador

Método: ```PUT```

Endpoint:``` /api/worker/update/:id ```

Descripción: ```Actualiza información de la ficha del trabajador.```

```
PUT  -  http://localhost:3000/api/worker/update/:id

Token - Admin
Body - Json

{
  "telefono": "611222333",
  "categoria": "Encargado"
}

```

3.11 Eliminar Trabajador


Método: ```DELETE```

Endpoint:``` /api/worker/delete/:id ```

Descripción: ```Borra un trabajador autorizado del sistema.```

```
DELETE  -  http://localhost:3000/api/worker/delete/:id

Token - Admin
Body - none

```

4. Horarios y Franjas Horarias (Schedules)

4.1 Crear horario

Método: ```POST```

Endpoint:``` /api/schedules ```

Descripción: ```Crea un nuevo horario maestro con sus franjas.```

```
POST  -  http://localhost:3000/api/schedules

Token - Admin
Body - Json

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

4.2 Obtener horario por id

Método: ```GET```

Endpoint:``` /api/schedules/:id ```

Descripción: ```Obtiene los detalles de un horario.```

```
GET  -  http://localhost:3000/api/schedules/:id

Token - Admin / Worker
Body - none


```

4.3 Borrar horario por id

Método: ```DELETE```

Endpoint:``` /api/schedules/:id ```

Descripción: ```Elimina un horario completo del sistema.```

```
DELETE  -  http://localhost:3000/api/schedules/:id

Token - Admin
Body - none

```


4.4 Crear Franja Horaria individual

Método:``` POST ```

Endpoint:``` /api/franja-horaria/crear ```

Descripción: ```Añade una franja a una distribución validando solapamientos.```

```
POST  -  http://localhost:3000/api/franja-horaria/crear

Token - Admin
Body - Json

{
  "distribucionDiaId": 5,
  "inicio": "09:00",
  "fin": "14:00"
}
```

4.5 Listar todas las franjas horarias

Método: ```GET```

Endpoint: ```/api/franja-horaria/list-franja-horaria```

Descripción: ```Lista todas las franjas de la empresa.```

```
GET  -  http://localhost:3000/api/franja-horaria/list-franja-horaria

Token - Admin / Worker
Body - none

```

4.6 Obtener franja por ID

Método: ``` GET ```

Endpoint:``` /api/franja-horaria/find/:id ```

Descripción: ```Busca una franja específica por ID.```

```
GET  -  http://localhost:3000/api/franja-horaria/find/:id

Token - Admin / Worker
Body - none

```

4.7 Actualizar Franja Horaria

Método: ```PUT```

Endpoint:``` /api/franja-horaria/update/:id ```

Descripción: ```Actualiza las horas de inicio o fin de una franja existente.```

```
PUT  -  http://localhost:3000/api/franja-horaria/update/:id

Token - Admin
Body - Json

{
  "inicio": "09:30",
  "fin": "14:30"
}

```

4.8 Eliminar Franja Horaria


Método: ```DELETE```

Endpoint:``` /api/franja-horaria/delete/:id ```

Descripción: ```Elimina una franja del sistema.```

```
DELETE  -  http://localhost:3000/api/franja-horaria/delete/:id

Token - Admin
Body - none

```

4.9 Obtener Franjas por Horario (Schedule)

Método: ```GET```

Endpoint:``` /api/franja-horaria/by-schedule/:id ```

Descripción: ```Lista las franjas vinculadas a un horario (Schedule) específico.```

```
GET  -  http://localhost:3000/api/franja-horaria/by-schedule/:id

Token - Admin / Worker
Body - none

```


5. Control de Jornadas y Asistencias (Workdays)

5.1 Check-in (Entrada)

Método: ```POST```

Endpoint:``` /api/jornadas/check-in ```

Descripción: ```Inicia una jornada evaluando la zona GPS.```

```
POST  -  http://localhost:3000/api/jornadas/check-in

Token - Worker
Body - Json

{
  "latitud": 40.4167,
  "longitud": -3.7037
}

```

5.2 Check-out (Salida)

Método: ```PATCH```

Endpoint:``` /api/jornadas/check-out ```

Descripción: ```Finaliza la jornada activa del trabajador.```

```
PATCH  -  http://localhost:3000/api/jornadas/check-out

Token - Worker
Body - none

```

5.3 Historial de Jornadas

Método: ```GET```

Endpoint:``` /api/jornada/historial ```

Descripción: ```Devuelve todas las jornadas del usuario actual.```

```
GET  -  http://localhost:3000/api/jornada/historial

Token - Worker
Body - none

```

5.4 Crear Asistencia Manual (Attendance)

Método: ```POST```

Endpoint:``` /api/asistencia/crear-asistencia ```

Descripción: ```Registra entrada/ausencia simple con motivo manual.```

```
POST  -  http://localhost:3000/api/asistencia/crear-asistencia

Token - Admin / Worker
Body - Json

{
  "tipo": "ENTRADA",
  "motivo": "Olvido de fichaje desde la app",
  "fecha": "2026-03-02"
}

```


5.5 Estado de la Jornada Actual

Método: ```GET```

Endpoint:``` /api/jornada/status ```

Descripción: ```Indica si el usuario tiene una jornada abierta en este momento.```

```
GET  -  http://localhost:3000/api/jornada/status

Token - Worker
Body - none

```

5.6 Filtrar Jornadas por Rango

Método: ```GET```

Endpoint:``` /api/jornada/rango?desde=X&hasta=Y ```

Descripción: ```Filtra jornadas del usuario en un rango de fechas.```

```
GET  -  http://localhost:3000/api/jornada/rango?desde=2026-03-01&hasta=2026-03-31

Token - Worker
Body - none

```

5.7 Dashboard Resumen de Empresa

Método: ```GET```

Endpoint:``` /api/jornada/dashboard/resumen ```

Descripción: ```Dashboard en tiempo real de los fichajes de la empresa en el día actual.```

```
GET  -  http://localhost:3000/api/jornada/dashboard/resumen

Token - Admin
Body - none

``` 

Completando: Asistencias (Attendance)


5.8 Historial Personal de Asistencias

Método: ```GET```

Endpoint:``` /api/asistencia/my-history ```

Descripción: ```Historial de registros manuales y justificaciones del usuario.```

```
GET  -  http://localhost:3000/api/asistencia/my-history

Token - Worker
Body - none

```

5.9 Historial Global de Empresa

Método: ```GET```

Endpoint:``` /api/asistencia/empresa ```

Descripción: ```Historial de asistencias manuales de todos los empleados.```

```
GET  -  http://localhost:3000/api/asistencia/empresa

Token - Admin
Body - none

```

5.10 Asistencias de un Usuario Específico

Método: ```GET```

Endpoint:``` /api/asistencia/user/:id ```

Descripción: ```Consulta el historial de justificaciones de un trabajador concreto.```

```
GET  -  http://localhost:3000/api/asistencia/user/:id

Token - Admin
Body - none

```

6. Solicitudes y Vacaciones (Requests & Leaves)

6.1 Solicitudes - Solicitar (Worker)

Método: ```POST```

Endpoint:``` /api/solicitudes ```

Descripción: ```Crear solicitud para workers (Vacaciones, Enfermedad, Permiso, Asuntos Propios).```

```
POST  -  http://localhost:3000/api/solicitudes

Token - Worker
Body - Json

{
  "tipo": "ENFERMEDAD",
  "fechaInicio": "2026-10-03",
  "fechaFin": "2026-11-15",
  "motivo": "Vacaciones de verano"
}

```
6.2 Aprobar solicitud - Admin

Método: ```PATCH```

Endpoint:``` /api/request/check/:id ```

Descripción: ```Aprueba o rechaza una solicitud pendiente.```

```
PATCH  -  http://localhost:3000/api/request/check/:id

Token - Admin
Body - Json

{
  "estado": "APROBADA",
  "comentarioAdmin": "Disfruta tus vacaciones"
}

```

6.3 Obtener todas las solicitudes

Método: ```GET```

Endpoint:``` /api/solicitudes/mis-solicitudes ```

Descripción: ```Para ver todas las solicitudes pendientes del usuario.```

```
GET  -  http://localhost:3000/api/solicitudes/mis-solicitudes

Token - Worker
Body - none

```

6.4 Crear Rango de Vacaciones (Admin)

Método: ```POST```

Endpoint:``` /api/leaves/range ```

Descripción: ```Crea permisos aprobados directamente en un rango de fechas.```

```
POST  -  http://localhost:3000/api/leaves/range

Token - Admin
Body - Json

{
  "usuarioId": 12,
  "fechaInicio": "2026-08-01",
  "fechaFin": "2026-08-15",
  "tipo": "VACACIONES",
  "observaciones": "Vacaciones de verano aprobadas"
}

```

6.5 Listar permisos de un trabajador (Admin)

Método: ```GET```

Endpoint:``` /api/leaves/user/:id ```

Descripción: ```Lista los permisos de un trabajador específico.```

```
GET  -  http://localhost:3000/api/leaves/user/12

Token - Admin
Body - none

```

6.6 Obtener solicitudes de la empresa (Admin)

Método: ```GET```

Endpoint:``` /api/request/company-request ```

Descripción: ```Lista todas las solicitudes de la empresa para que el admin las revise.```

```
GET  -  http://localhost:3000/api/request/company-request

Token - Admin
Body - none

```


7. Actividades / Puestos

7.1 Crear Nueva Actividad

Método: ```POST```

Endpoint:``` /api/actividades/crear ```

Descripción: ```Crea un nuevo puesto (ej: Ingeniero, Operario).```

```
POST  -  http://localhost:3000/api/actividades/crear

Token - Admin
Body - Json

{
  "nombre": "Técnico Especialista",
  "descripcion": "Encargado de mantenimiento de maquinaria pesada",
  "tipo": "MANTENIMIENTO",
  "fecha": "2026-03-10"
}

```

7.2 Editar Actividad

Método: ```PUT```

Endpoint:``` /api/actividades/editar/:id ```

Descripción: ```Modifica nombre, descripción o tipo de un puesto.```

```
PUT  -  http://localhost:3000/api/actividades/editar/8

Token - Admin
Body - Json

{
  "nombre": "Técnico Especialista Senior",
  "descripcion": "Liderazgo de equipo de mantenimiento y gestión de recambios"
}

```

7.3 Borrado con Desvinculación

Método: ```DELETE```

Endpoint:``` /api/actividades/delete/:id ```

Descripción: ```Borrado físico de la actividad. Los usuarios asociados pasan a tener actividadId = null.```

```
DELETE  -  http://localhost:3000/api/actividades/delete/8

Token - Admin
Body - none

```


7.4 Catálogo de Actividades

Método: ```GET```

Endpoint:``` /api/actividades/catalogo ```

Descripción: ```Lista de puestos de la empresa disponibles para asignar.```

```
GET  -  http://localhost:3000/api/actividades/catalogo

Token - Admin / Worker
Body - none

```

7.5 Obtener detalle de Actividad

Método: ```GET```

Endpoint:``` /api/actividades/:id ```

Descripción: ```Obtiene el detalle de un puesto y (opcionalmente) sus trabajadores asignados.```

```
GET  -  http://localhost:3000/api/actividades/:id

Token - Admin / Worker
Body - none

```

8. Incidencias y Alarmas (Issues & Alarms)

  NO_ASISTENCIA = 'NO_ASISTENCIA',
  TARDANZA = 'TARDANZA',
  SALIDA_ANTICIPADA = 'SALIDA_ANTICIPADA',
  FALTA_JORNADA = 'FALTA_JORNADA',
  MARCA_IRREGULAR = 'MARCA_IRREGULAR',
  INCUMPLIMIENTO_NORMAS = 'INCUMPLIMIENTO_NORMAS',
  OTRO = 'OTRO',


8.1 Crear una Incidencia

Método: ```POST```

Endpoint:``` /api/incidencias/crear ```

Descripción: ```Reporta una nueva incidencia (Anti-spam 15 min).```

```
POST  -  http://localhost:3000/api/incidencias/crear

Token - Admin / Worker
Body - Json

{
  "tipo": "TECNICO",
  "descripcion": "Fallo en la conexión del terminal de fichaje planta 1",
  "prioridad": "ALTA"
}

```

8.2 Resolver/Actualizar Incidencia

Método: ```PUT```

Endpoint:``` /api/incidencias/resolver/:id ```

Descripción: ```Marca una incidencia como solucionada/resuelta.```

```
PUT  -  http://localhost:3000/api/incidencias/resolver/5

Token - Admin
Body - Json

{
  "descripcion": "Problema con el sistema - Resuelto tras reinicio de router",
  "tipo": "TECNICO",
  "estado": "RESUELTA"
}

```

8.3 Listar Incidencias de la Empresa

Método: ```GET```

Endpoint:``` /api/incidencias/empresa?estado=PENDIENTE ```

Descripción: ```Panel del admin para ver incidencias.```

```
GET  -  http://localhost:3000/api/incidencias/empresa?estado=PENDIENTE

Token - Admin
Body - none


```

8.4 Eliminar Incidencia

Método: ```DELETE```

Endpoint:``` /api/incidencias/:id ```

Descripción: ```Elimina un reporte de incidencia.```

```
DELETE  -  http://localhost:3000/api/incidencias/5

Token - Admin
Body - none

```

8.5 Obtener Alarmas Pendientes

Método: ```GET```

Endpoint:``` /api/alarmas/pendientes ```

Descripción: ```Retorna un array con las alarmas cuyo estado sea 'PENDIENTE' o 'NO_LEIDA' dentro de tu empresa.```

```
GET  -  http://localhost:3000/api/alarmas/pendientes

Token - Admin
Body - none

```

8.6 Marcar como Leída (Rápido)

Método: ```PUT```

Endpoint:``` /api/alarmas/revisar/:id ```

Descripción: ```Cambia el estado de la alarma a 'LEIDA'.```

```
PUT  -  http://localhost:3000/api/alarmas/revisar/42

Token - Admin
Body - none

```

8.7 Resolver Alarma con Nota

Método: ```PUT```

Endpoint:``` /api/alarmas/resolver/:id ```

Descripción: ```Resuelve una alarma añadiendo una nota de gestión.```

```
PUT  -  http://localhost:3000/api/alarmas/resolver/42

Token - Admin
Body - Json

{
  "nota": "Incidencia revisada. El trabajador ya ha sido notificado sobre el cambio de turno."
}

```


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

```
🛠️ Método	📍 Endpoint	                              📝 Descripción	                                      📦 Requerimientos / Auth
POST	    /api/actividades/crear	         Crea un nuevo puesto (ej: Ingeniero, Operario).	   Token (ADMIN) + Body: CreateActividadDto
PUT	    /api/actividades/editar/:id	     Modifica nombre, descripción o tipo de un puesto.	 Token (ADMIN) + Body: UpdateActividadDto
DELETE	/api/actividades/delete/:id	      Borrado físico de la actividad. Los usuarios asociados pasan a tener actividadId = null	Token (ADMIN) + Param: id
GET	      /api/actividades/catalogo  	     Lista de puestos de la empresa (Filtrable por soloActivas).	Token (ADMIN / WORKER)
GET	      /api/actividades/:id	           Obtiene el detalle de un puesto y sus trabajadores asignados.

```

```

🛠️ Método	 📍 Endpoint	         📝 Descripción	📦 Requerimientos / Auth
POST	 /api/incidencias/crear	           Reporta una nueva incidencia (Anti-spam 15 min).	Token (ADMIN / WORKER) + Body: CreateIssueDto
GET	   /api/incidencias/mis-incidencias	 Historial personal de incidencias reportadas por el usuario.	Token (ADMIN / WORKER)
GET	   /api/incidencias/empresa	         Panel del admin para ver incidencias (Filtrable por pendientes).	Token (ADMIN)
PUT	   /api/incidencias/resolver/:id	   Marca una incidencia como solucionada/resuelta.	Token (ADMIN)
DELETE /api/incidencias/:id	             Elimina un reporte de incidencia (Solo si es de su empresa).	Token (ADMIN)

```



🔑 SEED / LOGIN
🛠️ Método  📍 Endpoint       📝 Descripción                         📦 Requerimientos/Body

POST       /api/seeds/run     Inicializa SuperAdmin y datos base.     Header: x-seed-key: 123
POST       /api/auth/login    Login global (Email o DNI).             { "email": "...", "password": "..." }
Ejemplo Login Worker (DNI):

```
JSON

{
  "dni": "12345678Z",
  "password": "contraseña123M"
}

```

EMPRESA (COMPANY)
🛠️ Método  📍 Endpoint                               📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/empresa/crear-empresa               Setup Inicial: Crea empresa + Admin principal.       Token (SUPERADMIN) + Body: SetupCompanyDto
GET         /api/empresa/list-empresas               Lista todas las empresas (con auditoría).            Token (SUPERADMIN/ADMIN)
GET         /api/empresa/find/:id                   Obtiene detalles de una empresa específica.          Token (SUPERADMIN)
PUT         /api/empresa/update/:id                  Actualiza datos de geolocalización o razón social.   Token (SUPERADMIN) + Body: UpdateCompanyDto
DELETE      /api/empresa/delete/:id                  Elimina la empresa y sus datos vinculados.           Token (SUPERADMIN)



Ejemplo setup empresa(POST): 

```
{
  "nombreEmpresa": "Global Tech Logistics S.A.",
  "cif": "A87654321",
  "direccion": "Avenida Central 100",
  "poblacion": "Barcelona",
  "provincia": "Barcelona",
  "pais": "España",
  "email": "ops@globaltech.com",
  "admin": {
    "email": "marta.admin@globaltech.com",
    "password": "SecurePassword2026!",
    "telefono": "+34600000001"
  }
}

```
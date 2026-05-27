# Documentación Técnica Completa - Fichaje CTI

**Sistema de Gestión de Presencia y Recursos Humanos Multi-Empresa**

---

## 📋 Índice

1. [Visión General del Proyecto](#visión-general-del-proyecto)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Librerías y Dependencias](#librerías-y-dependencias)
4. [Entidades de la Base de Datos](#entidades-de-la-base-de-datos)
5. [Configuraciones del Sistema](#configuraciones-del-sistema)
6. [Sistema de Seguridad](#sistema-de-seguridad)
7. [Enums del Sistema](#enums-del-sistema)
8. [Variables de Entorno](#variables-de-entorno)
9. [Configuración Docker](#configuración-docker)
10. [Proxy Nginx](#proxy-nginx)
11. [Base de Datos PostgreSQL](#base-de-datos-postgresql)
12. [pgAdmin](#pgadmin)
13. [Colección Postman](#colección-postman)
14. [Script de Despliegue Automático](#script-de-despliegue-automático)
15. [Flujo del PIN](#flujo-del-pin)
16. [Envío de Correo del PIN](#envío-de-correo-del-pin)
17. [Seed de Inicialización](#seed-de-inicialización)
18. [Módulos del Sistema](#módulos-del-sistema)
19. [Flujo Completo de la Aplicación](#flujo-completo-de-la-aplicación)
20. [Guía de Despliegue](#guía-de-despliegue)

---

##  Visión General del Proyecto

Fichaje CTI es un sistema completo de gestión de Recursos Humanos con arquitectura multi-tenant, desarrollado en NestJS + TypeORM + PostgreSQL. El sistema permite a múltiples empresas gestionar sus trabajadores, horarios, fichajes, solicitudes y ausencias de forma independiente y segura.

### Características Principales

- **Multi-tenancy**: Aislamiento completo de datos por empresa
- **Seguridad JWT**: Autenticación basada en tokens con 3 roles (SUPERADMIN, ADMIN, WORKER)
- **Geolocalización**: Validación de fichajes por GPS con radio permitido
- **Horarios Rotativos**: Sistema avanzado de turnos con ciclos configurables
- **Sistema de PIN**: Login rápido para trabajadores con PIN de 6 dígitos
- **Notificaciones**: Alarmas en tiempo real con WebSocket
- **Limpieza Automática**: Cron jobs para mantenimiento de datos antiguos

---

##  Arquitectura del Sistema

### Stack Tecnológico

- **Backend**: NestJS (Framework Node.js)
- **ORM**: TypeORM
- **Base de Datos**: PostgreSQL 15
- **Contenedores**: Docker + Docker Compose
- **Proxy**: Nginx 1.25 Alpine
- **Autenticación**: JWT + Passport
- **Validación**: class-validator + class-transformer

### Estructura de Módulos (20 módulos)

```
backend/src/
├── auth/              # Autenticación y autorización
├── users/             # Gestión de usuarios
├── company/           # Gestión de empresas (multi-tenant)
├── worker/            # Perfil de trabajadores
├── workday/           # Jornadas laborales y fichaje
├── schedule/          # Horarios y turnos
├── timeSlot/          # Franjas horarias
├── attendance/        # Registro de asistencia
├── absence/           # Gestión de ausencias
├── request/           # Sistema de solicitudes
├── issue/             # Incidencias
├── alarms/            # Alertas y alarmas
├── activity/          # Catálogo de puestos
├── site/              # Gestión de obras/sitios
├── siteLog/           # Fichajes en obras
├── issue-site/        # Incidencias en obras
├── mail/              # Servicio de correo
├── seed/              # Inicialización de datos
└── common/            # Utilidades compartidas
```

---

##  Librerías y Dependencias

### Dependencias de Producción

| Librería | Versión | Justificación de Uso |
|----------|---------|---------------------|
| **@nestjs/core** | ^11.1.10 | Framework principal NestJS |
| **@nestjs/common** | ^11.1.10 | Módulos comunes de NestJS |
| **@nestjs/platform-express** | ^11.0.1 | Plataforma HTTP Express |
| **@nestjs/typeorm** | ^11.0.0 | Integración TypeORM con NestJS |
| **@nestjs/jwt** | ^11.0.2 | Generación y validación de tokens JWT |
| **@nestjs/passport** | ^11.0.5 | Estrategias de autenticación Passport |
| **@nestjs/config** | ^4.0.3 | Gestión de configuración y variables de entorno |
| **@nestjs/schedule** | ^6.1.1 | Tareas programadas (Cron jobs) |
| **@nestjs/throttler** | ^6.5.0 | Rate limiting para protección contra ataques |
| **@nestjs/swagger** | ^11.2.3 | Documentación automática de API |
| **@nestjs/platform-socket.io** | ^11.1.14 | WebSockets para notificaciones en tiempo real |
| **@nestjs/websockets** | ^11.1.14 | Gateway de WebSockets |
| **@nestjs/class-validator** | ^0.13.4 | Validación de DTOs |
| **@nestjs/class-transformer** | ^0.4.0 | Transformación de datos |
| **@nestjs/mapped-types** | * | Tipos mapeados para DTOs |
| **typeorm** | ^0.3.28 | ORM para PostgreSQL |
| **pg** | ^8.16.3 | Driver de PostgreSQL |
| **bcrypt** | ^6.0.0 | Encriptación de contraseñas |
| **jsonwebtoken** | ^9.0.3 | Generación de tokens JWT |
| **passport** | ^0.7.0 | Middleware de autenticación |
| **passport-jwt** | ^4.0.1 | Estrategia JWT para Passport |
| **class-validator** | ^0.15.1 | Validación de datos |
| **class-transformer** | ^0.5.1 | Transformación de objetos |
| **cors** | ^2.8.5 | Habilitación de CORS |
| **cookie-parser** | ^1.4.7 | Parseo de cookies |
| **nodemailer** | ^8.0.7 | Envío de correos electrónicos |
| **date-holidays** | ^3.26.12 | Cálculo de festivos |
| **ioredis** | ^5.9.0 | Cliente Redis (para sesiones/caching) |
| **twilio** | ^5.11.2 | Envío de SMS (opcional) |
| **rxjs** | ^7.8.1 | Programación reactiva |

### Dependencias de Desarrollo

| Librería | Versión | Justificación de Uso |
|----------|---------|---------------------|
| **@nestjs/cli** | ^11.0.14 | CLI de NestJS para scaffolding |
| **@nestjs/testing** | ^11.0.1 | Utilidades de testing |
| **@nestjs/schematics** | ^11.0.0 | Esquemas para generación de código |
| **typescript** | ^5.7.3 | Compilador TypeScript |
| **ts-node** | ^10.9.2 | Ejecución directa de TypeScript |
| **ts-loader** | ^9.5.2 | Loader de TypeScript para Webpack |
| **jest** | ^30.0.0 | Framework de testing |
| **ts-jest** | ^29.2.5 | Preprocesador Jest para TypeScript |
| **eslint** | ^9.18.0 | Linting de código |
| **typescript-eslint** | ^8.20.0 | Parser ESLint para TypeScript |
| **prettier** | (implicit) | Formateo de código |
| **@types/*** | Varias | Definiciones de tipos TypeScript |

---

## 🗄️ Entidades de la Base de Datos

### Resumen de Entidades (20 entidades)

| Entidad | Tabla | Descripción | Relaciones Principales |
|---------|-------|-------------|------------------------|
| **User** | users | Usuarios del sistema (auth) | Company, Horario, Workday, Ausencia, Request |
| **Company** | empresas | Empresas (multi-tenant) | User, Horario, Request, Attendance |
| **Worker** | workers | Perfil laboral de trabajadores | User, Activity |
| **Workday** | jornadas | Jornadas laborales y fichajes | User, Company |
| **Schedule** | horarios | Horarios y turnos | Company, User, DistribucionDia |
| **DistribucionDia** | distribucion_dia | Distribución por día de horario | Schedule, FranjaHoraria |
| **FranjaHoraria** | franjas_horarias | Franjas horarias | DistribucionDia |
| **Attendance** | asistencias | Registro de asistencia | Company, User |
| **Absence** | ausencias | Ausencias y vacaciones | User |
| **Request** | solicitudes | Solicitudes (permisos, cambios) | User, Company, RevisionRequest |
| **RevisionRequest** | revisiones_solicitudes | Revisiones de solicitudes | Request |
| **Issue** | incidencias | Incidencias reportadas | User, Company |
| **Alarm** | alarmas | Alertas y notificaciones | User, Company |
| **Activity** | actividades | Catálogo de puestos de trabajo | User |
| **Site** | sitios | Obras o ubicaciones de trabajo | Company |
| **SiteLog** | site_logs | Fichajes en obras | Site, User |
| **SiteLogBreak** | site_log_breaks | Pausas en fichajes de obra | SiteLog |
| **IssueSite** | issue_sites | Incidencias en obras | Site, User |
| **Mail** | mails | Registro de correos enviados | - |

### Detalle Completo de Entidades (20 entidades)

#### User (users)
- **Propósito**: Entidad principal de autenticación y gestión de usuarios
- **Campos clave**: id (number), email (text|unique), dni (text|unique), telefono (text|unique), password (text|select:false), rol (enum: SUPERADMIN, ADMIN, WORKER), empresaId (number), pin (text|select:false), isPinActive (boolean), isVerified (boolean), isActive (boolean), horarioId (number), actividadId (number), fechaInicioHorario (timestamp), pinUpdatedAt (timestamp), tokenExpiraEn (timestamp)
- **Funcionalidad**: Sistema de autenticación con JWT, login con PIN de 6 dígitos, gestión de roles y permisos, asignación de horarios y actividades
- **Relaciones**: Company (ManyToOne, onDelete: CASCADE), Horario (ManyToOne, nullable), Activity (ManyToOne, onDelete: SET NULL), Workday (OneToMany), Ausencia (OneToMany), Request (OneToMany), Attendance (OneToMany), Issue (OneToMany), Worker (OneToOne)

#### Company (empresas)
- **Propósito**: Multi-tenancy - aislamiento completo por empresa
- **Campos clave**: id (number), nombre (text|unique), cif (text), configPassword (varchar|select:false), direccion (text), codigoPostal (text), provincia (text), poblacion (text), contactoNombre (text), telefonoContacto (text), telefonoEmpresa (text), pais (text), email (text), isActive (boolean), codigoRegion (varchar), plan (varchar: trial, premium, expired), trialEndsAt (timestamp), latitud (float), longitud (float), radioPermitido (float|default:100), daysArchiveIssues (int|default:5), daysArchiveRequests (int|default:15)
- **Funcionalidad**: Configuración de geofencing para fichajes, gestión de planes de suscripción, configuración de limpieza automática de datos, contraseña maestra para generación de PINs
- **Relaciones**: User (OneToMany, cascade: true), Horario (OneToMany, cascade: true, onDelete: CASCADE), Request (OneToMany), Attendance (OneToMany)

#### Worker (workers)
- **Propósito**: Perfil laboral detallado de trabajadores
- **Campos clave**: id (number|PrimaryColumn), telefono (varchar|20|unique), dni (varchar|20|unique), email (varchar|150|unique), siteId (number), fechaInicioHorario (timestamp), nombre (varchar|100), apellidos (varchar|150), fechaNacimiento (date), calle (text), poblacion (varchar|100), provincia (varchar|100), pais (varchar|100|default:España), categoria (varchar|100), diaPertenece (int), isVerified (boolean), isActive (boolean), rol (enum: UserRole), empresaId (number), horarioId (number), actividadId (number), password (text|select:false)
- **Funcionalidad**: Información personal y laboral completa, asignación a sitios/obras (ManyToMany), gestión de horarios y actividades, relación 1:1 con User
- **Relaciones**: Company (ManyToOne, onDelete: CASCADE), Horario (ManyToOne, onDelete: RESTRICT), Activity (ManyToOne, onDelete: SET NULL), User (OneToOne, onDelete: CASCADE), Workday (OneToMany, cascade: true), Ausencia (OneToMany, cascade: true), Site (ManyToMany)

#### Workday (jornadas)
- **Propósito**: Registro de jornadas laborales y fichajes
- **Campos clave**: id (number), inicio (timestamp), fin (timestamp|nullable), total_segundos (int|nullable), latitudEntrada (float|nullable), longitudEntrada (float|nullable), latitudSalida (float|nullable), longitudSalida (float|nullable), presente (boolean|default:false), modalidad (varchar|default:PRESENCIAL), tipo (varchar|default:Entrada)
- **Funcionalidad**: Registro de check-in/check-out con geolocalización, cálculo de tiempo trabajado, detección de modalidad de trabajo (presencial/remoto)
- **Relaciones**: User (ManyToOne, onDelete: CASCADE), Company (ManyToOne)

#### Horario (horarios)
- **Propósito**: Definición de horarios y turnos
- **Campos clave**: id (number), nombre (text), tipo (text), isActive (boolean|default:true), esRotativo (boolean|default:false), semanasRotacion (int|default:1), empresaId (number), deletedAt (timestamp|nullable)
- **Funcionalidad**: Horarios fijos y rotativos, sistema de ciclos de rotación por semanas, soft delete para mantener historial
- **Relaciones**: Company (ManyToOne, onDelete: CASCADE), DistribucionDia (OneToMany, cascade: true, eager: true), Worker (OneToMany)

#### DistribucionDia (distribucion_dia)
- **Propósito**: Distribución de horas por día de la semana dentro de un horario
- **Campos clave**: id (number), nombre (text|nullable), diaSemana (enum: LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO), horasDia (float|default:0), semanaRotacion (int|default:1), esLaborable (boolean|default:true), horarioId (number|indexed)
- **Funcionalidad**: Configuración de horas por día, soporte para semanas de rotación en horarios rotativos, marcado de días laborables/no laborables
- **Relaciones**: Horario (ManyToOne, onDelete: CASCADE), FranjaHoraria (OneToMany, cascade: true, eager: true)

#### FranjaHoraria (franjas_horarias)
- **Propósito**: Franjas horarias específicas dentro de un día
- **Campos clave**: id (number), inicio (time), fin (time|nullable)
- **Funcionalidad**: Definición de intervalos de tiempo específicos (ej: 09:00-14:00), permite múltiples franjas por día
- **Relaciones**: DistribucionDia (ManyToOne, onDelete: CASCADE)

#### Attendance (attendances)
- **Propósito**: Registro diario de asistencia
- **Campos clave**: id (number), empresaId (int|nullable), usuarioId (number), fechaJornada (date), fecha (timestamp), presente (boolean|default:false), motivo (varchar|255|nullable)
- **Funcionalidad**: Registro de presencia diaria, índice único (usuarioId, fechaJornada) para evitar duplicados, motivo opcional para ausencias
- **Relaciones**: User (ManyToOne, onDelete: CASCADE), Company (ManyToOne, onDelete: CASCADE)

#### Ausencia (ausencias)
- **Propósito**: Gestión de ausencias y vacaciones
- **Campos clave**: id (number), tipo (enum: TipoAusencia), fechaInicio (date), fechaFin (date), motivo (varchar|255|nullable), estado (enum: AusenciaEstado|default:APROBADA), usuarioId (int|indexed), empresaId (int|indexed), diasConsumidos (int|default:0), diasTotales (int|nullable)
- **Funcionalidad**: Tipos de ausencia (VACACIONES, ENFERMEDAD, PERSONAL), estados (PENDIENTE, APROBADA, RECHAZADA), cálculo de días consumidos, anti-solapamiento de fechas
- **Relaciones**: User (ManyToOne, onDelete: CASCADE)

#### Request (solicitudes)
- **Propósito**: Sistema de solicitudes con workflow de aprobación
- **Campos clave**: id (number), tipo (enum: VACACIONES, ENFERMEDAD, PERMISO, ASUNTOS_PROPIOS, OTROS), nombre (text|nullable), apellidos (text|nullable), fechaInicio (date), fechaFin (date), motivo (text|nullable), estado (enum: RequestStatus|default:PENDIENTE), fechaSolicitud (timestamp), usuarioId (number), empresaId (number), updatedAt (timestamp), deletedAt (timestamp|nullable)
- **Funcionalidad**: Workflow de solicitudes (PENDIENTE → APROBADA/RECHAZADA), soft delete, historial de revisiones, tipos de solicitud variados
- **Relaciones**: User (ManyToOne, onDelete: CASCADE), Company (ManyToOne, onDelete: CASCADE), RevisionRequest (OneToOne)

#### RevisionRequest (revisiones_solicitudes)
- **Propósito**: Revisiones de solicitudes por administradores
- **Campos clave**: id (number), solicitudId (number), adminId (number), comentarioAdmin (text|nullable), fechaDecision (timestamp), estadoResultante (enum: RequestStatus)
- **Funcionalidad**: Registro de quién aprobó/rechazó cada solicitud, comentarios del administrador, fecha de decisión, estado resultante
- **Relaciones**: Request (OneToOne, onDelete: CASCADE), User (ManyToOne - admin que revisa)

#### Issue (incidencias)
- **Propósito**: Registro de incidencias reportadas por usuarios
- **Campos clave**: id (number), tipo (enum: IncidenciaTipo), descripcion (text), userId (number), empresaId (number), nombre (text|nullable), apellidos (text|nullable), estado (boolean|default:false), deletedAt (timestamp|nullable), createdAt (timestamp), updatedAt (timestamp)
- **Funcionalidad**: Tipos de incidencia (OLVIDO_ENTRADA, ERROR_GPS, ENTRADA_TARDIA, etc.), limpieza automática por antigüedad, soft delete, índice compuesto (userId, createdAt)
- **Relaciones**: User (ManyToOne, onDelete: CASCADE)

#### IssueSite (site_incidents)
- **Propósito**: Incidencias específicas de obras/sitios
- **Campos clave**: id (number), type (enum: IncidentType|default:OTHER), severity (enum: IncidentSeverity|default:LOW), description (text), evidenceUrl (varchar|nullable), isResolved (boolean|default:false), resolutionNote (text|nullable), assignedAt (timestamp|nullable), resolvedAt (timestamp|nullable), createdAt (timestamp)
- **Funcionalidad**: Clasificación por tipo y severidad, evidencia fotográfica, asignación a responsables, seguimiento de resolución
- **Relaciones**: Site (ManyToOne), User (ManyToOne - quien reporta), User (ManyToOne - resuelto por), User (ManyToOne - asignado a)

#### Alarm (alarms)
- **Propósito**: Alertas y notificaciones en tiempo real
- **Campos clave**: id (number), tipo (enum: AlarmType), descripcion (text), leidaAdmin (boolean|default:false), fecha (date), leidaWorker (boolean|default:false), empresaId (number), createdAt (timestamp)
- **Funcionalidad**: Tipos de alarma (AUSENCIA_DETECTADA, RETRASO, ZONA_NO_AUTORIZADA, etc.), control de lectura por admin y worker, índice único (usuario, tipo, fecha) para evitar duplicados, notificaciones WebSocket
- **Relaciones**: User (ManyToOne, onDelete: CASCADE), Company (ManyToOne, onDelete: CASCADE)

#### Activity (actividades)
- **Propósito**: Catálogo de puestos de trabajo
- **Campos clave**: id (number), tipo (enum: TipoPuesto|default:OTROS), nombre (varchar|100), descripcion (text|nullable), fecha (date), empresaId (number), activa (boolean|default:true), createdAt (timestamp), updatedAt (timestamp)
- **Funcionalidad**: Tipos de puesto predefinidos (OPERADOR, MECANICO, etc.), nombre específico opcional, control de activación/desactivación
- **Relaciones**: Worker (OneToMany)

#### Site (sites)
- **Propósito**: Gestión de obras/sitios de trabajo
- **Campos clave**: id (number), name (varchar), latitude (decimal|10,8), longitude (decimal|10,8), radiusMeters (int|default:100), direccion (text), poblacion (varchar|100|nullable), codigoPostal (text|nullable), provincia (text|nullable), pais (text|default:España), isActive (boolean|default:true), empresaId (number), createdAt (timestamp), updatedAt (timestamp)
- **Funcionalidad**: Geolocalización precisa de obras, radio permitido para fichaje en obra, dirección completa, asignación múltiple de trabajadores (ManyToMany)
- **Relaciones**: Company (ManyToOne), SiteLog (OneToMany), IssueSite (OneToMany), Worker (ManyToMany)

#### SiteLog (site_logs)
- **Propósito**: Fichajes en obras/sitios
- **Campos clave**: id (number), siteId (number), userId (number), checkIn (timestamp), checkOut (timestamp|nullable), latitudeIn (float), longitudeIn (float), isInsideIn (boolean|default:true), latitudeOut (float|nullable), longitudeOut (float|nullable), isInsideOut (boolean|default:false), notes (text|nullable), totalSeconds (int|nullable), wasAutoClosed (boolean|default:false), isManual (boolean|default:false), editedByAdminId (number|nullable), serverReceivedAt (timestamp), createdAt (timestamp)
- **Funcionalidad**: Registro de entrada/salida en obras con geolocalización, validación de si está dentro del radio permitido, cierre automático de fichajes abiertos, edición manual por admin, registro de hora exacta de recepción en servidor
- **Relaciones**: Site (ManyToOne, onDelete: CASCADE), User (ManyToOne), SiteLogBreak (OneToMany)

#### SiteLogBreak (site_log_breaks)
- **Propósito**: Pausas dentro de fichajes en obras
- **Campos clave**: id (number), startTime (timestamp), endTime (timestamp|nullable), durationSeconds (int|nullable)
- **Funcionalidad**: Registro de pausas/descansos durante jornadas en obra, cálculo automático de duración
- **Relaciones**: SiteLog (ManyToOne, onDelete: CASCADE)

#### Mail (mail)
- **Propósito**: Registro de correos enviados
- **Campos clave**: id (number), destinatario (varchar|150), asunto (varchar|250), tipoCorreo (varchar|50), estado (varchar|20|default:ENVIADO), mensajeError (text|nullable), usuarioId (int|nullable), empresaId (int|nullable), enviadoEn (timestamp)
- **Funcionalidad**: Auditoría de correos enviados (PIN, notificaciones, etc.), registro de errores de envío, tracking por usuario y empresa
- **Relaciones**: User (ManyToOne, onDelete: SET NULL), Company (ManyToOne, onDelete: SET NULL)

---

### Nota sobre Entidades User Duplicadas

El sistema tiene **dos entidades User** que apuntan a la misma tabla `users` pero con diferentes propósitos:

#### User (auth/entities/user.entity.ts)
- **Propósito**: Autenticación y gestión de credenciales
- **Campos específicos**: pin (text|select:false), isPinActive (boolean), pinUpdatedAt (timestamp), hashedRefreshToken (text|nullable), fechaInicioHorario (timestamp|nullable)
- **Relaciones específicas**: Request (OneToMany), sin relación con Worker/Attendance/Issue
- **Uso**: Módulo de autenticación, login con PIN, tokens JWT

#### User (users/entities/user.entity.ts)
- **Propósito**: Gestión de usuarios y relaciones laborales
- **Campos específicos**: actividadId (number|nullable), horarioId (number|nullable)
- **Relaciones específicas**: Worker (OneToOne), Attendance (OneToMany), Issue (OneToMany), sin relación con Request
- **Uso**: Módulo de gestión de usuarios, asignación de horarios, registro de asistencias e incidencias

**Ambas entidades comparten**: id, email, nombre, apellidos, dni, telefono, password, rol, isVerified, isActive, empresaId, tokenExpiraEn, createdAt, updatedAt, y relaciones con Company, Horario, Activity, Workday, Ausencia.

---

## 🔧 Configuraciones del Sistema

### Configuración Principal (main.ts)

**Propósito**: Punto de entrada de la aplicación NestJS, configura el servidor globalmente.

**Configuraciones implementadas**:

- **Timezone**: `Europe/Madrid` - Zona horaria por defecto de la aplicación
- **Global Prefix**: `/api` - Prefijo global para todos los endpoints
- **CORS**: 
  - Origen configurable via `CORS_ORIGIN` (default: `http://localhost:3567`)
  - Soporta múltiples orígenes separados por coma
  - Métodos permitidos: GET, HEAD, PUT, PATCH, POST, DELETE
  - Headers permitidos: Content-Type, Authorization
  - Credentials: true (permite cookies HTTP-only para JWT)
- **ClassSerializerInterceptor**: Transformación automática de entidades usando @Expose() y @Exclude()
- **ValidationPipe**:
  - `whitelist: true` - Elimina propiedades no definidas en DTOs
  - `forbidNonWhitelisted: true` - Lanza error si se envían propiedades no permitidas
  - `transform: true` - Transforma automáticamente tipos de datos según DTOs
- **Puerto**: Configurable via `PORT` (default: 3000)

### Configuración de Módulos (app.module.ts)

**Propósito**: Configura todos los módulos del sistema y la conexión a base de datos.

**Módulos registrados (19 módulos)**:
- AuthModule, UserModule, CompanyModule, WorkerModule
- WorkdayModule, ScheduleModule, TimeSlotModule
- AttendanceModule, AbsenceModule, RequestModule
- IssueModule, IssueSiteModule, AlarmsModule
- ActivityModule, SiteModule, SiteLogModule, MailModule
- SeedModule

**Configuración TypeORM**:
- **Tipo**: PostgreSQL
- **Conexión**: Variables de entorno (DB_HOST, DB_NAME, DB_USERNAME, DB_PASSWORD)
- **AutoLoadEntities**: true - Carga automáticamente todas las entidades
- **Synchronize**: true - Sincroniza esquema con entidades (desarrollo)
- **DropSchema**: false - No elimina esquema al iniciar (producción)
- **Timezone**: UTC - Consistencia global en fechas
- **Entities**: Carga todas las entidades de `/**/*.entity{.ts,.js}`

**Configuración Throttler (Rate Limiting)**:
- **TTL**: 60000ms (1 minuto)
- **Limit**: 5 peticiones por minuto (global)
- **Propósito**: Protección contra ataques de fuerza bruta y DDoS

**Configuración Schedule**:
- **NestScheduleModule**: Habilita tareas programadas (Cron jobs)

**Configuración ConfigModule**:
- **isGlobal**: true - Disponible en todos los módulos
- **envFilePath**: `.env` - Archivo de variables de entorno

---

## 🛡️ Sistema de Seguridad

### Guards (Protectores de Rutas)

#### JwtAuthGuard
- **Propósito**: Verifica que el request tenga un token JWT válido
- **Implementación**: Extiende `AuthGuard('jwt')` de Passport
- **Funcionamiento**:
  - Extrae token del header `Authorization: Bearer <token>`
  - Valida firma y expiración del token
  - Si es válido, adjunta el usuario al request
  - Si es inválido, retorna 401 Unauthorized
- **Uso**: `@UseGuards(JwtAuthGuard)` en controladores o métodos

#### RolesGuard
- **Propósito**: Verifica que el usuario tenga el rol necesario para acceder al endpoint
- **Implementación**: Implementa `CanActivate`
- **Funcionamiento**:
  1. Lee metadata del decorador `@Roles()`
  2. Si no hay `@Roles`, permite acceso (solo requiere JWT)
  3. Si no hay usuario en request, lanza ForbiddenException
  4. Si el rol es SUPERADMIN, permite acceso siempre
  5. Verifica si el rol del usuario está en la lista de permitidos
  6. Si no está autorizado, lanza ForbiddenException con log de seguridad
- **Uso**: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN, UserRole.WORKER)`

### Decoradores Personalizados

#### @GetUser()
- **Propósito**: Extrae el usuario autenticado del request
- **Implementación**: `createParamDecorator` de NestJS
- **Funcionamiento**:
  - Accede al objeto request
  - Retorna el usuario validado por JwtStrategy
  - Opcional: puede retornar una propiedad específica (`@GetUser('id')`)
- **Uso**: 
  ```typescript
  @Get()
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUser() user: UserPayload) {
    return user;
  }
  // O propiedad específica
  @Get()
  @UseGuards(JwtAuthGuard)
  getProfile(@GetUser('id') userId: number) {
    return userId;
  }
  ```

#### @Roles()
- **Propósito**: Define qué roles pueden acceder al endpoint
- **Implementación**: `SetMetadata` de NestJS
- **Funcionamiento**: Guarda metadata que RolesGuard lee para validar
- **Uso**:
  ```typescript
  @Roles(UserRole.ADMIN) // Solo ADMIN
  @Roles(UserRole.ADMIN, UserRole.WORKER) // ADMIN y WORKER
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  create() {}
  ```

### Estrategias de Passport

#### JwtStrategy
- **Propósito**: Valida tokens JWT y extrae el payload del usuario
- **Implementación**: Extiende `PassportStrategy(Strategy)`
- **Configuración**:
  - **jwtFromRequest**: `ExtractJwt.fromAuthHeaderAsBearerToken()`
  - **ignoreExpiration**: false - No ignora expiración
  - **secretOrKey**: `JWT_SECRET` del .env
- **Método validate(payload)**:
  1. **Modo Configuración**: Si `sub === 'COMPANY_CONFIG'`, retorna payload especial para configuración
  2. **Validación Normal**:
     - Busca usuario en DB por ID
     - Si no existe, lanza UnauthorizedException
     - Si está desactivado, lanza UnauthorizedException
     - Carga relación con empresa
     - Retorna UserPayload con: id, email, rol, dni, nombre, apellido, horarioId, empresaId
- **UserPayload Retornado**:
  ```typescript
  {
    id: number;
    email: string;
    rol: UserRole;
    dni: string;
    nombre: string;
    apellido: string;
    horarioId: number;
    empresaId: number;
  }
  ```

### Interfaces

#### UserPayload
- **Propósito**: Define estructura del usuario en token JWT y request
- **Campos**:
  - `id`: number - ID del usuario
  - `email`: string - Email del usuario
  - `userId`: number - ID del usuario (duplicado)
  - `nombre`: string - Nombre del usuario
  - `apellido`: string | null - Apellidos del usuario
  - `dni`: string - DNI del usuario
  - `rol`: UserRole - Rol del usuario
  - `empresaId`: number - ID de la empresa

---

## 📋 Enums del Sistema

### UserRole (auth/roles.enum.ts)
- **SUPERADMIN**: Acceso global a todas las empresas y recursos
- **ADMIN**: Gestión completa de su empresa únicamente
- **WORKER**: Acceso limitado a sus propios datos

### AusenciaEstado (absence/dto/ausencia-estado.enum.ts)
- **PENDIENTE**: Solicitud en espera de revisión
- **APROBADA**: Solicitud aprobada por administrador
- **RECHAZADA**: Solicitud rechazada por administrador

### TipoAusencia (absence/dto/ausencia-estado.enum.ts)
- **VACACIONES**: Días de vacaciones
- **ENFERMEDAD**: Baja por enfermedad
- **ASUNTOS_PROPIOS**: Asuntos personales
- **FESTIVO**: Día festivo
- **PERMISO**: Permiso especial
- **OTROS**: Otros tipos de ausencia

### TipoPuesto (activity/dto/tipo-puesto.enum.ts)
- **DIRECCION_GESTION**: Dirección y gestión
- **ADMINISTRACION_OFICINA**: Administración y oficina
- **COMERCIAL_VENTAS**: Comercial y ventas
- **ATENCION_CLIENTE**: Atención al cliente
- **TECNOLOGIA_IT**: Tecnología y TI
- **PRODUCCION_OPERACIONES**: Producción y operaciones
- **SALUD_SERVICIOS_SOCIALES**: Salud y servicios sociales
- **EDUCACION_FORMACION**: Educación y formación
- **CREATIVO_MARKETING**: Creativo y marketing
- **OFICIOS_TRABAJOS_TECNICOS**: Oficios y trabajos técnicos
- **OTROS**: Otros tipos de puesto

### IncidentType (site/enums/issue-type.enum.ts)
- **WEATHER**: Clima adverso (lluvia, viento, etc.)
- **MATERIAL**: Falta de suministros
- **EQUIPMENT**: Avería de maquinaria
- **ACCIDENT**: Accidente laboral o daño
- **PLAN_ERROR**: Error en planos o instrucciones
- **OTHER**: Otros tipos de incidentes

### IncidentSeverity (site/enums/issue-type.enum.ts)
- **LOW**: No detiene la obra
- **MEDIUM**: Ralentiza el trabajo
- **HIGH**: Obra parada totalmente

### TipoIncidencia (site/enums/issue.enum.ts)
- **CLIMA**: Clima adverso (lluvia, nieve, calor extremo)
- **MATERIAL**: Falta de suministros o material defectuoso
- **MAQUINARIA**: Avería de herramientas o maquinaria pesada
- **ACCIDENTE**: Accidente laboral o situación de riesgo
- **ERROR_PLANOS**: Incongruencias en instrucciones o planos
- **OTRO**: Otros imprevistos

### GravedadIncidencia (site/enums/issue.enum.ts)
- **BAJA**: Molestia menor, la obra continúa normalmente
- **MEDIA**: El ritmo de trabajo se ve afectado o ralentizado
- **ALTA**: ¡OBRA PARADA! Requiere atención inmediata

---


##  Contraseñas 

```bash
DB_USERNAME=postgres          # Usuario de PostgreSQL
DB_PASSWORD=Jp10.Mnl          # Contraseña de PostgreSQL 

JWT_SECRET=tu_secreto_para_access           # Secreto para firmar tokens de acceso
JWT_REFRESH_SECRET=tu_secreto_para_refresh  # Secreto para firmar tokens de refresh

DEMO_COMPANY_PASSWORD=MiSuperPasswordDinamico2026  # Password para empresa demo seed

PIN_PEPPER=alguna_cadena_super_secreta_y_larga_1234567890!@  # "Pimienta" para cifrado HMAC-SHA256 de PINs

MAIL_USER=ac0e20001@smtp-brevo.com          # Usuario SMTP (de Brevo)
MAIL_PASS=bskMpxXmumxC7Kl                    # Contraseña SMTP (clave generada en Brevo)

SEED_SECRET_KEY=123

PGADMIN_EMAIL=admin@cticontrol.com
PGADMIN_PASSWORD=admin123

# --- CONTRASEÑA PARA GENERAR ACCESO PANEL PRIVADO PIN ---
MASTER_PIN_PASSWORD=SUPERpass123.

# --- PARA GENERAR PIN ---
PIN_PEPPER=alguna_cadena_super_secreta_y_larga_1234567890!@

```


##  Variables de Entorno

### Archivo de Configuración del Backend (backend/.env)

Este archivo contiene todas las variables de entorno necesarias para el funcionamiento del backend en contenedores Docker.

```bash
# --- CONEXIÓN A BASE DE DATOS (Interna de Docker) ---
DB_HOST=postgres_bbdd          # El container_name de tu DB en Docker
DB_USERNAME=postgres          # Usuario de PostgreSQL
DB_PASSWORD=Jp10.Mnl          # Contraseña de PostgreSQL
DB_NAME=fichaje_cti           # Nombre de la base de datos
DB_PORT=5432                  # Puerto de PostgreSQL

# --- CONFIGURACIÓN DE LA APP ---
NODE_ENV=development          # Entorno de ejecución (development/production)
PORT=3000                    # Puerto donde escucha la aplicación
CORS_ORIGIN=*                # Orígenes permitidos para CORS (* = todos)
# Alternativa: http://cworker1.cticontrol.com:3567,http://localhost:3567
TZ=Europe/Madrid             # Zona horaria de la aplicación

# --- SEGURIDAD (JWT) ---
JWT_SECRET=tu_secreto_para_access           # Secreto para firmar tokens de acceso
JWT_REFRESH_SECRET=tu_secreto_para_refresh  # Secreto para firmar tokens de refresh
JWT_ADMIN_EXPIRATION=24h                    # Tiempo de expiración token admin (debe coincidir con JWT_ADMIN_EXP_HOURS)
JWT_ADMIN_EXP_HOURS=24                      # Horas de expiración token admin (debe coincidir con JWT_ADMIN_EXPIRATION)
JWT_WORKER_EXPIRATION=1h                    # Tiempo de expiración token worker (debe coincidir con JWT_WORKER_EXP_HOURS)
JWT_WORKER_EXP_HOURS=1                      # Horas de expiración token worker (debe coincidir con JWT_WORKER_EXPIRATION)
JWT_EXPIRATION=1h                           # Tiempo de expiración general
JWT_REFRESH_EXPIRATION=7d                   # Tiempo de expiración token de refresh (7 días)
JWT_ACCESS_EXPIRATION=1h                    # Tiempo de caducidad del token de acceso

# --- LÓGICA DE NEGOCIO ---
SEED_SECRET_KEY=123                          # Clave maestra para ejecutar seed (CAMBIAR EN PRODUCCIÓN)
MAX_FICHAR_DISTANCE=600                      # Distancia máxima en metros para fichar (geofencing)
DEFAULT_DAYS_ISSUES=5                        # Días para archivar incidencias automáticamente
DEFAULT_DAYS_REQUESTS=15                     # Días para archivar solicitudes automáticamente
DEMO_COMPANY_PASSWORD=MiSuperPasswordDinamico2026  # Password para empresa demo seed

# --- GENERACIÓN DE PIN ---
PIN_PEPPER=alguna_cadena_super_secreta_y_larga_1234567890!@  # "Pimienta" para cifrado HMAC-SHA256 de PINs

# --- CONFIGURACIÓN DE CORREO (SMTP Brevo) ---
MAIL_HOST=smtp-relay.brevo.com              # Host del servidor SMTP
MAIL_PORT=587                               # Puerto SMTP (587 para STARTTLS)
MAIL_USER=ac0e20001@smtp-brevo.com          # Usuario SMTP (de Brevo)
MAIL_PASS=bskMpxXmumxC7Kl                    # Contraseña SMTP (clave generada en Brevo)
MAIL_FROM=no-reply@cticontrol.com           # Correo remitente oficial
```

### Archivo de Configuración de Base de Datos (BBDD/.env)

Este archivo contiene las variables de entorno para los contenedores de base de datos (PostgreSQL y pgAdmin).

```bash
# --- CONFIGURACIÓN DE BASE DE DATOS ---
# --- CONEXIÓN A BASE DE DATOS (Interna de Docker) ---
DB_HOST=postgres_bbdd          #  El container_name de tu DB
DB_USERNAME=postgres
DB_PASSWORD=Jp10.Mnl
DB_NAME=fichaje_cti
DB_PORT=5432

# --- CONFIGURACIÓN DE LA APP ---
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://cworker1.cticontrol.com:3567,http://localhost:3567

# --- SEGURIDAD (JWT) ---
JWT_SECRET=tu_secreto_para_access
JWT_REFRESH_SECRET=tu_secreto_para_refresh
JWT_ADMIN_EXPIRATION=24h #poner el mismo valor que jwt_admin_exp_hours
JWT_ADMIN_EXP_HOURS=24  #poner mismo valor que jwt_admin_expiration
JWT_WORKER_EXPIRATION=1h
JWT_WORKER_EXP_HOURS=1
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# --- LÓGICA DE NEGOCIO ---
SEED_SECRET_KEY=123
MAX_FICHAR_DISTANCE=600
DEFAULT_DAYS_ISSUES=5
DEFAULT_DAYS_REQUESTS=15

# --- pgAdmin (opcional) ---
PGADMIN_EMAIL=admin@cticontrol.com
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=5050

# --- Hosts de Base de Datos (Producción y Test) ---
DB_HOST_TEST=postgres_bbdd_test    # Container de test
DB_HOST=postgres_bbdd               # Container de producción

# --- Configuración regional ---
TZ=Europe/Madrid

# --- CONTRASEÑA PARA GENERAR ACCESO PANEL PRIVADO PIN ---
MASTER_PIN_PASSWORD=SUPERpass123.

# --- PARA GENERAR PIN ---
PIN_PEPPER=alguna_cadena_super_secreta_y_larga_1234567890!@
```

### Explicación Detallada de Variables

#### Variables de Base de Datos

- **DB_HOST**: Nombre del contenedor Docker de PostgreSQL (`postgres_bbdd`). Es el nombre interno que Docker usa para resolver el servicio.
- **DB_HOST_TEST**: Nombre del contenedor Docker de PostgreSQL de test (`postgres_bbdd_test`).
- **DB_USERNAME**: Usuario de PostgreSQL (por defecto `postgres`).
- **DB_PASSWORD**: Contraseña del usuario de PostgreSQL. Debe coincidir con la configurada en el contenedor de base de datos.
- **DB_NAME**: Nombre de la base de datos (`fichaje_cti`).
- **DB_PORT**: Puerto de PostgreSQL (5432 es el puerto estándar).

#### Variables de Configuración de la App

- **NODE_ENV**: Entorno de ejecución. `development` para desarrollo local, `production` para despliegue en VPS.
- **PORT**: Puerto donde escucha la aplicación NestJS (3000).
- **CORS_ORIGIN**: Orígenes permitidos para CORS. `*` permite todos los orígenes (no recomendado en producción). Para producción, especificar dominios concretos separados por comas.
- **TZ**: Zona horaria. `Europe/Madrid` para horario español.

#### Variables de Seguridad JWT

- **JWT_SECRET**: Secreto usado para firmar tokens de acceso. Debe ser una cadena larga y aleatoria en producción.
- **JWT_REFRESH_SECRET**: Secreto usado para firmar tokens de refresh. Diferente al JWT_SECRET para mayor seguridad.
- **JWT_ADMIN_EXPIRATION / JWT_ADMIN_EXP_HOURS**: Tiempo de expiración de tokens para administradores (24 horas). Ambas variables deben tener el mismo valor.
- **JWT_WORKER_EXPIRATION / JWT_WORKER_EXP_HOURS**: Tiempo de expiración de tokens para trabajadores (1 hora). Ambas variables deben tener el mismo valor.
- **JWT_EXPIRATION**: Tiempo de expiración general (1 hora).
- **JWT_REFRESH_EXPIRATION**: Tiempo de expiración del token de refresh (7 días). Permite renovar el token de acceso sin re-login.
- **JWT_ACCESS_EXPIRATION**: Tiempo de caducidad del token de acceso (1 hora).

#### Variables de Lógica de Negocio

- **SEED_SECRET_KEY**: Clave maestra para ejecutar el seed de inicialización. Requerida en el header `x-seed-key`. CAMBIAR EN PRODUCCIÓN.
- **MAX_FICHAR_DISTANCE**: Distancia máxima en metros permitida para fichar. Si el trabajador está fuera de este radio, se genera una alarma.
- **DEFAULT_DAYS_ISSUES**: Días después de los cuales las incidencias se archivan automáticamente.
- **DEFAULT_DAYS_REQUESTS**: Días después de los cuales las solicitudes se archivan automáticamente.
- **DEMO_COMPANY_PASSWORD**: Password para la empresa demo creada por el seed.

#### Variables de Generación de PIN

- **PIN_PEPPER**: Cadena secreta usada como "pimienta" en el cifrado HMAC-SHA256 de los PINs. Añade una capa extra de seguridad. Debe ser larga y única.
- **MASTER_PIN_PASSWORD**: Contraseña maestra para acceder al panel privado de generación de PINs. Usada por el admin para generar PINs de trabajadores.

#### Variables de pgAdmin

- **PGADMIN_EMAIL**: Email de acceso a pgAdmin (`admin@cticontrol.com`).
- **PGADMIN_PASSWORD**: Contraseña de acceso a pgAdmin.
- **PGADMIN_PORT**: Puerto donde expone pgAdmin (5050).

#### Variables de Correo (SMTP Brevo)

- **MAIL_HOST**: Host del servidor SMTP de Brevo (`smtp-relay.brevo.com`).
- **MAIL_PORT**: Puerto SMTP (587 para STARTTLS, 465 para SSL).
- **MAIL_USER**: Usuario SMTP proporcionado por Brevo (formato: `ac0e20001@smtp-brevo.com`).
- **MAIL_PASS**: Contraseña SMTP generada en el panel de Brevo (botón "+ Generar una nueva clave...").
- **MAIL_FROM**: Correo que aparece como remitente en los emails enviados (`no-reply@cticontrol.com`). Debe ser un correo verificado en Brevo.




---

## 🐳 Configuración Docker

### Justificación del Uso de Docker

**¿Por qué Docker?**

1. **Consistencia**: El mismo comportamiento en desarrollo y producción
2. **Aislamiento**: Cada servicio en su propio contenedor
3. **Escalabilidad**: Fácil escalado horizontal de servicios
4. **Portabilidad**: Ejecutable en cualquier sistema con Docker
5. **Versionado**: Imágenes versionadas para rollback rápido
6. **Eficiencia**: Menor consumo de recursos que máquinas virtuales

### Implementación Docker

#### Dockerfile (Backend)

```dockerfile
FROM node:lts-alpine
WORKDIR /usr/src/app

# 1. Copiamos los archivos de dependencias
COPY package.json yarn.lock ./

# 2. Instalamos dependencias
RUN yarn install --frozen-lockfile

# 3. Copiamos todo el código fuente
COPY . .

# 4. Compilamos el código
RUN yarn build

# 5. Pasamos a modo producción
ENV NODE_ENV=production

EXPOSE 3000

# 6. Ajustamos permisos por seguridad
RUN chown -R node /usr/src/app
USER node

# 7. Ejecutamos el archivo compilado
CMD ["node", "dist/main.js"]
```

#### Docker Compose - Base de Datos (BBDD/docker-compose.yaml)

**Servicios:**

1. **db-prod**: PostgreSQL de producción
   - Puerto: 5432
   - Red: red_fichaje
   - Volumen: postgres_data_bbdd

2. **db-test**: PostgreSQL de test/desarrollo
   - Puerto: 5433
   - Red: test_network
   - Volumen: db_test_data

3. **pgadmin**: Interfaz de gestión PostgreSQL
   - Puerto: 5050
   - Redes: red_fichaje + test_network
   - Acceso a ambas bases de datos

#### Docker Compose - Backend (backend/docker-compose.yaml)

**Servicios:**

1. **api-prod**: API de producción
   - Container: fichaje_backend
   - Red: red_fichaje
   - DB_HOST: postgres_bbdd

2. **api-test**: API de test
   - Container: fichaje_backend_test
   - Red: test_network
   - DB_HOST: postgres_bbdd_test

#### Docker Compose - Proxy (infra/proxy/docker-compose.yaml)

**Servicio:**

1. **proxy**: Nginx reverse proxy
   - Puertos: 80, 443, 8080
   - Redes: red_fichaje + test_network
   - Configuración: nginx-local.conf

### Redes Docker

- **red_fichaje**: Red principal de producción (external)
- **test_network**: Red de pruebas/desarrollo (external)

### Volúmenes Docker

- **postgres_data_bbdd**: Datos persistentes de producción
- **db_test_data**: Datos persistentes de test

---

## 🌐 Proxy Nginx

### Justificación del Uso de Nginx

**¿Por qué Nginx como Proxy?**

1. **Reverse Proxy**: Enruta solicitudes a los contenedores apropiados
2. **Balanceo de Carga**: Distribuye tráfico entre múltiples instancias
3. **SSL/TLS**: Terminación SSL para HTTPS
4. **Caching**: Mejora el rendimiento con caché estático
5. **Compresión**: Gzip para reducir tamaño de respuestas
6. **Seguridad**: Oculta puertos internos y protege contra ataques
7. **Virtual Hosts**: Múltiples dominios en un solo servidor

### Capa de Acceso: Nginx Proxy (Doble Dominio)

Lanzamos el proxy inyectando la configuración para que no dependa de archivos externos en el VPS.

Nota: Los símbolos `$` están escapados como `\$` para que la terminal no los borre.

#### Comando de Despliegue

```bash
# Eliminar contenedor anterior si existe
docker rm -f nginx_proxy

# Lanzar Nginx con configuración inyectada
docker run -d \
  --name nginx_proxy \
  --network red_fichaje \
  --restart always \
  -p 80:80 \
  -p 443:443 \
  nginx:1.25-alpine /bin/sh -c "echo 'events { worker_connections 1024; }
http {
    # PRODUCCIÓN
    server {
        listen 80;
        server_name fichaday.cticontrol.com;
        location /api/ {
            proxy_pass http://fichaday_backend:3000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        location / {
            proxy_pass http://fichaje-frontend:3000;
        }
    }
    # TEST
    server {
        listen 80;
        server_name fichadaytest.cticontrol.com;
        location / {
            proxy_pass http://fichaday_backend_test:3000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
    }
}' > /etc/nginx/nginx.conf && nginx -g \"daemon off;\""
```

#### Conexión de Redes

```bash
# 1. Conectar Frontend a la red (si no estaba)
docker network connect red_fichaje fichaje-frontend || true

# 2. Conectar Proxy a la red de Test
docker network connect test_network nginx_proxy

# 3. Reiniciar para aplicar
docker restart nginx_proxy
```

### Configuración Nginx Explicada

#### Servidor de Producción (fichaday.cticontrol.com)

```nginx
server {
    listen 80;
    server_name fichaday.cticontrol.com;

    # API apunta al backend de prod
    location /api/ {
        proxy_pass http://fichaday_backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # La raíz apunta al frontend de prod
    location / {
        proxy_pass http://fichaje-frontend:3000;
    }
}
```

#### Servidor de Test (fichadaytest.cticontrol.com)

```nginx
server {
    listen 80;
    server_name fichadaytest.cticontrol.com;

    # La raíz apunta al backend de test (sin frontend separado)
    location / {
        proxy_pass http://fichaday_backend_test:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Características de la Configuración

- **Inyección de Configuración**: La configuración se inyecta directamente en el comando `docker run`, eliminando la dependencia de archivos externos en el VPS
- **Doble Dominio**: Gestiona tanto el dominio de producción como el de test
- **Routing por Location**: `/api/` va al backend, `/` va al frontend
- **Headers**: X-Real-IP para trazabilidad de la IP original del cliente
- **Worker Connections**: 1024 conexiones simultáneas
- **Restart Policy**: `always` para asegurar que el proxy se reinicie automáticamente

---

## 🐘 Base de Datos PostgreSQL

### Justificación del Uso de PostgreSQL

**¿Por qué PostgreSQL?**

1. **Relacional**: Modelo relacional robusto con integridad referencial
2. **ACID**: Garantiza atomicidad, consistencia, aislamiento y durabilidad
3. **TypeORM**: Excelente integración con TypeORM (ORM de NestJS)
4. **JSONB**: Soporte nativo de JSON para datos flexibles
5. **Performance**: Alto rendimiento con índices avanzados
6. **Escalabilidad**: Escala vertical y horizontalmente
7. **Open Source**: Sin costes de licencia
8. **Comunidad**: Amplia documentación y soporte
9. **Geolocalización**: Extensiones PostGIS para datos geoespaciales
10. **Transacciones**: Soporte completo de transacciones anidadas

### Implementación de PostgreSQL

#### Configuración en Docker

```yaml
db-prod:
  image: postgres:15
  container_name: postgres_bbdd
  restart: always
  environment:
    POSTGRES_USER: ${DB_USERNAME}
    POSTGRES_PASSWORD: ${DB_PASSWORD}
    POSTGRES_DB: ${DB_NAME}
  volumes:
    - postgres_data_bbdd:/var/lib/postgresql/data
    - ./init:/docker-entrypoint-initdb.d
  ports:
    - "5432:5432"
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
    interval: 10s
    timeout: 5s
    retries: 10
```

#### Configuración TypeORM

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  autoLoadEntities: true,
  timezone: 'UTC',
})
```

### Características Implementadas

- **Sincronización Automática**: `synchronize: true` en desarrollo
- **Soft Deletes**: Columnas `deleted_at` para borrado lógico
- **Índices**: Índices únicos en campos críticos (email, dni, telefono)
- **Relaciones**: CASCADE para integridad referencial
- **Transacciones**: `dataSource.transaction()` para operaciones críticas

---

## 🔧 pgAdmin

### Propósito

pgAdmin es la herramienta de administración web oficial de PostgreSQL. Permite:

- Gestión visual de bases de datos
- Ejecución de consultas SQL
- Monitorización de rendimiento
- Gestión de usuarios y permisos
- Backup y restore de bases de datos

### Configuración en el Proyecto

```yaml
pgadmin:
  image: dpage/pgadmin4
  container_name: pgadmin_bbdd
  restart: always
  environment:
    PGADMIN_DEFAULT_EMAIL: ${PGADMIN_EMAIL}
    PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
  ports:
    - "${PGADMIN_PORT}:80"
  networks:
    - red_fichaje
    - test_network
  depends_on:
    - db-prod
    - db-test
```

### Acceso

- **URL**: `http://localhost:5050` (local) o `http://IP:5050` (VPS)
- **Email**: `admin@cticontrol.com`
- **Password**: `admin123` (cambiar en producción)

### Conexión a Bases de Datos

1. **Producción**: Host `postgres_bbdd`, Puerto `5432`
2. **Test**: Host `postgres_bbdd_test`, Puerto `5432` (interno)

### Nota de Seguridad

En producción, se recomienda no exponer pgAdmin permanentemente. Levantarlo solo cuando sea necesario para mantenimiento.

---

## 📬 Colección Postman

### Directorio de Endpoints

El proyecto incluye un directorio `EndPoints/` con colecciones de Postman para probar la API:

- **fichaje.postman_collection.json** (110 KB)
- **fichaje.postman_collection2** (77 KB)
- **fichajeUltimo.postman_collection** (80 KB)

### Cómo Importar en Postman

1. Abrir Postman
2. Click en "Import" (esquina superior izquierda)
3. Seleccionar "Upload Files"
4. Elegir el archivo `.json` del directorio `EndPoints/`
5. La colección se importará con todos los endpoints organizados

### Estructura de la Colección

La colección incluye endpoints para:

- **Auth**: Login, logout, refresh token
- **Seed**: Inicialización del sistema
- **Company**: Gestión de empresas
- **Users**: Gestión de usuarios
- **Worker**: Gestión de trabajadores
- **Schedule**: Gestión de horarios
- **Workday**: Fichaje y jornadas
- **Request**: Solicitudes y permisos
- **Absence**: Ausencias y vacaciones
- **Attendance**: Registro de asistencia
- **Alarms**: Alertas y notificaciones
- **Activity**: Catálogo de puestos

### Variables de Entorno en Postman

Configurar las siguientes variables en Postman:

```
baseUrl: http://localhost:3000/api
token: {{token}}  (se actualiza después del login)
empresaId: {{empresaId}}
userId: {{userId}}
```

---

## 🚀 Script de Despliegue Automático

### Archivo: deploy.ps1

```
 Ejecutar antes en powershell:  Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process 



```

Script PowerShell para despliegue local automatizado. Requiere ejecución como administrador. 

### Funcionalidades del Script

1. **Verificación de Permisos**: Comprueba si se ejecuta como administrador
2. **Limpieza Radical**: Detiene contenedores y libera redes
3. **Gestión de Redes**: Crea redes Docker necesarias
4. **Liberación de Puerto 80**: Detiene servicio HTTP de Windows
5. **Levantar BBDD y pgAdmin**: Inicia contenedores de base de datos
6. **Levantar Backend**: Inicia APIs de producción y test
7. **Levantar Proxy**: Inicia Nginx con configuración local
8. **Verificación**: Muestra estado final de todos los contenedores

### Ejecución del Script

```bash
# En terminal como administrador
bash .\deploy.ps1
```

### Flujo del Script

```
1. Verificar permisos de administrador
2. Limpiar contenedores antiguos (manteniendo volúmenes)
3. Borrar redes antiguas
4. Crear red maestra 'red_fichaje'
5. Liberar puerto 80 (net stop http)
6. Levantar BBDD y pgAdmin (cd bbdd + docker compose up -d)
7. Levantar Backend (cd backend + docker compose up -d --build)
8. Levantar Proxy (cd infra/proxy + docker compose up -d)
9. Mostrar estado final (docker ps)
```

### Salida Esperada

```
--- DESPLIEGUE COMPLETADO CON ÉXITO ---
Estado actual de los servicios:
NAMES              STATUS          PORTS
postgres_bbdd      Up 2 minutes    0.0.0.0:5432->5432/tcp
postgres_bbdd_test  Up 2 minutes    0.0.0.0:5433->5432/tcp
pgadmin_bbdd       Up 2 minutes    0.0.0.0:5050->80/tcp
fichaje_backend    Up 1 minute     3000/tcp
fichaje_backend_test Up 1 minute   3000/tcp
nginx_proxy        Up 1 minute     0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

---

## 🔑 Flujo del PIN

### Descripción General

El sistema de PIN permite a los trabajadores acceder rápidamente a la aplicación mediante un código de 6 dígitos, ideal para tablets en obras o puntos de fichaje.

### Fase 1: Generación del PIN (Bautismo)

**Actores**: Admin o Encargado

**Paso 1: Acceso a Zona Oculta**
- El Admin accede a la zona de configuración privada
- Introduce la Contraseña Maestra (configPassword de la empresa)
- Introduce el DNI del trabajador

**Paso 2: Validación Maestra**
- El servidor valida que la contraseña coincida con `configPassword` de la empresa
- Busca al trabajador por DNI en la base de datos

**Paso 3: Cifrado "Pimienta" (HMAC-SHA256)**
```
1. Generar código aleatorio de 6 dígitos (ej: 456123)
2. Mezclar con PIN_PEPPER del .env
3. Generar hash HMAC-SHA256
4. Guardar hash en base de datos
```

**Paso 4: Entrega**
- El sistema muestra el PIN (456123) al Admin
- El Admin se lo entrega al trabajador (por correo, SMS o en persona)

### Fase 2: Login del Trabajador (Día a Día)

**Actores**: Trabajador

**Paso 1: Entrada de PIN**
- El trabajador teclea su PIN de 6 dígitos en la tablet
- El Rate Limiter vigila (máximo 5 intentos por IP)

**Paso 2: Protección contra Ataques**
- Si hay más de 5 intentos fallidos, el sistema bloquea la tablet temporalmente
- Previene ataques de fuerza bruta

**Paso 3: Búsqueda Silenciosa**
```
1. Servidor recibe el PIN
2. Añade PIN_PEPPER
3. Calcula hash HMAC-SHA256
4. Busca en base de datos: "¿Quién tiene este hash?"
```

**Paso 4: Identificación Instantánea**
- Como el hash es único, la base de datos encuentra al trabajador inmediatamente
- No se expone el PIN original en ninguna consulta

**Paso 5: Emisión de Tokens**
- El AuthService genera un Token JWT oficial
- El trabajador accede al sistema con su rol (WORKER)

### Seguridad del PIN

- **Hash HMAC-SHA256**: El PIN nunca se almacena en texto plano
- **PIN_PEPPER**: Valor secreto que añade una capa extra de seguridad
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Único por Trabajador**: Cada trabajador tiene su propio PIN
- **Regeneración**: El Admin puede regenerar el PIN en cualquier momento

---

## 📧 Envío de Correo del PIN

### Servicio de Correo (MailService)

El sistema utiliza **Nodemailer** para el envío de correos electrónicos con el PIN a los trabajadores.

### Configuración SMTP

```typescript
this.transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,        // smtp.brevo.com
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: port === 465,               // false para 587 (STARTTLS)
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false         // Permite negociación TLS moderna
  }
});
```

### Función: sendWorkerPin

**Parámetros:**
- `email`: Correo del trabajador
- `nombre`: Nombre del trabajador
- `pin`: PIN de 6 dígitos
- `esNuevoPin`: Boolean (si es regeneración o alta nueva)

**Asunto del Correo:**
- Nuevo PIN: "🔄 Tu nuevo PIN de seguridad - Fichaje CTI"
- Alta nueva: "🎉 Bienvenido - Tu PIN de acceso a Fichaje CTI"

**Contenido HTML:**

```html
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <div style="text-align: center;">
    <img src="cid:logo_fichaje" alt="Fichaje CTI">
  </div>
  
  <h2 style="color: #00bcd4;">Fichaje CTI</h2>
  <p>👤 ¡Bienvenido a la plataforma, {nombre}!</p>
  <p>🔑 Tu PIN de acceso es:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <span style="font-size: 32px; font-weight: bold;">
      {PIN}
    </span>
  </div>
  
  <p style="color: #666;">
    ⚠️ Por seguridad, no compartas este PIN con nadie.
  </p>
</div>
```

### Adjunto del Logo

El correo incluye el logo de la empresa como adjunto incrustado (CID):

```typescript
attachments: [
  {
    filename: 'logo.png',
    path: path.join(__dirname, 'assets', 'logo.jpg'),
    cid: 'logo_fichaje'  // Referencia en HTML: src="cid:logo_fichaje"
  }
]
```

### Proveedor de Correo

El proyecto utiliza **Brevo** (antes Sendinblue) como proveedor SMTP:

- **Panel de Logs**: https://app.brevo.com/transactional/email/logs
- **Ventajas**: API gratuita hasta 300 emails/día, dashboard de tracking
- **Configuración**: SMTP en puerto 587 con STARTTLS

### Manejo de Errores

```typescript
try {
  await this.transporter.sendMail({...});
  this.logger.log(`📧 Correo con PIN enviado con éxito a ${email}`);
} catch (error) {
  this.logger.error(`Error al enviar correo: ${error.message}`);
  throw new InternalServerErrorException('No se pudo enviar el correo con el PIN.');
}
```

---

## 🌱 Seed de Inicialización

### Propósito del Seed

El módulo **Seed** permite inicializar el sistema con datos base, creando el usuario SuperAdmin necesario para empezar a gestionar empresas.

### Servicio: SeedsService

#### Método Principal: runSeed

```typescript
async runSeed(secretKey: string) {
  this.validateSecretKey(secretKey);
  await this.createSuperAdmin();
  return { ok: true, message: 'Sistema inicializado (SuperAdmin).' };
}
```

#### Validación de Seguridad

```typescript
private validateSecretKey(key: string) {
  const masterKey = this.configService.get('SEED_SECRET_KEY');
  if (!key || key !== masterKey) {
    throw new UnauthorizedException('Clave incorrecta');
  }
}
```

**Requiere**: Header `x-seed-key` con el valor de `SEED_SECRET_KEY` del .env

### Creación del SuperAdmin

```typescript
private async createSuperAdmin() {
  const superAdminEmail = 'superadmin@cti.com';
  let superAdmin = await this.userRepository.findOneBy({ 
    email: superAdminEmail 
  });

  if (!superAdmin) {
    const superAdminData = { 
      email: superAdminEmail,
      dni: '00000000S',
      telefono: '+34600999999',
      nombre: 'Super Usuario Global',
      password: await bcrypt.hash('superpassword123M', 10),
      rol: UserRole.SUPERADMIN,
      empresa: null,  // SUPERADMIN no pertenece a ninguna empresa
      isVerified: true,
      isActive: true,
    };
    
    await this.userRepository.save(superAdminData);
    this.logger.log('Superadmin creado con éxito.');
  }
}
```

### Método Adicional: createBulkWorkers

Genera una carga masiva de trabajadores para pruebas:

```typescript
async createBulkWorkers(empresaId: number, cantidad: number = 100) {
  // Limpieza de usuarios demo anteriores
  await this.userRepository.delete({ email: Like('%@cti-demo.com') });
  
  const passwordHashed = await bcrypt.hash('worker123', 10);
  
  for (let i = 1; i <= cantidad; i++) {
    // Crear Usuario (Auth)
    const newUser = await this.userRepository.save({
      email: `u${uniqueNum}@cti-demo.com`,
      dni: uniqueNum,
      nombre: 'Worker',
      password: passwordHashed,
      rol: UserRole.WORKER,
      empresaId: empresaId,
      isActive: true,
      isVerified: true,
    });

    // Crear Perfil Worker con el MISMO ID
    await this.workerRepository.save({
      id: newUser.id,
      ...newUser,
      poblacion: 'Madrid',
      provincia: 'Madrid',
      pais: 'España'
    });
  }
}
```

### Endpoint del Seed

```
POST /api/seeds/run
Headers: x-seed-key: 123
Response: { ok: true, message: 'Sistema inicializado (SuperAdmin).' }
```

### Flujo de Inicialización

```
1. Ejecutar seed con clave maestra
2. Crear SuperAdmin (superadmin@cti.com)
3. Login como SuperAdmin
4. Crear primera empresa
5. Crear Admin de la empresa
6. Login como Admin
7. Crear horarios
8. Dar de alta trabajadores
9. Asignar horarios a trabajadores
10. Operativa normal
```

---

## 📚 Módulos del Sistema

### 1. Auth (Autenticación)

**Funcionalidad**: Sistema de autenticación y autorización JWT

**Características**:
- Login con email/DNI y password
- Generación de tokens JWT (access + refresh)
- Refresh token para renovación automática
- 3 roles: SUPERADMIN, ADMIN, WORKER
- Guards: JwtAuthGuard, RolesGuard
- Decoradores: @GetUser(), @Roles()

**Endpoints**:
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cierre de sesión
- `GET /api/auth/me` - Información del usuario autenticado
- `POST /api/auth/refresh` - Renovar token

**Utilidad**: Base de seguridad del sistema, controla quién puede acceder y qué puede hacer.

---

### 2. Users (Usuarios)

**Funcionalidad**: Gestión de usuarios del sistema

**Características**:
- CRUD completo de usuarios
- Validación de email, DNI, teléfono (únicos)
- Encriptación de passwords con bcrypt
- Soft delete (borrado lógico)
- Filtrado por empresa (multi-tenancy)

**Endpoints**:
- `POST /api/users/crear-user` - Crear usuario
- `GET /api/users/list-users` - Listar usuarios
- `GET /api/users/find/:id` - Buscar usuario
- `PUT /api/users/update/:id` - Actualizar usuario
- `DELETE /api/users/delete/:id` - Eliminar usuario

**Utilidad**: Gestión centralizada de todos los usuarios del sistema.

---

### 3. Company (Empresas)

**Funcionalidad**: Gestión multi-tenant de empresas

**Características**:
- Creación de empresas con geolocalización
- Configuración de radio permitido para fichajes
- Configuración de días de archivo (solicitudes, incidencias)
- Password maestra por empresa (configPassword)
- Planes: trial, premium, expired

**Endpoints**:
- `POST /api/empresa/crear-empresa` - Crear empresa + Admin
- `GET /api/empresa/list-empresas` - Listar empresas
- `GET /api/empresa/find/:id` - Detalle de empresa
- `PUT /api/empresa/update/:id` - Actualizar empresa
- `DELETE /api/empresa/delete/:id` - Eliminar empresa
- `PUT /api/empresa/settings/archive` - Configurar archivo

**Utilidad**: Núcleo del multi-tenancy, aísla datos por empresa.

---

### 4. Worker (Trabajadores)

**Funcionalidad**: Perfil laboral detallado de trabajadores

**Características**:
- Información personal y laboral
- Asignación de horarios
- Asignación de actividades/puestos
- Reasignación masiva de horarios
- Sincronización con tabla users

**Endpoints**:
- `POST /api/worker/crear-worker` - Crear trabajador
- `GET /api/worker/list-workers` - Listar trabajadores
- `GET /api/worker/find/:id` - Ficha de trabajador
- `PUT /api/worker/update/:id` - Actualizar trabajador
- `DELETE /api/worker/delete/:id` - Eliminar trabajador
- `PUT /api/worker/assign-schedule/:id` - Asignar horario
- `POST /api/worker/reasignar-masivo` - Reasignación masiva

**Utilidad**: Gestión del perfil laboral de los trabajadores.

---

### 5. Workday (Jornadas)

**Funcionalidad**: Registro de jornadas laborales y fichaje

**Características**:
- Check-in con geolocalización
- Check-out con cálculo de tiempo trabajado
- Validación de radio permitido (geofencing)
- Detección de retrasos
- Historial de jornadas
- Dashboard en tiempo real

**Endpoints**:
- `POST /api/jornada/check-in` - Iniciar jornada
- `PUT /api/jornada/check-out` - Finalizar jornada
- `GET /api/jornada/status` - Estado de jornada activa
- `GET /api/jornada/historial` - Historial personal
- `GET /api/jornada/rango` - Filtrar por fechas
- `GET /api/jornada/dashboard/resumen` - Dashboard empresa
- `GET /api/jornada/dashboard/stats` - Estadísticas trabajador

**Utilidad**: Core del sistema de fichaje, registro de presencia.

---

### 6. Schedule (Horarios)

**Funcionalidad**: Gestión de horarios y turnos

**Características**:
- Horarios fijos y rotativos
- Ciclos de rotación configurables
- Distribución por día de la semana
- Franjas horarias anidadas
- Cálculo de horas objetivo vs real
- Simulación de rotación

**Endpoints**:
- `POST /api/schedule/crear-schedule` - Crear horario
- `GET /api/schedule/list-schedules` - Listar horarios
- `GET /api/schedule/find/:id` - Detalle de horario
- `DELETE /api/schedule/delete/:id` - Eliminar horario
- `PUT /api/schedule/editar/:id` - Actualizar horario
- `GET /api/schedule/stats/objetivo` - Horas objetivo
- `GET /api/schedule/stats/real` - Horas trabajadas
- `GET /api/schedule/stats/progreso` - % cumplimiento
- `GET /api/schedule/test-rotacion` - Simular rotación
- `GET /api/schedule/turno-hoy` - Turno de hoy

**Utilidad**: Planificación de turnos, base para cálculo de horas.

---

### 7. TimeSlot (Franjas Horarias)

**Funcionalidad**: Gestión de franjas horarias

**Características**:
- Creación de franjas horarias
- Validación de solapamientos
- Vinculación a horarios
- Auditoría de cambios

**Endpoints**:
- `POST /api/franja-horaria/crear` - Crear franja
- `GET /api/franja-horaria/list-franja-horaria` - Listar franjas
- `GET /api/franja-horaria/find/:id` - Buscar franja
- `PUT /api/franja-horaria/update/:id` - Actualizar franja
- `DELETE /api/franja-horaria/delete/:id` - Eliminar franja
- `GET /api/franja-horaria/by-schedule/:id` - Franjas de horario

**Utilidad**: Componentes básicos de los horarios.

---

### 8. Attendance (Asistencia)

**Funcionalidad**: Registro simple de asistencia

**Características**:
- Registro de entrada/salida simple
- Motivo de ausencia
- Historial personal y global
- Filtrado por trabajador

**Endpoints**:
- `POST /api/asistencia/crear-asistencia` - Registrar asistencia
- `GET /api/asistencia/my-history` - Historial personal
- `GET /api/asistencia/empresa` - Historial global
- `GET /api/asistencia/user/:id` - Historial trabajador
- `GET /api/asistencia/list/:id` - Fichajes trabajador

**Utilidad**: Registro manual de asistencia complementario al fichaje.

---

### 9. Absence (Ausencias)

**Funcionalidad**: Gestión de ausencias y vacaciones

**Características**:
- Tipos: VACACIONES, ENFERMEDAD, PERSONAL
- Estados: PENDIENTE, APROBADA, RECHAZADA
- Balance de días disponibles (22 por ley)
- Validación anti-solapamiento
- Cálculo de festivos con date-holidays

**Endpoints**:
- `POST /api/absences` - Solicitar ausencia
- `GET /api/absences/my-absences` - Mis ausencias
- `GET /api/absences/pending` - Pendientes (Admin)
- `GET /api/leaves/range` - Crear rango de vacaciones
- `GET /api/leaves/my-leaves` - Mis permisos
- `GET /api/leaves/user/:id` - Permisos trabajador

**Utilidad**: Gestión de vacaciones y permisos.

---

### 10. Request (Solicitudes)

**Funcionalidad**: Sistema de solicitudes con workflow

**Características**:
- Tipos de solicitudes (permisos, cambios)
- Workflow: Worker solicita → Admin revisa
- Estados: PENDIENTE, APROBADA, RECHAZADA
- Revisiones con notas
- Historial completo
- Archivo automático por antigüedad

**Endpoints**:
- `POST /api/request/crear-request` - Crear solicitud
- `PUT /api/request/check/:id` - Aprobar/rechazar
- `GET /api/request/company-request` - Solicitudes empresa
- `GET /api/request/find/:id` - Detalle solicitud
- `PATCH /api/request/edit-request/:id` - Modificar pendiente
- `GET /api/request/historial` - Historial por estado
- `GET /api/request/my-request` - Mis solicitudes
- `GET /api/request/user/:userId` - Solicitudes trabajador

**Utilidad**: Workflow de aprobación para cambios y permisos.

---

### 11. Issue (Incidencias)

**Funcionalidad**: Gestión de incidencias

**Características**:
- Reporte de incidencias
- Asignación a trabajadores
- Resolución con notas
- Archivo automático (configurable por empresa)
- Limpieza con cron job

**Endpoints**:
- `POST /api/issues` - Crear incidencia
- `GET /api/issues` - Listar incidencias
- `PUT /api/issues/:id` - Actualizar incidencia
- `DELETE /api/issues/:id` - Eliminar incidencia

**Utilidad**: Gestión de problemas y excepciones.

---

### 12. Alarms (Alarmas)

**Funcionalidad**: Sistema de alertas en tiempo real

**Características**:
- Tipos: UNAUTHORIZED_ZONE, LATE_CHECKIN, etc.
- WebSocket para notificaciones en tiempo real
- Anti-spam (prevención de duplicados)
- Estados: pendiente, revisada, resuelta
- Notas de gestión

**Endpoints**:
- `GET /api/alarmas/pendientes` - Alarmas pendientes
- `PUT /api/alarmas/revisar/:id` - Marcar como leída
- `PUT /api/alarmas/resolver/:id` - Resolver con nota
- `GET /api/alarmas/user/:userId` - Alarmas trabajador

**Utilidad**: Alertas automáticas para supervisión.

---

### 13. Activity (Actividades)

**Funcionalidad**: Catálogo de puestos de trabajo

**Características**:
- Creación de puestos (ej: Ingeniero, Operario)
- Asignación a trabajadores
- Listado de puestos activos
- Conteo de trabajadores por puesto

**Endpoints**:
- `POST /api/actividades/crear` - Crear puesto
- `PUT /api/actividades/editar/:id` - Modificar puesto
- `DELETE /api/actividades/delete/:id` - Eliminar puesto
- `GET /api/actividades/catalogo` - Catálogo de puestos
- `GET /api/actividades/:id` - Detalle de puesto
- `GET /api/actividades/user/:id` - Conteo trabajadores
- `GET /api/actividades/list/:id` - Trabajadores asignados

**Utilidad**: Clasificación de trabajadores por puesto.

---

### 14. Site (Obras/Sitios)

**Funcionalidad**: Gestión de obras o ubicaciones de trabajo

**Características**:
- Creación de obras con geolocalización
- Asignación a empresas
- Gestión de trabajadores en obra

**Endpoints**:
- `POST /api/sites` - Crear obra
- `GET /api/sites` - Listar obras
- `GET /api/sites/:id` - Detalle de obra
- `PUT /api/sites/:id` - Actualizar obra
- `DELETE /api/sites/:id` - Eliminar obra

**Utilidad**: Gestión de múltiples ubicaciones de trabajo.

---

### 15. SiteLog (Fichajes en Obras)

**Funcionalidad**: Fichaje específico para obras

**Características**:
- Check-in/out en obras
- Validación GPS de la obra
- Pausas (breaks)
- Historial de fichajes
- Reporte de horas para nómina

**Endpoints**:
- `POST /api/site-logs/check-in` - Entrada en obra
- `PUT /api/site-logs/check-out/:id` - Salida de obra
- `POST /api/site-logs/start-break/:id` - Iniciar pausa
- `POST /api/site-logs/end-break/:id` - Finalizar pausa
- `GET /api/site-logs/my-history` - Mi historial
- `GET /api/site-logs/active/:siteId` - Trabajadores activos
- `PUT /api/site-logs/admin-update/:id` - Corrección admin
- `GET /api/site-logs/report/:userId` - Reporte horas

**Utilidad**: Fichaje geolocalizado en obras específicas.

---

### 16. IssueSite (Incidencias en Obras)

**Funcionalidad**: Incidencias específicas de obras

**Características**:
- Reporte de problemas en obra
- Asignación a operarios
- Gestión de tareas asignadas
- Resolución con notas

**Endpoints**:
- `POST /api/site-issues` - Crear incidencia obra
- `GET /api/site-issues/site/:siteId` - Incidencias obra
- `PUT /api/site-issues/assign/:id` - Asignar operario
- `GET /api/site-issues/my-tasks` - Mis tareas
- `PUT /api/site-issues/resolve/:id` - Resolver incidencia

**Utilidad**: Gestión de problemas en obras específicas.

---

### 17. Mail (Correo)

**Funcionalidad**: Servicio de envío de correos

**Características**:
- Envío de PIN a trabajadores
- Plantillas HTML personalizadas
- Adjuntos (logo)
- Integración con SMTP (Brevo)
- Manejo de errores

**Endpoints**:
- `POST /api/mail/send-pin` - Enviar PIN
- `GET /api/mail` - Listar correos
- `POST /api/mail` - Crear correo
- `PUT /api/mail/:id` - Actualizar correo
- `DELETE /api/mail/:id` - Eliminar correo

**Utilidad**: Comunicación con trabajadores (PIN, notificaciones).

---

### 18. Seed (Inicialización)

**Funcionalidad**: Inicialización del sistema

**Características**:
- Creación de SuperAdmin
- Generación masiva de trabajadores demo
- Limpieza de usuarios demo
- Validación con clave maestra

**Endpoints**:
- `POST /api/seeds/run` - Ejecutar seed
- `POST /api/seeds/bulk-workers` - Generar trabajadores masivos
- `DELETE /api/seeds/clear-demo` - Limpiar demo

**Utilidad**: Punto de partida del sistema, datos iniciales.

---

### 19. WorkerAuth (Autenticación PIN)

**Funcionalidad**: Login rápido con PIN

**Características**:
- Login con PIN de 6 dígitos
- Rate limiting (5 intentos)
- Generación de PIN con hash HMAC-SHA256
- Regeneración de PIN
- Envío de PIN por correo

**Endpoints**:
- `POST /api/worker-auth/company-config-login` - Login config
- `POST /api/worker-auth/activate-pin` - Activar PIN
- `POST /api/worker-auth/login-pin` - Login con PIN
- `PUT /api/worker-auth/regenerate-pin` - Regenerar PIN

**Utilidad**: Acceso rápido para trabajadores en tablets.

---

### 20. Common (Utilidades)

**Funcionalidad**: Utilidades compartidas

**Características**:
- Decoradores personalizados
- Guards personalizados
- DTOs base
- Interfaces comunes
- Constantes globales

**Utilidad**: Reutilización de código en toda la aplicación.

---

## 🔄 Flujo Completo de la Aplicación

### Fase 1: Inicialización del Sistema

```
1. Ejecutar script deploy.ps1 (levanta infraestructura)
2. Ejecutar seed: POST /api/seeds/run (con x-seed-key)
3. Se crea SuperAdmin: superadmin@cti.com
```

### Fase 2: Configuración de Empresa

```
1. Login SuperAdmin: POST /api/auth/login
2. Crear empresa: POST /api/empresa/crear-empresa
   - Nombre, CIF, geolocalización
   - Se crea automáticamente el Admin de la empresa
3. Login Admin de la empresa
```

### Fase 3: Planificación

```
1. Crear horarios: POST /api/schedule/crear-schedule
   - Definir turnos, ciclos de rotación
   - Añadir distribuciones por día
   - Añadir franjas horarias
2. Crear actividades/puestos: POST /api/actividades/crear
```

### Fase 4: Gestión de Personal

```
1. Dar de alta trabajadores: POST /api/worker/crear-worker
   - Datos personales, DNI, email, teléfono
   - Se crea usuario en tabla users y perfil en workers
2. Asignar horario: PUT /api/worker/assign-schedule/:id
3. Asignar actividad: PUT /api/worker/update/:id
4. Generar PIN: POST /api/worker-auth/regenerate-pin
   - Se envía por correo automáticamente
```

### Fase 5: Operativa Diaria (Trabajador)

```
Opción A: Login con PIN (Tablet)
1. POST /api/worker-auth/login-pin
2. POST /api/jornada/check-in
   - Validación GPS
   - Detección de retraso
   - Creación de alarma si fuera de zona
3. POST /api/jornada/check-out
   - Cálculo de minutos trabajados
   - Validación de salida anticipada

Opción B: Login con Email (Web/Móvil)
1. POST /api/auth/login (email + password)
2. POST /api/jornada/check-in
3. POST /api/jornada/check-out
```

### Fase 6: Gestión de Solicitudes

```
1. Trabajador crea solicitud: POST /api/request/crear-request
   - Permiso, cambio de horario, etc.
2. Admin recibe notificación (WebSocket)
3. Admin revisa: PUT /api/request/check/:id
   - Aprobar o rechazar
   - Añadir nota de revisión
4. Trabajador recibe notificación del resultado
```

### Fase 7: Gestión de Ausencias

```
1. Trabajador solicita ausencia: POST /api/absences
   - Tipo: VACACIONES, ENFERMEDAD, PERSONAL
   - Fechas
2. Sistema valida:
   - Días disponibles (balance)
   - Solapamiento con otras ausencias
   - Festivos
3. Admin aprueba/rechaza
4. Sistema actualiza balance
```

### Fase 8: Supervisión y Alarmas

```
1. Sistema genera alarmas automáticamente:
   - Fichaje fuera de zona (UNAUTHORIZED_ZONE)
   - Retraso en check-in (LATE_CHECKIN)
   - Salida anticipada (EARLY_CHECKOUT)
2. Admin ve alarmas pendientes: GET /api/alarmas/pendientes
3. Admin revisa: PUT /api/alarmas/revisar/:id
4. Admin resuelve: PUT /api/alarmas/resolver/:id
   - Añade nota de gestión
```

### Fase 9: Reportes y Estadísticas

```
1. Admin consulta dashboard: GET /api/jornada/dashboard/resumen
   - Trabajadores presentes hoy
   - Retrasos
   - Ausencias
2. Admin consulta estadísticas: GET /api/jornada/dashboard/stats
   - Horas trabajadas
   - % cumplimiento horario
3. Trabajador consulta su progreso: GET /api/schedule/stats/progreso
```

### Fase 10: Mantenimiento Automático

```
Cron jobs (ejecución diaria a medianoche):
1. Archivar solicitudes antiguas (configurable por empresa)
2. Archivar incidencias antiguas (configurable por empresa)
3. Limpieza de alarmas resueltas
```

---

## 📖 Guía de Despliegue

### Despliegue Local (Desarrollo)

#### Requisitos Previos

- Docker Desktop instalado
- PowerShell con permisos de administrador
- Git (para clonar el repositorio)

#### Pasos de Despliegue

**1. Clonar Repositorio**

```bash
git clone [url-del-repo]
cd Fichaje_Cti
yarn install
```

**2. Ejecutar Script Automático**

```bash
# En PowerShell como administrador
bash .\deploy.ps1
```

El script ejecuta automáticamente:
- Limpieza de contenedores antiguos
- Creación de redes Docker
- Liberación de puerto 80
- Levantamiento de BBDD y pgAdmin
- Levantamiento de Backend (prod + test)
- Levantamiento de Proxy Nginx

**3. Verificar Estado**

```bash
docker ps
```

Deberías ver 6 contenedores:
- postgres_bbdd
- postgres_bbdd_test
- pgadmin_bbdd
- fichaje_backend
- fichaje_backend_test
- nginx_proxy

**4. Inicializar Sistema**

```bash
# Ejecutar seed
curl -X POST http://localhost:3000/api/seeds/run \
  -H "x-seed-key: 123"
```

**5. Acceder a Servicios**

- **API Producción**: http://localhost:3000/api
- **API Test**: http://localhost:3000/api (en red test)
- **pgAdmin**: http://localhost:5050
- **Frontend (vía Nginx)**: http://localhost

---

### Despliegue en Producción (VPS)

#### Requisitos Previos

- VPS con Docker instalado
- Acceso SSH al servidor
- Cuenta en Docker Hub
- Dominios configurados (fichaday.cticontrol.com, fichadaytest.cticontrol.com)

#### Pasos de Despliegue

**1. Preparación Local (Build de Imágenes)**

```bash
# Login en Docker Hub
docker login

# Construir imagen Backend
cd backend
docker build -t javierm735/fichaday-backend:latest .
docker push javierm735/fichaday-backend:latest

# Construir imagen BBDD (si es personalizada)
cd BBDD
docker build -t javierm735/postgres_bbdd_0.10:latest .
docker push javierm735/postgres_bbdd_0.10:latest

# Construir imagen Nginx
cd infra/proxy
docker build -t javierm735/nginx_proxy-0.03:latest .
docker push javierm735/nginx_proxy-0.03:latest
```

**2. Preparación del Servidor**

```bash
# Conectar por SSH al VPS
ssh usuario@tu-vps-ip

# Crear redes Docker
docker network create red_fichaje
docker network create test_network

# Crear volúmenes
docker volume create postgres_data_bbdd
docker volume create postgres_data_test
```

**3. Levantar Base de Datos**

```bash
# Base de Datos Producción
docker run -d \
  --name postgres_bbdd \
  --network red_fichaje \
  --restart always \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=Jp10.Mnl \
  -e POSTGRES_DB=fichaje_cti \
  -v postgres_data_bbdd:/var/lib/postgresql/data \
  -p 5432:5432 \
  javierm735/postgres_bbdd_0.10:latest

# Base de Datos Test
docker run -d \
  --name postgres_bbdd_test \
  --network test_network \
  --restart always \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=Jp10.Mnl \
  -e POSTGRES_DB=fichaje_cti \
  -v postgres_data_test:/var/lib/postgresql/data \
  -p 5433:5432 \
  javierm735/postgres_bbdd_0.10:latest
```

**4. Levantar Backend**

###  Con el archivo env en la carpeta env


```bash
# Backend Producción
docker run -d \
  --name fichaday_backend \
  --network red_fichaje \
  --restart always \
   -e DB_HOST=postgres_bbdd \
  -e TYPEORM_SYNCHRONIZE=true \
  --env-file env/.env \
  javierm735/fichaday-backend-0.32:latest

# Backend Test
docker run -d \
  --name fichaday_backend_test \
  --network test_network \
  --restart always \
  -e DB_HOST=postgres_bbdd_test \
  -e TYPEORM_SYNCHRONIZE=true \
  --env-file env/.env \
  javierm735/fichaday-backend-0.30:latest
```

**5. Levantar Nginx Proxy**

```bash
# Descargar imagen
docker pull javierm735/nginx_proxy-0.03:latest

# Levantar proxy
docker run -d \
  --name nginx_proxy \
  --network red_fichaje \
  --restart always \
  -p 80:80 \
  -p 443:443 \
  javierm735/nginx_proxy-0.03:latest

-----------------

  docker run -d \
  --name nginx_proxy \
  --network red_fichaje \
  --restart always \
  -p 80:80 \
  -p 443:443 \
  nginx:1.25-alpine /bin/sh -c "echo 'events { worker_connections 1024; }
http {
    # PRODUCCIÓN
    server {
        listen 80;
        server_name fichaday.cticontrol.com;
        location /api/ {
            proxy_pass http://fichaday_backend:3000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        location / {
            proxy_pass http://fichaje-frontend:3000;
        }
    }
    # TEST
    server {
        listen 80;
        server_name fichadaytest.cticontrol.com;
        location / {
            proxy_pass http://fichaday_backend_test:3000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
    }
}' > /etc/nginx/nginx.conf && nginx -g \"daemon off;\""

# Conectar a red de test
docker network connect test_network nginx_proxy

# Reiniciar proxy
docker restart nginx_proxy
```

**6. Conectar Frontend (si existe)**

```bash
# Conectar frontend de producción
docker network connect red_fichaje fichaje-frontend-prod

# Conectar frontend de test
docker network connect test_network fichaje-frontend-test
```

**7. Verificar Despliegue**

```bash
# Ver contenedores
docker ps

# Ver logs de backend
docker logs fichaday_backend

# Ver logs de nginx
docker logs nginx_proxy
```

**8. Inicializar Sistema**

```bash
# Ejecutar seed (desde el VPS o local)
curl -X POST http://fichaday.cticontrol.com/api/seeds/run \
  -H "x-seed-key: 123"
```

---

### Comandos Útiles de Mantenimiento

```bash
# Ver logs en tiempo real
docker logs -f fichaday_backend

# Reiniciar un servicio
docker restart fichaday_backend

# Entrar en un contenedor
docker exec -it fichaday_backend sh

# Ver redes
docker network ls

# Ver volúmenes
docker volume ls

# Limpiar contenedores parados
docker container prune

# Limpiar imágenes no usadas
docker image prune -a

# Backup de base de datos
docker exec postgres_bbdd pg_dump -U postgres fichaje_cti > backup.sql

# Restore de base de datos
cat backup.sql | docker exec -i postgres_bbdd psql -U postgres fichaje_cti
```

---

## 📊 Resumen de Comandos del README

### Instalación Local

```bash
# Clonar y entrar
git clone [url-del-repo]
cd Fichaje_Cti
yarn install

# Ejecutar script de despliegue
bash .\deploy.ps1
```

### Levantar Infraestructura Manualmente

```bash
# Crear redes
docker network create red_fichaje
docker network create test_network

# Levantar BBDD
cd BBDD
docker compose --env-file .env up -d

# Levantar Backend
cd ../backend
docker compose --env-file .env up -d --build

# Levantar Proxy
cd ../infra/proxy
docker compose up -d
```

### Despliegue Producción (VPS)

```bash
# Crear redes y volúmenes
docker network create red_fichaje
docker network create test_network
docker volume create postgres_data_bbdd
docker volume create postgres_data_test

# Levantar BBDD Producción
docker run -d \
  --name postgres_bbdd \
  --network red_fichaje \
  --restart always \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=Jp10.Mnl \
  -e POSTGRES_DB=fichaje_cti \
  -v postgres_data_bbdd:/var/lib/postgresql/data \
  -p 5432:5432 \
  javierm735/postgres_bbdd_0.10:latest

# Levantar BBDD Test
docker run -d \
  --name postgres_bbdd_test \
  --network test_network \
  --restart always \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=Jp10.Mnl \
  -e POSTGRES_DB=fichaje_cti \
  -v postgres_data_test:/var/lib/postgresql/data \
  -p 5433:5432 \
  javierm735/postgres_bbdd_0.10:latest

# Levantar Backend Producción
docker run -d \
  --name fichaday_backend \
  --network red_fichaje \
  --restart always \
  -e DB_HOST=postgres_bbdd \
  -e TYPEORM_SYNCHRONIZE=true \
  --env-file env/.env \
  javierm735/fichaday-backend-0.32:latest

# Levantar Backend Test
docker run -d \
  --name fichaday_backend_test \
  --network test_network \
  --restart always \
  -e DB_HOST=postgres_bbdd_test \
  -e TYPEORM_SYNCHRONIZE=true \
  --env-file env/.env \
  javierm735/fichaday-backend-0.30:latest

# Levantar Nginx Proxy
docker run -d \
  --name nginx_proxy \
  --network red_fichaje \
  --restart always \
  -p 80:80 \
  -p 443:443 \
  javierm735/nginx_proxy-0.03:latest

# Conectar proxy a red de test
docker network connect test_network nginx_proxy
docker restart nginx_proxy
```

---

## 🎯 Conclusión

Este documento proporciona una visión completa y técnica del sistema Fichaje CTI, cubriendo todos los aspectos necesarios para entender, desplegar y mantener la aplicación.

**Puntos Clave:**

- **Arquitectura Enterprise**: NestJS + TypeORM + PostgreSQL
- **Multi-tenancy**: Aislamiento completo por empresa
- **Seguridad**: JWT + Roles + PIN con hash HMAC-SHA256
- **Geolocalización**: Validación GPS para fichajes
- **Docker**: Contenedores para consistencia y escalabilidad
- **Nginx**: Reverse proxy para enrutamiento y seguridad
- **Automatización**: Script de despliegue y cron jobs
- **Documentación**: Colección Postman para pruebas

El sistema está listo para producción con una arquitectura escalable, segura y mantenible.

---

**Documento generado el:** 27 de Mayo de 2026  
**Versión del sistema:** v0.7  
**Autor:** Sistema de Documentación Automática

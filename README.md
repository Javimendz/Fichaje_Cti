<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>


# FICHAJE-CTI

1. Clonar proyecto
2. ``` yarn install ```
3. Clonar el archivo ``` .env.template ``` y renombrarlo a ``` .env ```
4. Cambiar las variables de entorno
5. Instalar cors ``` yarn add cors ```
6. Instalar cookie  ``` yarn add cookie-parser yar add @types/cookie-parser ```
6. Instalar ``` yarn add class-transformer class-validator ```
7. Levantar la base de datos.

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

Patch - http://localhost:3000/api/solicitudes/AQUI-PONER-ID-SOLICITUD/revisar

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
EMPRESA
🛠️ Método	📍 Endpoint	                            📝 Descripción	                                   📦 Requerimientos / Body
POST        /api/empresa/crear-empresa            Setup Inicial: Crea empresa + Admin principal.
GET         /api/empresa/list-empresas            Obtiene listado de todas las empresas.
GET         /api/empresa/find/:id                 Obtiene detalles de una empresa específica.
PUT         /api/empresa/update/:id               Actualiza datos de una empresa.
DELETE      /api/empresa/delete/:id               Elimina una empresa del sistema.

```

```
USERS
🛠️ Método	📍 Endpoint	                            📝 Descripción	                                   📦 Requerimientos / Body
POST        /api/users/crear-user               Crea usuario, rol Super y Admin
GET         /api/users/list-users               Obtiene listado de todos los users.
GET         /api/users/find/:id                 Obtiene detalles de un user específico.
PUT         /api/users/update/:id               Actualiza datos de un user.
DELETE      /api/users/delete/:id               Elimina una empresa del sistema.

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
REQUEST
🛠️ Método	📍 Endpoint	                           📝 Descripción	                                     📦 Requerimientos / Body
POST        /api/request/crear-request         El trabajador crea una nueva solicitud.
GET         /api/request/my-request            El trabajador y Admin ve el estado de sus pedidos.
GET         /api/request/company-request       El Admin ve todas las solicitudes pendientes.
PUT         /api/request/check/:id             El Admin aprueba o rechaza una solicitud.

```

```
SCHEDULE
🛠️ Método	📍 Endpoint	                           📝 Descripción	                                      📦 Requerimientos / Body
POST    /api/schedule/crear-schedule  Crea un nuevo horario Fijo o Rotativo.
GET     /api/schedule/list-schedules  Lista todos los horarios de la empresa del admin. Token Admin
GET     /api/schedule/find/:id       Obtiene el detalle de un horario específico. ID en formato NUM
DELETE  /api/schedule/delete/:id     Elimina un horario (si no está asignado).Requiere  rol ADMIN

```


```
TIMESLOT
🛠️ Método	📍 Endpoint	                           📝 Descripción	                                      📦 Requerimientos / Body
POST   /api/franja-horaria/crear-franja-horaria  Crea una franja. "{ inicio, fin, tipo, horarioId }
GET    /api/franja-horaria/list-franja-horaria  Obtiene todas franjas registradas. Requiere Token
GET    /api/franja-horaria/find/:id             Obtiene detalle de una franja específica.  ID  NUM
PUT    /api/franja-horaria/update/:id      Actualiza horas o tipo de una franja. "{ inicio, fin }"
DELETE /api/franja-horaria/delete/:id           Borra una franja horaria.Requiere rol ADMIN

```

```
JORNADA
🛠️ Método	📍 Endpoint	                           📝 Descripción	                                      📦 Requerimientos / Body
POST        /api/jornada/check-in   Registra la entrada del trabajador."{ latitud, longitud }"
PUT         /api/jornada/check-out  Registra la salida y cierra la jornada.No requiere body
GET         /api/jornada/status     Indica si el usuario tiene una jornada abierta. Token       
GET         /api/jornada/historial  Lista todos los fichajes del trabajador.Token               
GET         /api/jornada/rango?desde=2023-01-01&hasta=2023-01-31     Filtra fichajes por rango de fechas.      Query Params: ?inicio=...&fin=...

```
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>


# FICHAJE-CTI

1. Clonar proyecto
2. ``` yarn install ```
3. Clonar el archivo ``` .env.template ``` y renombrarlo a ``` .env ```
4. Cambiar las variables de entorno
5. Instalar cors ``` yarn add cors ```
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
Post

http://localhost:3000/api/seeds/run

```


2. Login 

``` 
http://localhost:3000/api/auth/login

Worker

Post

{
    "dni": "12345678Z", 
    "password": "contraseña123"

}

Admin

Post

{
    "email": "admin@beta.com",
    "password": "BetaPassword2026!"

-------------------------------------

    "email": "contac@beta-transportes.com",
    "password": "adminpassword123",

}


SuperAdmin

Post

{
  "email": "superadmin@cti.com",
  "password": "superpassword"
}


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

6. Registrar empresa y su administrador.

```
POST  -  http://localhost:3000/api/empresas/setup


Body - Json

{
  "nombreEmpresa": "Servicios Logísticos Beta S.L.",
  "cif": "B12345678",
  "direccion": "Avenida de la Innovación, 42",
  "poblacion": "Madrid",
  "provincia": "Madrid",
  "pais": "España",
  "email": "contacto@beta.com",
  "admin": {
    "telefono": "+34655999888",
    "email": "admin@beta.com",
    "password": "BetaPassword2026!"
  }
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


7. Verificar código otp (Actualmente no implementado)

```
localhost:3000/api/auth/verify-otp

Post

{ "telefono": "+Telefono necesario", "codigo": "Codigo generado" }


```

8. Enviar código otp (Actualmente no implementado)
```
localhost:3000/api/auth/send-otp

Post

{

    "telefono": "Telefono Necesario"
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
🛠️ Método	📍 Endpoint	                            📝 Descripción	                                   📦 Requerimientos / Body
POST        /api/seeds/run                         Inicializa el SuperAdmin y datos base.              Header: x-seed-key
POST        /api/auth/login                        Inicio de sesión para todos los roles.              "{ email, password }"
POST        /api/auth/send-otp                     Envía código de verificación al teléfono.           { telefono }
POST        /api/auth/verify-otp                   Valida el código OTP recibido.                      "{ telefono, codigo }"

```

```
🛠️ Método	📍 Endpoint	                            📝 Descripción	                                   📦 Requerimientos / Body
POST        /api/empresas/setup                    Setup Inicial: Crea empresa + Admin principal.
POST        /api/empresas/crear-empresa            Crea una nueva empresa (SuperAdmin).
GET         /api/empresas/get-empresas             Obtiene listado de todas las empresas.
GET         /api/empresas/:id                      Obtiene detalles de una empresa específica.
PATCH       /api/empresas/:id                      Actualiza datos de una empresa.
DELETE      /api/empresas/:id                      Elimina una empresa del sistema.

```

```
🛠️ Método	📍 Endpoint	                           📝 Descripción	                                     📦 Requerimientos / Body
POST        /api/allowed-user                      Registra/Pre-autoriza un nuevo trabajador.
GET         /api/allowed-user                      Lista todos los trabajadores de la empresa.
GET         /api/allowed-user/:id                  Obtiene la ficha de un trabajador.
PATCH       /api/allowed-user/:id                  Actualiza información del trabajador.
DELETE      /api/allowed-user/:id                  Borra un trabajador autorizado.
PATCH       /api/allowed-user/:id/assign-schedule  Asignar Horario: Vincula horario a trabajador.

```

```
🛠️ Método	📍 Endpoint	                           📝 Descripción	                                     📦 Requerimientos / Body
POST        /api/solicitudes                       El trabajador crea una nueva solicitud.
GET         /api/solicitudes/mis-solicitudes       El trabajador ve el estado de sus pedidos.
GET         /api/solicitudes                       El Admin ve todas las solicitudes pendientes.
PATCH       /api/solicitudes/:id/revisar           El Admin aprueba o rechaza una solicitud.

```

```
🛠️ Método	📍 Endpoint	                           📝 Descripción	                                      📦 Requerimientos / Body
POST        /api/schedules                        Crea un nuevo horario (Fijo o Rotativo).               "{ nombre, fechaInicio, fechaFin, tipo, distribuciones: [] }"
GET         /api/schedules                        Lista todos los horarios de la empresa del admin.      Requiere Bearer Token
GET         /api/schedules/:id                    Obtiene el detalle de un horario específico.           ID en formato UUID
DELETE      /api/schedules/:id                    Elimina un horario (si no está asignado).              Requiere rol ADMIN

```


```
🛠️ Método	📍 Endpoint	                           📝 Descripción	                                      📦 Requerimientos / Body
POST        /api/franja-horaria                   Crea una franja (ej. Mañana: 08:00 - 14:00).           "{ inicio, fin, tipo, horarioId }"
GET         /api/franja-horaria                   Obtiene todas las franjas registradas.                 Requiere Bearer Token
GET         /api/franja-horaria/:id               Obtiene detalle de una franja específica.              ID en formato UUID
PATCH       /api/franja-horaria/:id               Actualiza horas o tipo de una franja.                  "{ inicio, fin } (opcional)"
DELETE      /api/franja-horaria/:id               Borra una franja horaria.                              Requiere rol ADMIN

```

```

🛠️ Método	📍 Endpoint	                           📝 Descripción	                                      📦 Requerimientos / Body
POST        /api/jornadas/check-in                Registra la entrada del trabajador.                    "{ latitud, longitud }"
PATCH       /api/jornadas/check-out               Registra la salida y cierra la jornada.                No requiere body
GET         /api/jornadas/status                  Indica si el usuario tiene una jornada abierta.        Requiere Bearer Token
GET         /api/jornadas/historial               Lista todos los fichajes del trabajador.               Requiere Bearer Token
GET         /api/jornadas/rango                   Filtra fichajes por rango de fechas.                   Query Params: ?inicio=...&fin=...

```
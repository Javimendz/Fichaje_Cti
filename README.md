<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>


# Fichaje-Cti

1. Clonar proyecto
2. ``` yarn install ```
3. Clonar el archivo ``` .env.template ``` y renombrarlo a ``` .env ```
4. Cambiar las variables de entorno
5. Instalar cors ``` yarn add cors ```
6. Levantar la base de datos.

```
  docker-compose up -d

```

7. Levantar: ``` yarn start:dev ```


La base de datos se borra cada vez, `EJECUTAR SEED` y `OBTENER TOKEN` de nuevo.

**app.module.ts / dropSchema:** **`true`** — Poner a **`false`** para no borrar la BBDD.



# Endpoints


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
    "password": "contraseña123",

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

6. Registrar empresa y su administrado.

```
POST  -  http://localhost:3000/api/empresas/setup


Body - Json

{
  "nombreEmpresa": "Taller paco Alfa S.A.",
  "admin": {
    "email": "contac@beta-transportes.com",
    "password": "adminpassword123",
    "nombre": "Juanito Administrador",
    "dni": "98765435Y",
    "telefono": "+34611222334"
  }
}


```


6. Dar de alta a Usuario



```

POST  -  http://localhost:3000/api/allowed-user

Body - Json

{
  "telefono": "600123457",
  "nombre": "Juanito",
  "apellidos": "Pérez García",
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

Get - http://localhost:3000/api/empresas

Body - none

```
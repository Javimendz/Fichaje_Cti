<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>


# Fichaje-Cti

1. Clonar proyecto
2. ``` yarn install ```
3. Clonar el archivo ``` .env.template ``` y renombrarlo a ``` .env ```
4. Cambiar las variables de entorno
5. Levantar la base de datos.
```
  docker-compose up -d

```

6. Levantar: ``` yarn start:dev ```


# Endpoints

1. Enviar código otp
```
localhost:3000/api/auth/send-otp

Post

{

    "telefono": "Telefono Necesario"
}

```
2. Verificar código otp

```
localhost:3000/api/auth/verify-otp

Post

{ "telefono": "+Telefono necesario", "codigo": "Codigo generado" }


```

3. Ejecutar Seed
```
Post

http://localhost:3000/api/seeds/run

```

4. Login 

``` 
http://localhost:3000/api/auth/login

Post

{
    "telefono": "Telefono necesario", 
    "password": "admin_password"

}

```


5. Permitir telefonos

```

http://localhost:3000/api/allowed-phones

Post

http://localhost:3000/api/allowed-phones

{
    "telefono": "Telefono necesario"
}

``` 




6. Check-in

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




7. Check-out

```

http://localhost:3000/api/jornadas/check-out

Patch- none


``` 


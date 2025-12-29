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
```
2. Verificar código otp

```
localhost:3000/api/auth/verify-otp
```

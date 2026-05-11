FROM node:lts-alpine
WORKDIR /usr/src/app

# 1. Copiamos los archivos de dependencias
COPY package.json yarn.lock ./

# 2. Como todavía no estamos en "producción", Yarn instalará TODO (incluido NestJS)
RUN yarn install --frozen-lockfile

# 3. Copiamos todo el código fuente
COPY . .

# 4. Compilamos el código. ¡Ahora sí encontrará Nest!
RUN yarn build

# 5. AHORA, una vez compilado, le decimos a Node que pase a modo producción
ENV NODE_ENV=production

EXPOSE 3000

# 6. Ajustamos permisos por seguridad
RUN chown -R node /usr/src/app
USER node

# 7. Ejecutamos el archivo compilado nativo
CMD ["node", "dist/main.js"]
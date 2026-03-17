# 1. Imagen base
FROM node:lts-alpine

# 2. Directorio de trabajo
WORKDIR /usr/src/app

# 3. Copiamos SOLO los archivos de Yarn primero (optimiza la caché)
COPY package.json yarn.lock ./

# 4. Instalamos TODAS las dependencias (necesitamos el CLI de Nest para compilar)
RUN yarn install --frozen-lockfile

# 5. Copiamos todo el código fuente
COPY . .

# 6. Compilamos el proyecto (esto creará la carpeta /dist con el JS puro)
RUN yarn build

# 7. Exponemos el puerto que usa tu app
EXPOSE 3000

# 8. Ajustamos permisos por seguridad (como tenías en tu archivo original)
RUN chown -R node /usr/src/app
USER node

# 9. Ejecutamos el archivo compilado directamente con Node (¡sin usar Nest CLI!)
CMD ["node", "dist/main.js"]
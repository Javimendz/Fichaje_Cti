FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copiamos los archivos de dependencias
COPY package.json yarn.lock ./

# Instalamos TODAS las dependencias (quitamos el --production para que instale Nest/TypeScript)
RUN yarn install --frozen-lockfile

# Copiamos todo el código fuente
COPY . .

# Compilamos el código para que se cree la carpeta "dist"
RUN yarn build

EXPOSE 3001

# Ajustamos permisos
RUN chown -R node /usr/src/app
USER node

# Ejecutamos el archivo compilado
CMD ["node", "dist/main.js"]
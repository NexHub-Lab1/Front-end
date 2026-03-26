# ETAPA 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiamos el resto del código y buildeamos
COPY . .
RUN npm run build

# ETAPA 2: Runtime (Nginx)
FROM nginx:stable-alpine
# Copiamos el resultado del build de Vite a la carpeta de Nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80 (estándar de Nginx)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# AGREGAR ESTO AL DOCKER COMPOSE
#  frontend:
#    build: ./frontend
#    container_name: nexhub-frontend
#    restart: always
#    ports:
#      - "5173:80" # Mapeamos el puerto 80 del container al 5173 de tu máquina
#    depends_on:
#      - backend

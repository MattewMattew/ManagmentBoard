# Stage 1: Build frontend
FROM node:18 as build-stage

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY frontend/package*.json ./
RUN npm install

# Копируем исходники фронтенда
COPY frontend/ ./

# Собираем фронтенд
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
FROM nginx:alpine

# Копируем статику
COPY frontend/dist /usr/share/nginx/html

# Копируем конфиг прокси
COPY nginx.conf /etc/nginx/conf.d/default.conf
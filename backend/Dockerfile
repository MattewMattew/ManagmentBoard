FROM node:18-alpine

WORKDIR /usr/src/app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем остальные файлы
COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
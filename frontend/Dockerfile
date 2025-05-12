# Build Stage
FROM node:20 as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Final Stage
FROM nginx:alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
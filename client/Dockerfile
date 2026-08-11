# Stage 1: build the static React app
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . . 
RUN npm run build

# Stage 2: serve the built files with Nginx
FROM nginx:alpine

# Removes Nginx's default sample page/config, so it doesn't interfere
# with our own.
RUN rm -rf /usr/share/nginx/html/*

# Copies ONLY the built static output from Stage 1 - not any of the
# source code, node_modules, or build tooling. The final image never
# even has Node.js in it at all.

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
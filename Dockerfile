# syntax=docker/dockerfile:1

# ---------- Build ----------
FROM node:24-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts: ingen husky-hooks og ingen vilkårlige postinstall-scripts fra afhængigheder
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ---------- Runtime ----------
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

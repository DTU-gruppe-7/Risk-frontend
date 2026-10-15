# syntax=docker/dockerfile:1

# Base-images er pinnet til digest (uforanderlige). Tagget står med for læsbarhed,
# og så Dependabot kan finde og opdatere dem.

# ---------- Build ----------
FROM node:25-bookworm-slim@sha256:81db02c4b671288a03915da9534dbd54f96d0e7c24d80ccc54f5b36b2e684370 AS build
WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts: ingen husky-hooks og ingen vilkårlige postinstall-scripts fra afhængigheder
# --no-audit/--no-fund: ingen netværkskald og støj, som ikke hører hjemme i et build
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- Runtime ----------
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:782bb89768cc87b7f95c18b95baa1af250e5d451f26794f59363540161147c01 AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Imaget kører allerede som uid 101, men det skrives eksplicit, så det er tydeligt
# ved review og ikke afhænger af base-imagets standard
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
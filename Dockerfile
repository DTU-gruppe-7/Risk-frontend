# syntax=docker/dockerfile:1

# Base-images er pinnet til digest (uforanderlige). Tagget står med for læsbarhed,
# og så Dependabot kan finde og opdatere dem.

# ---------- Build ----------
FROM node:26-bookworm-slim@sha256:5df79989ed685e09f0a98019db4cebfb22fb9df1a53c0161664a011f7ff6b0f1 AS build
WORKDIR /app

COPY package.json package-lock.json ./
# --ignore-scripts: ingen husky-hooks og ingen vilkårlige postinstall-scripts fra afhængigheder
# --no-audit/--no-fund: ingen netværkskald og støj, som ikke hører hjemme i et build
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- Runtime ----------
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS runtime
# Midlertidigt: base-imaget mangler rettelser til brotli-libs (CVE-2026-111497),
# curl/libcurl (CVE-2026-92392) og libxslt (CVE-2026-125350, -87636, -9947), som Trivy
# fejler på. Fjern igen, når Dependabot bumper til et nyere digest.
USER root
RUN apk upgrade --no-cache libxslt brotli-libs curl libcurl
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Imaget kører allerede som uid 101, men det skrives eksplicit, så det er tydeligt
# ved review og ikke afhænger af base-imagets standard
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
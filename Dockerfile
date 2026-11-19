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
# Chainguards nginx-image: kun nginx og dets biblioteker, ingen shell og ingen
# pakkemanager. Det genbygges dagligt med sikkerhedsrettelser, og Dependabot bumper
# digestet. Uden shell er der ingen HEALTHCHECK i imaget; /healthz tjekkes udefra.
FROM cgr.dev/chainguard/nginx:latest@sha256:1d942360cecf98fe7e45c0470b23734b3c62868544380f920d1c1fa9de6e8e27 AS runtime
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Imaget kører allerede som uid 65532 (nonroot), men det skrives eksplicit, så det er
# tydeligt ved review og ikke afhænger af base-imagets standard
USER 65532
EXPOSE 8080
# =============================================================================
# SmartOLT Gateway — Multi-stage Dockerfile
# =============================================================================
# Stage 1 (deps):    instala TODAS las dependencias + genera Prisma client
# Stage 2 (builder): compila TypeScript → dist/
# Stage 3 (runner):  imagen mínima de producción, solo prod deps
# =============================================================================

ARG NODE_VERSION=20
ARG ALPINE_VERSION=3.20

# =============================================================================
# Stage 1: deps — dependencias completas + Prisma client
# =============================================================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS deps

WORKDIR /app

# Dependencias nativas necesarias para Prisma y bcrypt
RUN apk add --no-cache libc6-compat openssl

# Copiar solo los archivos de manifiesto primero (mejor cache de Docker)
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Instalar todas las deps (incl. devDeps necesarias para generar Prisma)
RUN npm ci --frozen-lockfile

# Generar Prisma client
RUN npx prisma generate

# =============================================================================
# Stage 2: builder — compilar TypeScript
# =============================================================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma       ./prisma
COPY . .

RUN npm run build

# Verificar que el build generó el artefacto esperado
RUN test -f dist/app.js || (echo "ERROR: dist/app.js not found after build" && exit 1)

# =============================================================================
# Stage 3: runner — imagen mínima de producción
# =============================================================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runner

# Argumentos de build para OCI labels (pasados desde docker-compose o CI)
ARG BUILD_DATE=unknown
ARG GIT_SHA=unknown
ARG VERSION=1.0.0

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    # Optimizaciones de Node.js para producción
    NODE_OPTIONS="--max-old-space-size=384" \
    # Deshabilita el color ANSI en logs (mejor para JSON logging)
    NO_COLOR=1

# OCI Image Labels
LABEL org.opencontainers.image.title="SmartOLT Gateway" \
      org.opencontainers.image.description="Gateway API para SmartOLT" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.source="https://github.com/istinge/smartolt" \
      org.opencontainers.image.licenses="UNLICENSED"

# Dependencias del sistema:
# - openssl: requerido por Prisma
# - wget:    usado en HEALTHCHECK (más liviano que curl en alpine)
# - dumb-init: PID 1 correcto → manejo de señales + reap de zombies
RUN apk add --no-cache openssl wget dumb-init && \
    # Crear usuario/grupo no-root dedicado
    addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 --ingroup nodejs smartolt && \
    # Crear directorio de logs con los permisos correctos
    mkdir -p /app/logs && chown -R smartolt:nodejs /app

# Copiar solo lo necesario para producción:
# 1. Solo las prod deps (sin devDependencies)
COPY --from=deps    --chown=smartolt:nodejs /app/prisma         ./prisma
COPY --from=builder --chown=smartolt:nodejs /app/dist           ./dist
COPY --from=builder --chown=smartolt:nodejs /app/package.json   ./package.json

# Reinstalar solo prod deps para imagen más pequeña y sin devDeps
RUN npm ci --frozen-lockfile --omit=dev && \
    # Regenerar Prisma client con las prod deps
    npx prisma generate && \
    # Limpiar cache de npm
    npm cache clean --force

# Cambiar al usuario no-root
USER smartolt

EXPOSE 3000

# Health check a nivel de Docker (también configurado en compose)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/live || exit 1

# dumb-init como PID 1: maneja señales SIGTERM/SIGINT correctamente
# y hace reap de procesos zombie
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]

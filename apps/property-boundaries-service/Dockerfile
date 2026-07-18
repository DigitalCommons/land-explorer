# syntax=docker/dockerfile:1

# Multi-stage build for the Property Boundaries Service (Hapi, ESM, TypeScript
# compiled to dist/ with tsc). Modelled on mykomap-monolith/apps/back-end.
# See land-explorer-back-end/docs/containers.md for how to build and run this.
#
# Debian, instead of the other container's more slimline Alpine: the INSPIRE
#   pipeline needs chromium

# Node version must be supplied (e.g. 24). No sane default - fail loudly if unset.
ARG NODE_VERSION=nonesuch

# ---- build stage ----
FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app

# git: build/version metadata.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

# Don't get chromium during npm ci - runtime stage gets it instead
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build
# Dev deps are kept in this stage so a migrate step targeting it has
# sequelize-cli available. The runtime stage prunes them.

# ---- runtime stage ----
FROM node:${NODE_VERSION}-slim
WORKDIR /app
ENV NODE_ENV=production

# INSPIRE pipeline toolchain:
# - gdal-bin: ogr2ogr/ogrinfo - for writing into MySQL
# - default-mysql-client - gml script DELETE step uses mysql
# - rsync + openssh-client - INSPIRE zip backup/restore to storage box
# - (skipped unless REMOTE_BACKUP_DESTINATION_PATH is set)
# - curl - Matrix failure notifications in scripts
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       bash gdal-bin default-mysql-client rsync openssh-client curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules

# Chromium for INSPIRE pipleline, in fixed path for all users
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=build /app/config ./config

# The pipeline's shell scripts, plus the OSTN15 projection grid installed
# where PROJ looks for it (the legacy servers scp'd it to /usr/share/proj)
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/scripts/OSTN15_NTv2_OSGBtoETRS.gsb /usr/share/proj/

# DB migrations run at deploy time (e.g. Coolify's pre-deploy command:
# `npx sequelize-cli db:migrate`, the same command scripts/deploy.sh uses).
# Bring in the migration sources so the CLI can run from the repo root inside
# this image, mirroring the layout deploy.sh expects.
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/seeders ./seeders

# Strip dev deps to slim the image, then add back just the Sequelize CLI (a dev
# dep) which is needed to run migrations at deploy time. Pinned to the major
# version in package.json.
RUN npm prune --omit=dev \
    && npm install --no-save sequelize-cli@6

# The pipeline writes downloads/ logs/ temp.sqlite to the work dir
# Own the dirs and the workdir itself (for temp.sqlite)
RUN mkdir -p downloads logs \
    && chown node:node /app downloads logs

USER node
EXPOSE 4000

# Docker is the process supervisor; run node directly rather than via pm2.
CMD ["node", "--max-old-space-size=4096", "dist/app.js"]

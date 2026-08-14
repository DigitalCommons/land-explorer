# syntax=docker/dockerfile:1

# Multi-stage build for the Property Boundaries Service (Hapi, ESM, TypeScript
# compiled to dist/ with tsc). Builds from the REPO ROOT context - single root
# lockfile, npm workspaces:
#   docker build -f apps/property-boundaries-service/Dockerfile .
# Modelled on mykomap-monolith/apps/back-end.
#
# Debian, instead of the other container's more slimline Alpine: the INSPIRE
#   pipeline needs chromium
#
# Not bundled, so the runtime stage carries the hoisted workspace node_modules
# and preserves the /app/apps/property-boundaries-service layout.

# Node version must be supplied (e.g. 24). No sane default - fail loudly if unset.
ARG NODE_VERSION=nonesuch

# ---- build stage ----
FROM node:${NODE_VERSION}-slim AS build
WORKDIR /app

# git: install git without the optional extras
# first line gets the package index (list of all packages) and
#   last line removes it to keep the image small
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

# Don't get chromium during npm ci - runtime stage gets it instead
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Install deps first (cache-friendly). npm ci needs the root manifests plus
# every workspace's package.json to validate the lockfile; -w installs only
# this workspace's tree.
COPY package.json package-lock.json .npmrc ./
COPY apps/back-end/package.json apps/back-end/
COPY apps/front-end/package.json apps/front-end/
COPY apps/property-boundaries-service/package.json apps/property-boundaries-service/
RUN --mount=type=cache,target=/root/.npm npm ci -w apps/property-boundaries-service

COPY . .
RUN npm run build -w apps/property-boundaries-service

# ---- production deps stage ----
# Fresh install without dev deps. sequelize-cli is a dev dep but needed to run
# migrations at deploy time; pinned to the major version in package.json.
# mkdir guarantees the workspace-local node_modules exists for the COPY below.
FROM build AS proddeps
RUN --mount=type=cache,target=/root/.npm npm ci -w apps/property-boundaries-service --omit=dev \
    && npm install --no-save --omit=dev sequelize-cli@6 \
    && mkdir -p apps/property-boundaries-service/node_modules

# ---- runtime stage ----
FROM node:${NODE_VERSION}-slim
WORKDIR /app
ENV NODE_ENV=production

# INSPIRE pipeline toolchain:
# - gdal-bin: ogr2ogr/ogrinfo - for writing into MySQL
# - default-mysql-client - gml script DELETE step uses mysql
# - rsync + openssh-client - INSPIRE zip backup/restore to storage box
# - (skipped unless REMOTE_BACKUP_DESTINATION_PATH is set)
 # - curl + ca-certificates - Matrix failure notifications in scripts
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       bash gdal-bin default-mysql-client rsync openssh-client curl \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Hoisted workspace deps at /app/node_modules, the app underneath so Node's
# resolution walks up to them.
COPY --from=proddeps /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/package-lock.json ./

# Chromium for INSPIRE pipleline, in fixed path for all users
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/apps/property-boundaries-service
COPY --from=proddeps /app/apps/property-boundaries-service/node_modules ./node_modules
COPY --from=build /app/apps/property-boundaries-service/dist ./dist
COPY --from=build /app/apps/property-boundaries-service/package.json ./package.json
COPY --from=build /app/apps/property-boundaries-service/config ./config

# The pipeline's shell scripts, plus the OSTN15 projection grid installed
# where PROJ looks for it (the legacy servers scp'd it to /usr/share/proj)
COPY --from=build /app/apps/property-boundaries-service/scripts ./scripts
COPY --from=build /app/apps/property-boundaries-service/scripts/OSTN15_NTv2_OSGBtoETRS.gsb /usr/share/proj/

# DB migrations run at deploy time (e.g. Coolify's pre-deploy command:
# `npx sequelize-cli db:migrate`, the same command scripts/deploy.sh uses -
# the CLI is hoisted to /app/node_modules). Bring in the migration sources so
# the CLI can run from this directory, mirroring the layout deploy.sh expects.
COPY --from=build /app/apps/property-boundaries-service/migrations ./migrations
COPY --from=build /app/apps/property-boundaries-service/seeders ./seeders

# The pipeline writes downloads/ logs/ temp.sqlite to the work dir
# Own the dirs and the workdir itself (for temp.sqlite)
RUN mkdir -p downloads logs \
    && chown node:node /app/apps/property-boundaries-service downloads logs

USER node
EXPOSE 4000

# Docker is the process supervisor; run node directly rather than via pm2.
CMD ["node", "--max-old-space-size=4096", "dist/app.js"]

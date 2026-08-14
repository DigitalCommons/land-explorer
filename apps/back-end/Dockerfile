# syntax=docker/dockerfile:1

# Multi-stage build for the Land Explorer back-end (Hapi, TypeScript compiled
# to lib/ with tsc). Builds from the REPO ROOT context - single root lockfile,
# npm workspaces:  docker build -f apps/back-end/Dockerfile .
# See docs/coolify.md for how to build and run this.
#
# Note: unlike the Mykomap back-end (which is bundled by Vite), this app is
# compiled with plain tsc and is NOT bundled, so the runtime stage carries the
# hoisted workspace node_modules and preserves the /app/apps/back-end layout.

# Node version must be supplied (e.g. 24). No sane default - fail loudly if unset.
ARG NODE_VERSION=nonesuch

# ---- build stage ----
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

# git: lets the build read tag/commit info for version metadata.
# python3/make/g++: needed to compile the native `bcrypt` dependency on musl.
RUN apk add --no-cache git python3 make g++

# Install deps first (cache-friendly). npm ci needs the root manifests plus
# every workspace's package.json to validate the lockfile; -w installs only
# this workspace's tree.
COPY package.json package-lock.json .npmrc ./
COPY apps/back-end/package.json apps/back-end/
COPY apps/front-end/package.json apps/front-end/
COPY apps/property-boundaries-service/package.json apps/property-boundaries-service/
RUN --mount=type=cache,target=/root/.npm npm ci -w apps/back-end

COPY . .
RUN npm run build -w apps/back-end

# ---- production deps stage ----
# Fresh install without dev deps. Done in a stage derived from build because
# compiling bcrypt needs the toolchain. sequelize-cli is a dev dep but needed
# to run migrations at deploy time; pinned to the major version in package.json.
# mkdir guarantees the workspace-local node_modules exists for the COPY below.
FROM build AS proddeps
RUN --mount=type=cache,target=/root/.npm npm ci -w apps/back-end --omit=dev \
    && npm install --no-save sequelize-cli@6 \
    && mkdir -p apps/back-end/node_modules

# ---- runtime stage ----
FROM node:${NODE_VERSION}-alpine

# Default to production. The dev compose overrides this to `development`. In
# deployed environments set CORS_ORIGINS to the front-end origin so the API
# accepts its cross-origin requests (see src/server.ts).
ENV NODE_ENV=production

# Recreate the workspace layout: hoisted deps at /app/node_modules, the app
# underneath at /app/apps/back-end so Node's resolution walks up to them.
WORKDIR /app
COPY --from=proddeps /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/package-lock.json ./

WORKDIR /app/apps/back-end
COPY --from=proddeps /app/apps/back-end/node_modules ./node_modules
COPY --from=build /app/apps/back-end/lib ./lib
COPY --from=build /app/apps/back-end/package.json ./package.json

# DB migrations run at deploy time (e.g. Coolify's pre-deploy command:
# `npx sequelize-cli db:migrate` - the CLI is hoisted to /app/node_modules).
# Bring in the migration sources and the Sequelize config so the CLI can run
# inside this image. `models/` isn't needed by db:migrate and doesn't exist.
COPY --from=build /app/apps/back-end/config ./config
COPY --from=build /app/apps/back-end/migrations ./migrations
COPY --from=build /app/apps/back-end/seeders ./seeders
COPY --from=build /app/apps/back-end/.sequelizerc ./.sequelizerc

# Writable dir for transient shapefile exports (see routes/map.ts downloadShapefile).
RUN mkdir -p data && chown node:node data

USER node
EXPOSE 4000

# Docker is the process supervisor; we run node directly rather than via pm2.
CMD ["node", "lib/main.js"]

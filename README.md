# Land Explorer

Land Explorer is a web app for exploring land ownership.

This is a [Digital Commons Cooperative](https://digitalcommons.coop/) project. Please follow our [contributor guidelines](https://github.com/DigitalCommons#-contributing) if you wish to participate in building Land Explorer.

## Components

This is a monorepo containing three npm workspaces:

- **FE** - Front End - app/front-end - The end user app - React SPA (Mapbox GL UI) - React + Redux + Vite
- **BE** - Back End - app/back-end - The API server: auth, user accounts, maps, data groups - Hapi + Sequelize + MySQL
- **PBS** - Property Boundaries Services - app/property-boundaries-service - API + data pipeline for INSPIRE polygons and Land Registry Ownership - Hapi (ESM) + Sequelize + Meilisearch

The monorepo was created from the three component repositories in July 2026. The old spoke repositories are archived.

## Docs

All docs are in the docs folder not in the individual app folders.

## Working in the monorepo

Build test and run using npm:

```
npm install
npm run build
npm test
npm run front-end: dev # run one app (also back-end: / pbs:)
```

First download the secrets file docker.env from Bitwarden (named Land Explorer docker.env) and put it in this repo's root - or if you don't have Bitwarden access (only DCC employees do) edit the docker.env.example and rename it to docker.env

Run the whole stack locally with Docker:

```
docker compose --env-file docker.env -f docker-compose.local.yml up --build
```

Now up at http://localhost:28080

### Hot reload while developing

Or add the docker-compose.dev.yml overlay to run everything with hot reloading while you work:

```
docker compose --env-file docker.env -f docker-compose.local.yml -f docker-compose.dev.yml up --build
```

Now up at http://localhost:28080 and any edits reload without a rebuild. You only need to rebuild (kill the docker compose then run the command above again) if dependencies or Dockerfiles change.

PBS lacks the full toolchain so for pipline work use the npm steps above.

Use the docker compose without the .dev overlay for smoke testing big changes as that one mirrors the production Coolify setup with Caddy.

### Changing an app's dependencies

Each app keeps its own package-lock.json, which Docker and CI build from, but npm workspaces only updates the root package-lock.json. After any dependency change, sync the app's own lockfile so for example to add a package to the front end do this:

```
npm install -w apps/front-end <package>
cd apps/front-end
npm install --package-lock-only --workspaces=false --legacy-peer-deps
```

Commit both lockfiles. If you forget, npm ci fails in Docker and CI with a package.json / package-lock.json out of sync error.

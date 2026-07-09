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

Run the whole stack locally with Docker:

```
docker compose --env-file docker.env -f compose.all.yml up --build
```

Now up at http://localhost:28080

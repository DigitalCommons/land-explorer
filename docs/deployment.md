# Deployment

LX is deployed by DCC on **Coolify**

## Model

There is one docker-compose.yml that contains the whole app.

The services (mysql and meilisearch) run in stack as named volumes.

## Domains

Coolify routes a public domain to the service port - the front end Caddy vhost must equal the domain the app runs on. In the Coolify UI set for each resource:

- front-end: app.landexplorer.coop port 80
- back-end, pbs, mysql, meilisearch: no domain (internal only) - the API is same-origin - the FE's Caddy proxies /api/* and /socket.io/* to the API_UPSTREAM build arg - back-end:4000 by default (in the compose file). In addition /pbs/* can be proxied to PBS behind basic auth - see "Triggering the PBS pipeline on dev"

Then set FRONT_END_HOSTNAME= the front-end domain (bakes into the FE image at build).

## Env vars (set per resource in Coolify)

`${VAR:?...}` in the compose file means it is required (deploy fails if unset); `:-` means it is optional. Generate new secrets for every environment on Coolify, do not re-use production secrets ever.

- MYSQL_ROOT_PASSWORD - generate with `openssl rand -hex 32`
- MEILI_MASTER_KEY - generate as above
- TOKEN_KEY - generate as above
- BOUNDARY_SERVICE_SECRET - generate as above (shared between BE and PBS)
- FRONT_END_HOSTNAME - where the FE is served - app.landexplorer.coop for example
- TOKEN_EXPIRY_DAYS - 365 by default
- CORS_ORIGIN - https://app.landexplorer.coop
- SEED_DEMO_DATA - true - be-migrate runs the demo seeds to get some test data in - see apps/back-end/seeders - the default user is test-lx@digitalcommons.coop and password is testingtesting123
- VITE_OS_KEY, VITE_OS_PLACES_KEY, VITE_GEOCODER_TOKEN, VITE_MAPBOX_TOKEN - required for various map features, each is an API key requiring an account or subscription
- SENDGRID_API_KEY - required to send email
- MIXPANEL_TOKEN, ANALYTICS_PEPPER, VITE_MIXPANEL_TOKEN, VITE_MIXPANEL_PEPPER - leave off for non-production - stores analytics data if consent given
- GOV_API_URL, GOV_API_KEY, OS_NGD_API_URL, OS_NGD_API_KEY, MAPBOX_GEOCODER_TOKEN\ - required for PBS pipeline, each is an API key requiring an account or subscription
- PBS_AUTH_HASH - enables the /pbs/* proxy route (see "Triggering the PBS pipeline on dev")

## Databases — seed vs full copy

Migrations run as one-shot services (be-migrate, pbs-migrate) before the apps.
Data on top:

- **dev & PR previews** — be-migrate migrates then when SEED_DEMO_DATA=true the demo seeders are run (tracked in SequelizeData like migrations - see app/back-end/seeders. Previews self-seed a fresh DB. PBS seeds too: a small slice of real polygon + ownership data around Penryn (apps/property-boundaries-service/seeders/), and the pbs-index one-shot then builds the Meilisearch index from it.
- **staging** - full copy of production DBs using Coolify container copy or mysqldump - run migrations after restore to apply any newer schema.

## PBS pipeline

Staging and prod run the monthly INSPIRE/ownerships pipeline on top of the full copy, dev and PR builds do not. A Coolify Scheduled Task on the pbs service runs monthly on the 10th at 3am (0 3 10 * *), after INSPIRE publishes on the first Sunday. Prod (once cut over) gets the same task in the prod flavour (`stopBeforeTask=analyseInspire`, no boundary writes). Task commands: see property-boundaries-service/pipeline.md "Running on Coolify".

### Triggering the PBS pipeline on dev

PBS doesn't have its own public domain but the FE Caddy can proxy /pbs/* to it behind basic auth to prevent it being triggered by accident through the user browser. Off by default. Enable it by setting PBS_AUTH_HASH:

1. Generate the auth in htpasswd format (user:bcrypt-hash) - devops is the username you can edit and the-password is the password which you MUST edit:

```
docker run --rm httpd:2-alpine htpasswd -nbB devops 'the-password'
```

2. Coolify: on the dev resource add env var PBS_AUTH_HASH= and user the code from before
3. Store the plain text username and password in Vaultwarden
4. Hit Redeploy (the route bakes into the FE image)
5. Trigger, with the username from step 1 - e.g. on prod:

```
curl -u devops "https://app.landexplorer.coop/pbs/run-pipeline?secret=<BOUNDARY_SERVICE_SECRET>&startAtTask=ownerships&stopBeforeTask=downloadInspire"
```

The /pbs prefix is stripped, so any PBS route works. PBS still requires its secret query param. Progress: pbs container logs. Do not run downloadInspire onwards on previews - it pulls the full monthly INSPIRE dataset and needs the GOV_API keys.

## Database backups (prod)

The pbs container does the backups using scripts/backup-databases.sh - Configure on
the lx-prod resource with the env vars from Bitwarden:

- Scheduled Task, daily 02:30 (`30 2 * * *`):
  `bash scripts/backup-databases.sh land_explorer`
- Scheduled Task, monthly 11th 02:30 (`30 2 11 * *`), the day after the
  pipeline: `bash scripts/backup-databases.sh property_boundaries`

Retention - land_explorer keeps 31 dailies and the 1st of the month for 2 years - property_boundaries keeps 6 months. Raw INSPIRE zip bacups are kept forever. Meilisearch is not backed up - rebuild it with the updateProprietors pipeline task.

To restore: copy a dump down and pipe it into the mysql container then run the pipeline for Meilisearch.

## Notes

- One-shot migrate containers exit 0 so Coolify may show them "unhealthy" but this is purely cosmetic.
- Staging is fed by force-push to staging from a `v*` tag like v1.2.3 or v2006.7.9

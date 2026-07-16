# Our servers

We have a staging server at https://staging.landexplorer.coop/ and a production server at https://landexplorer.coop/.

Generally, we deploy the `development` branch of each codebase to staging, where we do QA testing, and the `main` release branches to the production server.

The LX staging and production servers also point to our Property Boundaries Service, which lives on staging-2 and prod-2 respectively. You can find more details about the PBS [here](https://github.com/DigitalCommons/property-boundaries-service).

# Deployment Instructions

## Continuous delivery (only on staging)

We have set up continuous delivery on the staging server, so when you push to the `development` branch of each repository (static, frontend, backend), the new code is automatically pulled, built and deployed. We achieve this using GitHub actions and webhooks. If this isn't working, you can debug the hook runner using the [job logs](https://staging.hook-runner.landexplorer.coop/). Make any fixes to the hook runner in [this repo](https://github.com/DigitalCommons/land-explorer-hook-runner) and upload the new code to the staging server.

## How to deploy manually

We haven't set up continuous delivery on the production server, so you need to deploy code for releases manually.

You can also deploy code to the staging server manually, which may be necessary if the hook runner isn't working or if you want to temporarily deploy code from a custom branch that isn't `development`.

1. Have your public ssh key added to the ssh file on the server.
1. `ssh root@<hetzner-server-ip>`
1. Navigate to the directory of the codebase being deployed e.g. `cd land-explorer-static` or `cd land-explorer-front-end` or `cd land-explorer-back-end`.
    1. `git status` to check we are in the correct branch (e.g. 'main' on production)
    1. `bash scripts/deploy.sh`. This will pull the latest code, build/transpile it, run any outstanding migration scripts, and reload the server.
    1. Sometimes it's worth checking `git log` that your commit has actually been pulled.

If you are doing a release and there are changes to the Property Boundaries Service too, make sure to deploy there too! See the [PBS documentation](https://digitalcommons.github.io/property-boundaries-service/deployment/#subsequent-updates) for details on how to do this.

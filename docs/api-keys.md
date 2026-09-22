# API keys

## Frontend (`VITE_*`) keys are public

Anything prefixed `VITE_` is inlined into the JS bundle at build time and shipped to every visitor's
browser - anyone can read it out of the built files or dev tools network tab. Never put a key behind
a `VITE_` var unless it can be **domain-restricted** on the provider's side (so a stolen key only
works on our domain) - it is never truly secret.

If a key can't be domain-restricted, it belongs on the back-end (or PBS) instead, called via an
internal API route, so the key itself never reaches the browser.

## Ordnance Survey keys

We currently have three separate OS keys in play, on two different OS accounts:

| Var                          | Where           | Account                                        | Used?                                          |
| ----------------------------- | --------------- | ----------------------------------------------- | ----------------------------------------------- |
| `VITE_OS_KEY`                 | front-end       | the OS account in **Bitwarden**                 | yes - map tile layer (see `mapSources.ts`)      |
| `VITE_OS_PLACES_KEY`          | front-end       | unknown account (login not known)               | **no** - defined in `constants.ts` but nothing reads it |
| `OS_NGD_API_KEY` (PBS)        | back-end (PBS)  | presumably the same unknown account as `VITE_OS_PLACES_KEY`    | rarely - only by the one-off `initialise-unregistered-land-layer.ts` script, not run as part of the regular pipeline - this is a **premium-plan** API endpoint |


The "unknown account" keys (`VITE_OS_PLACES_KEY` and PBS's `OS_NGD_API_KEY`) are linked to an OS account we don't have login details for. 
- `VITE_OS_PLACES_KEY` isn't currently used. This should be replaced with a key from the new known account if it is ever used.
- `OS_NGD_API_KEY` in PBS is part of a one off script so isn't used as part of day to day operation. If we ever need this script again we might need to upgrade the new OS account to premium and replace this key.
    
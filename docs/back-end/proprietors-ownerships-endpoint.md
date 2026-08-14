# Proprietor Ownerships Endpoint

## Overview

`GET /api/proprietors/ownerships` returns every property a proprietor held at the end of
a given year (i.e. on 31 December), along with the polygon(s) for each title. It proxies the
request to the Property Boundaries Service (PBS) and returns the response.

See the PBS-side [proprietor ownerships endpoint docs](../property-boundaries-service/ownerships-endpoint.md)
for details of how matches are made and how the data is stored.

## Request

**Authentication:** Bearer token required (standard JWT auth).

**Query parameters:**

| Parameter        | Type    | Required         | Constraints                | Description                                                                                                                                                                                            |
| ---------------- | ------- | ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `proprietorName` | string  | One of these two | 1–255 characters           | Proprietor name to match                                                                                                                                                                               |
| `companyRegNo`   | string  | One of these two | 1–255 characters           | Company registration number to match. Takes precedence over `proprietorName` if both are given, since it's the stable unique key for a company (name spelling can vary slightly between title records) |
| `year`           | integer | Yes              | 2017 to (current year − 1) | The year to find ownerships for; matches the snapshot taken on 31 December of that year                                                                                                                |

At least one of `proprietorName` or `companyRegNo` must be given.

**Example:**

```
GET /api/proprietors/ownerships?proprietorName=Acme%20Ltd&year=2020
```

## Response

**200 OK**

Not paginated - the frontend needs every one of the proprietor's properties at once, to highlight all of them on the map together. When nothing matches, this returns
`proprietorName`/`companyRegNumber` as `null` and an empty `ownerships` array, rather than an
error.

```json
{
    "proprietorName": "Acme Ltd",
    "companyRegNumber": "12345678",
    "year": 2020,
    "ownerships": [
        {
            "titleNumber": "AB123456",
            "address": "1 Main St, Anytown",
            "polygons": [{ "polyId": 1, "geom": { "type": "Polygon", "coordinates": [] } }]
        }
    ],
    "totalResults": 1
}
```

**400 Bad Request** - returned when query validation fails (e.g. missing `year`, `year` out of
range, or neither `proprietorName` nor `companyRegNo` given).

```json
{ "message": "\"value\" must contain at least one of [proprietorName, companyRegNo]" }
```

**401 Unauthorized** - returned when the request is missing valid authentication.

**499** - returned when the client disconnects before the PBS response arrives. The in-flight PBS
request is aborted via `AbortController`.

**500 Internal Server Error** - returned on unexpected errors from the PBS.

## Implementation

| File                                                                                                       | Role                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [src/routes/proprietors/ownerships.ts](../../apps/back-end/src/routes/proprietors/ownerships.ts)           | Route definition, input validation, client-abort handling                                                                                  |
| [src/clients/pbs/proprietor-ownerships.ts](../../apps/back-end/src/clients/pbs/proprietor-ownerships.ts)   | `getProprietorOwnerships()` - axios call to PBS `/proprietors/ownerships`, mapping `companyRegNo` to the PBS param `companyRegistrationNo` |
| [src/routes/proprietors/ownerships.test.ts](../../apps/back-end/src/routes/proprietors/ownerships.test.ts) | Unit tests                                                                                                                                 |

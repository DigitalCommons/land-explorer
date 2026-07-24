# Proprietor Ownerships Endpoint

## Overview

`GET /proprietors/ownerships` returns every property a proprietor held at the end of a
given year (i.e. on 31 December), along with the polygon(s) for each title. It's used to plot a
proprietor's ownership history on the map, one year at a time.

Matches are read from the `land_ownership_snapshots` table, which holds a snapshot of ownership
taken on 31 December of each year since 2017 (the earliest year the Land Registry's ownership
dataset covers in its current format).

## Request

**Authentication:** `secret` query parameter, matched against the PBS `SECRET` environment
variable (same scheme as `GET /proprietors`).

**Query parameters:**

| Parameter               | Type    | Required         | Constraints                | Description                                                                                                                                                                                            |
| ----------------------- | ------- | ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `proprietorName`        | string  | One of these two | 1–255 characters           | Proprietor name to match                                                                                                                                                                               |
| `companyRegistrationNo` | string  | One of these two | 1–255 characters           | Company registration number to match. Takes precedence over `proprietorName` if both are given, since it's the stable unique key for a company (name spelling can vary slightly between title records) |
| `year`                  | integer | Yes              | 2017 to (current year − 1) | The year to find ownerships for; matches the snapshot taken on 31 December of that year                                                                                                                |
| `secret`                | string  | Yes              | —                          | API secret                                                                                                                                                                                             |

At least one of `proprietorName` or `companyRegistrationNo` must be given.

**Example:**

```
GET /proprietors/ownerships?proprietorName=Acme%20Ltd&year=2020&secret=...
```

## Response

**200 OK**

Not paginated - the frontend needs every one of the proprietor's properties at once, both to highlight all of them on the map together. When nothing matches, this returns
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

A title can have more than one polygon, in which case they're all listed under the same
`ownerships` entry.

**400 Bad Request** - returned when query validation fails (e.g. missing `year`, `year` out of
range, or neither `proprietorName` nor `companyRegistrationNo` given).

```json
{ "message": "\"value\" must contain at least one of [proprietorName, companyRegistrationNo]" }
```

**403 Forbidden** - returned when `secret` is missing or incorrect.

**500 Internal Server Error** - returned on unexpected errors.

## Implementation

| File                                                                                                                                | Role                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [src/routes/proprietors/ownerships.ts](../../apps/property-boundaries-service/src/routes/proprietors/ownerships.ts)                 | Route definition, input validation, secret check                                |
| [src/services/ownership/ownership-service.ts](../../apps/property-boundaries-service/src/services/ownership/ownership-service.ts)   | `getOwnershipRecordsByProprietor()` - groups matched rows by title              |
| [src/queries/land-ownership-snapshot-query.ts](../../apps/property-boundaries-service/src/queries/land-ownership-snapshot-query.ts) | `getOwnershipsForProprietorAndYear()` - queries and joins snapshots to polygons |
| [src/routes/proprietors/ownerships.test.ts](../../apps/property-boundaries-service/src/routes/proprietors/ownerships.test.ts)       | Unit tests                                                                      |

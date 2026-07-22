#!/usr/bin/env bash

# Regenerate seeders/data/penryn-demo.sql.gz
# Gets a small slice of real polygons and land ownership for PR builds
# Set to Penryn, Cornwall (~2800 polygons).

set -euo pipefail

BBOX=${BBOX:-'POLYGON((50.163 -5.116, 50.163 -5.096, 50.175 -5.096, 50.175 -5.116, 50.163 -5.116))'}
POLY_WHERE="MBRContains(ST_GeomFromText('$BBOX', 4326), geom)"
OWN_WHERE="title_no IN (SELECT title_no FROM land_ownership_polygons WHERE $POLY_WHERE)"
DUMP="mysqldump -h ${DB_HOST:-localhost} -u $DB_USER -p$DB_PASSWORD --single-transaction --no-tablespaces --no-create-info --compact --hex-blob"

$DUMP --where="$OWN_WHERE" "$DB_NAME" land_ownerships
$DUMP --where="$POLY_WHERE" "$DB_NAME" land_ownership_polygons

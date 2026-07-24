import chunk from "lodash.chunk";
import { QueryTypes } from "sequelize";
import { sequelize } from "./database.js";
import { LandOwnershipSnapshotModel } from "./models.js";
import { LandOwnershipSnapshotRow } from "../pipeline/ownership-snapshots/land-ownership-snapshot-mapper.js";

// Each CSV row can expand into up to 4 snapshot rows (one per proprietor slot), so we cap the size
// of each bulkCreate call to avoid hitting MySQL's max_allowed_packet limit on large chunks.
const MAX_ROWS_PER_INSERT = 20000;

/**
 * Batch create land ownership snapshot records.
 * @param rows the snapshot rows to insert
 * @param logging Whether to do DB level logging
 */
export const bulkCreateLandOwnershipSnapshots = async (
  rows: LandOwnershipSnapshotRow[],
  logging = false,
) => {
  const snapshotRowChunks = chunk(rows, MAX_ROWS_PER_INSERT);
  for (const snapshotRowChunk of snapshotRowChunks) {
    await LandOwnershipSnapshotModel.bulkCreate(snapshotRowChunk, {
      logging: logging ? console.log : false,
      benchmark: true,
      ignoreDuplicates: true,
    });
  }
};

export type ProprietorOwnershipRecord = {
  title_no: string;
  property_address: string | null;
  proprietor_name: string;
  company_registration_no: string;
  poly_id: number;
  geom: unknown;
};

/**
 * Find land ownership snapshot rows, joined with their polygon geometry, for a proprietor that
 * held title on 31 December of the given year. When a company registration number is given, it's
 * used on its own to match, since it's the stable unique key for a company; proprietor name
 * spelling can vary slightly between title records. Otherwise, matches are made on proprietor
 * name.
 *
 * Titles are joined to their polygons on title_no, so a title with multiple polygons produces one
 * row per polygon. Titles with no matched polygon are not returned, since there'd be nothing to
 * highlight on the map. There's no pagination: the frontend needs the full set of a proprietor's
 * properties at once, both to list them and to highlight all of them on the map together.
 * @param proprietorName proprietor name to match (ignored if companyRegistrationNo is given)
 * @param companyRegistrationNo company registration number to match
 * @param year the year to find ownerships for (matches the snapshot taken on 31 December)
 */
export const getOwnershipsForProprietorAndYear = async (
  proprietorName: string | undefined,
  companyRegistrationNo: string | undefined,
  year: number,
): Promise<ProprietorOwnershipRecord[]> => {
  const matchColumn = companyRegistrationNo
    ? "company_registration_no"
    : "proprietor_name";
  const matchValue = companyRegistrationNo ?? proprietorName;

  const query = `SELECT
      land_ownership_snapshots.title_no,
      land_ownership_snapshots.property_address,
      land_ownership_snapshots.proprietor_name,
      land_ownership_snapshots.company_registration_no,
      land_ownership_polygons.poly_id AS poly_id,
      land_ownership_polygons.geom AS geom
    FROM land_ownership_snapshots
    INNER JOIN land_ownership_polygons
      ON land_ownership_snapshots.title_no = land_ownership_polygons.title_no
    WHERE land_ownership_snapshots.snapshot_date = ?
      AND land_ownership_snapshots.${matchColumn} = ?;`;

  return await sequelize.query(query, {
    replacements: [`${year}-12-31`, matchValue],
    type: QueryTypes.SELECT,
  });
};

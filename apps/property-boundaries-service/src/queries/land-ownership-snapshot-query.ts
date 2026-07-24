import chunk from "lodash.chunk";
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
};

export type ProprietorOwnershipResult = {
  rows: ProprietorOwnershipRecord[];
  totalResults: number;
};

/**
 * Find land ownership snapshot rows for a proprietor that held title on 31 December of the given
 * year. When a company registration number is given, it's used on its own to match, since it's
 * the stable unique key for a company; proprietor name spelling can vary slightly between title
 * records. Otherwise, matches are made on proprietor name.
 * @param proprietorName proprietor name to match (ignored if companyRegistrationNo is given)
 * @param companyRegistrationNo company registration number to match
 * @param year the year to find ownerships for (matches the snapshot taken on 31 December)
 * @param page 1-indexed page number
 * @param pageSize number of rows per page
 */
export const getOwnershipsForProprietorAndYear = async (
  proprietorName: string | undefined,
  companyRegistrationNo: string | undefined,
  year: number,
  page: number,
  pageSize: number,
): Promise<ProprietorOwnershipResult> => {
  const { rows, count } = await LandOwnershipSnapshotModel.findAndCountAll({
    where: {
      snapshot_date: `${year}-12-31`,
      ...(companyRegistrationNo
        ? { company_registration_no: companyRegistrationNo }
        : { proprietor_name: proprietorName }),
    },
    attributes: [
      "title_no",
      "property_address",
      "proprietor_name",
      "company_registration_no",
    ],
    order: [["title_no", "ASC"]],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return {
    rows: rows.map((row) =>
      row.get({ plain: true }),
    ) as ProprietorOwnershipRecord[],
    totalResults: count,
  };
};

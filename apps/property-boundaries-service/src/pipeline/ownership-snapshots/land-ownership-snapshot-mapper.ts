import { RawOwnership } from "../../gov-api/datasets.types.js";
import { logger } from "../logger.js";

export type LandOwnershipSnapshotRow = {
  title_no: string;
  snapshot_date: Date;
  proprietor_name: string;
  company_registration_no: string;
  property_address: string | null;
  district: string | null;
  county: string | null;
  region: string | null;
  postcode: string | null;
  proprietor_uk_based: boolean;
  date_proprietor_added: string | null;
};

const PROPRIETOR_COLUMNS: (keyof RawOwnership)[] = [
  "Proprietor Name (1)",
  "Proprietor Name (2)",
  "Proprietor Name (3)",
  "Proprietor Name (4)",
];
const COMPANY_COLUMNS: (keyof RawOwnership)[] = [
  "Company Registration No. (1)",
  "Company Registration No. (2)",
  "Company Registration No. (3)",
  "Company Registration No. (4)",
];

/**
 * Expand each raw gov CSV ownership row into one snapshot row per populated proprietor slot
 * (up to 4), skipping rows with no title number.
 */
export const mapRawOwnershipsToSnapshotRows = (
  ownerships: RawOwnership[],
  snapshotDate: Date,
  overseas: boolean,
): LandOwnershipSnapshotRow[] => {
  let skippedRowCount = 0;

  const rows = ownerships.flatMap((ownership) => {
    if (!ownership["Title Number"]) {
      skippedRowCount++;
      return [];
    }

    const rows: LandOwnershipSnapshotRow[] = [];
    for (let i = 0; i < PROPRIETOR_COLUMNS.length; i++) {
      const proprietorName = ownership[PROPRIETOR_COLUMNS[i]];
      const companyRegNo = ownership[COMPANY_COLUMNS[i]];

      if (proprietorName || companyRegNo) {
        rows.push({
          title_no: ownership["Title Number"],
          snapshot_date: snapshotDate,
          property_address: ownership["Property Address"] || null,
          district: ownership.District || null,
          county: ownership.County || null,
          region: ownership.Region || null,
          postcode: ownership.Postcode || null,
          proprietor_name: proprietorName || "",
          company_registration_no: companyRegNo || "",
          proprietor_uk_based: !overseas,
          date_proprietor_added: convertDate(
            ownership["Date Proprietor Added"],
          ),
        });
      }
    }
    return rows;
  });

  if (skippedRowCount > 0) {
    logger.error(
      `Skipped ${skippedRowCount} of ${ownerships.length} rows in this chunk due to missing title number`,
    );
  }

  return rows;
};

const convertDate = (date?: string) =>
  date ? date.split("-").reverse().join("-") : null;

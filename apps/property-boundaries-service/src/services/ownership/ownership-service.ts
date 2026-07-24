import { getOwnershipsForProprietorAndYear } from "../../queries/land-ownership-snapshot-query.js";

type OwnershipData = {
  address: string | null;
  polygons: { polyId: number; geom: unknown }[];
};

/**
 * Get a proprietor's ownership records for the given year, grouped by title_no, each with the
 * polygon(s) for that title. Not paginated: the frontend needs every one of the proprietor's
 * properties at once, both to list them and to highlight all of them on the map together.
 * @param year the year to find ownerships for (matches the snapshot taken on 31 December)
 * @param proprietorName proprietor name to match (ignored if companyRegistrationNo is given)
 * @param companyRegistrationNo company registration number to match; used on its own since it's
 * the stable unique key for a company, unlike proprietor name spelling
 */
export const getOwnershipRecordsByProprietor = async (
  year: number,
  proprietorName?: string,
  companyRegistrationNo?: string,
) => {
  const rows = await getOwnershipsForProprietorAndYear(
    proprietorName,
    companyRegistrationNo,
    year,
  );

  const titles = new Map<string, OwnershipData>();

  for (const row of rows) {
    if (!titles.has(row.title_no)) {
      titles.set(row.title_no, {
        address: row.property_address,
        polygons: [],
      });
    }
    titles
      .get(row.title_no)!
      .polygons.push({ polyId: row.poly_id, geom: row.geom });
  }

  return {
    proprietorName: rows[0]?.proprietor_name ?? null,
    companyRegNumber: rows[0]?.company_registration_no ?? null,
    year,
    ownerships: Array.from(titles.entries()).map(
      ([titleNumber, { address, polygons }]) => ({
        titleNumber,
        address,
        polygons,
      }),
    ),
    totalResults: titles.size,
  };
};

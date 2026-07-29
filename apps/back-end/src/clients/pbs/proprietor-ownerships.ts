import { pbsClient } from "./client";

export type OwnershipPolygon = { polyId: number; geom: unknown };

export type ProprietorOwnership = {
  titleNumber: string;
  address: string | null;
  polygons: OwnershipPolygon[];
};

export type ProprietorOwnershipsResponse = {
  proprietorName: string | null;
  companyRegNumber: string | null;
  year: number;
  ownerships: ProprietorOwnership[];
  totalResults: number;
};

/**
 * Get the properties a proprietor held title to at the end of a given year (i.e. on 31 December),
 * from the Property Boundaries Service.
 *
 * @param year the year to find ownerships for
 * @param proprietorName proprietor name to match (ignored if companyRegNo is given)
 * @param companyRegNo company registration number to match; used on its own since it's the stable
 * unique key for a company, unlike proprietor name spelling
 * @param signal optional AbortSignal to cancel the request
 */
export const getProprietorOwnerships = async (
  year: number,
  proprietorName: string | undefined,
  companyRegNo: string | undefined,
  signal?: AbortSignal,
): Promise<ProprietorOwnershipsResponse> => {
  const response = await pbsClient.get("/proprietors/ownerships", {
    params: {
      year,
      proprietorName,
      companyRegistrationNo: companyRegNo,
    },
    signal,
  });
  return response.data;
};

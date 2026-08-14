import { pbsClient } from "./client";

export type ProprietorSearchResponse = {
  results: { id: string; proprietorName: string }[];
  page: number;
  pageSize: number;
  totalResults: number;
};

/**
 * Search for proprietors by name in the Property Boundaries Service.
 *
 * @param searchTerm partial or full proprietor name to search for
 * @param page page number
 * @param pageSize number of results per page
 * @param signal optional AbortSignal to cancel the request
 */
export const searchProprietors = async (
  searchTerm: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<ProprietorSearchResponse> => {
  const response = await pbsClient.get("/proprietors", {
    params: { searchTerm, page, pageSize },
    signal,
  });
  return response.data;
};

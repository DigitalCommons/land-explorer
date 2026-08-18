import axios from "axios";
import { DataSet, FullDatasetResponse } from "./response.types.js";

const GOV_API_TIMEOUT_MS = 30000;
export const govApiClient = axios.create({
  baseURL: process.env.GOV_API_URL,
  headers: {
    Authorization: process.env.GOV_API_KEY,
  },
  timeout: GOV_API_TIMEOUT_MS,
});

/**
 * Retrieves the full UK dataset for a specific month and year.
 * @param month The month for which to retrieve data.
 * @param year The year for which to retrieve data.
 */
export const getFullUKDataset = async (
  month: number,
  year: number,
): Promise<DataSet> => {
  const paddedMonth = String(month).padStart(2, "0");
  const response = await govApiClient.get<FullDatasetResponse>(
    `/datasets/history/ccod/CCOD_FULL_${year}_${paddedMonth}.zip`,
  );
  return { downloadUrl: response.data.result.download_url };
};

/**
 * Retrieves the full overseas dataset for a specific month and year.
 * @param month The month for which to retrieve data.
 * @param year The year for which to retrieve data.
 */
export const getFullOverseasDataset = async (
  month: number,
  year: number,
): Promise<DataSet> => {
  const paddedMonth = String(month).padStart(2, "0");
  const response = await govApiClient.get<FullDatasetResponse>(
    `/datasets/history/ocod/OCOD_FULL_${year}_${paddedMonth}.zip`,
  );
  return { downloadUrl: response.data.result.download_url };
};

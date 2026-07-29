import { addYears, eachYearOfInterval, endOfYear } from "date-fns";
import {
  getFullOverseasDataset,
  getFullUKDataset,
} from "../../clients/gov-api/client.js";
import { DataSet } from "../../clients/gov-api/response.types.js";
import {
  getLatestOwnershipSnapshotDataDate,
  setPipelineLatestOwnershipSnapshotData,
} from "../../queries/pipeline-query.js";
import { logger } from "../logger.js";
import { notifyMatrix } from "../util.js";
import { pipeZippedCsvFromUrlIntoFun } from "../ownerships/helpers.js";
import { bulkCreateLandOwnershipSnapshots } from "../../queries/land-ownership-snapshot-query.js";
import { mapRawOwnershipsToSnapshotRows } from "./land-ownership-snapshot-mapper.js";

const EARLIEST_DATE_TO_PROCESS = new Date(2017, 11, 31); // The earliest end of year date for which we have ownership data

/**
 * Update the ownership snapshots table
 * This will insert land ownership snapshot records for each completed year
 * The table inserts a row per proprietor, title number and snapshot date
 */
export const updateOwnershipSnapshots = async () => {
  let latestOwnershipSnapshotDataDate =
    await getLatestOwnershipSnapshotDataDate();
  logger.info(
    `Latest ownership snapshot data is from ${latestOwnershipSnapshotDataDate}`,
  );

  let dateToProcessFrom: Date = await getDateToProcessFrom(
    latestOwnershipSnapshotDataDate,
  );

  // guard to check whether there is any new ownership snapshot data to process, if not then return
  const lastFullYearEndDate = endOfYear(addYears(new Date(), -1));
  if (dateToProcessFrom > lastFullYearEndDate) {
    logger.info(
      `No new ownership snapshot data to process, as the latest ownership snapshot data is from ${latestOwnershipSnapshotDataDate}`,
    );
    return;
  }

  const yearsToProcess = eachYearOfInterval({
    start: dateToProcessFrom,
    end: lastFullYearEndDate,
  });

  // loop through each year from dateToProcessFrom to the end of last year and process the ownership snapshot data for that year
  for (let year of yearsToProcess) {
    const success = await downloadAndProcessOwnershipSnapshotDataForYear(
      year.getFullYear(),
    );

    if (!success) {
      const msg = `Failed to process ownership snapshot data for year ${year.getFullYear()}. Halting further snapshot processing.`;
      logger.error(msg);
      await notifyMatrix(`🔴 ${msg}`);
      return;
    }
  }
  await notifyMatrix(
    `✅ Successfully inserted land ownership snapshots for years: ${yearsToProcess
      .map((x) => x.getFullYear())
      .join(", ")}`,
  );
};

/**
 * If latestOwnershipSnapshotDataDate is null, we need to process from 2017
 * otherwise we need to process from the year of latestOwnershipSnapshotDataDate
 * @param latestOwnershipSnapshotDataDate date of the latest snapshot in the db
 */
const getDateToProcessFrom = async (
  latestOwnershipSnapshotDataDate: Date | null,
): Promise<Date> => {
  let dateToProcessFrom: Date;
  if (!latestOwnershipSnapshotDataDate) {
    logger.info(
      "No ownership snapshot data found, so we will process all years from 2017 to the end of last year",
    );
    dateToProcessFrom = EARLIEST_DATE_TO_PROCESS;
  } else {
    logger.info(
      `We will process ownership snapshot data from ${latestOwnershipSnapshotDataDate} to the end of last year`,
    );
    dateToProcessFrom = addYears(latestOwnershipSnapshotDataDate, 1);
  }
  return dateToProcessFrom;
};

/**
 * Download the UK and overseas datasets for each year end and insert the data into our db
 * @param year the year to process data for 
 
 */
const downloadAndProcessOwnershipSnapshotDataForYear = async (
  year: number,
): Promise<boolean> => {
  logger.info(`Processing ownership snapshot data for year ${year}`);
  const snapshotDate = new Date(year, 11, 31);
  // We need to download the January FULL dataset for the following year.
  // e.g. for December 2023 we need the Jan 2024 file, which contains the snapshot data for the previous month i.e. 31/12/2023
  const fileYear = year + 1;

  const [ukSuccess, overseasSuccess] = await Promise.all([
    downloadAndProcessDataset(
      "UK",
      getFullUKDataset,
      false,
      fileYear,
      snapshotDate,
    ),
    downloadAndProcessDataset(
      "overseas",
      getFullOverseasDataset,
      true,
      fileYear,
      snapshotDate,
    ),
  ]);
  if (!ukSuccess || !overseasSuccess) {
    return false;
  }

  await setPipelineLatestOwnershipSnapshotData(snapshotDate);
  return true;
};

/**
 * Download and process a UK or overseas ownership snapshot dataset
 * @param label human-readable label used in log messages, e.g. "UK" or "overseas"
 * @param getDataset fetcher for the dataset's download URL
 * @param overseas whether this is the overseas dataset
 * @param fileYear the year of the file to retrieve
 * @param snapshotDate the date of the snapshot e.g. 31/12/2020
 */
const downloadAndProcessDataset = async (
  label: string,
  getDataset: (month: number, year: number) => Promise<DataSet>,
  overseas: boolean,
  fileYear: number,
  snapshotDate: Date,
): Promise<boolean> => {
  logger.info(
    `Downloading FULL ownership ${label} snapshot data for 01/${fileYear} as this contains the data for December ${snapshotDate.getFullYear()}`,
  );

  let ownershipSnapshotData: DataSet;
  try {
    ownershipSnapshotData = await getDataset(1, fileYear);
  } catch (error) {
    logger.error(
      error,
      `Failed to download FULL ${label} ownership snapshot data for 01/${fileYear}`,
    );
    return false;
  }
  logger.info(
    `Successfully downloaded FULL ${label} ownership snapshot data for 01/${fileYear}`,
  );

  try {
    await pipeZippedCsvFromUrlIntoFun(
      ownershipSnapshotData.downloadUrl,
      (ownership) => {
        const mappedRows = mapRawOwnershipsToSnapshotRows(
          ownership,
          snapshotDate,
          overseas,
        );
        return bulkCreateLandOwnershipSnapshots(mappedRows);
      },
      20000,
    );
  } catch (error) {
    logger.error(error);
    logger.error(
      `Failed to process FULL ${label} ownership snapshot data for 01/${fileYear}`,
    );
    return false;
  }
  return true;
};

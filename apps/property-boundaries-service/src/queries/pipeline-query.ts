import { Op } from "sequelize";
import { format } from "date-fns";
import { PipelineRunModel } from "./models.js";
import { getRunningPipelineKey } from "../pipeline/util.js";

/** Columns on pipeline_runs that track the latest date of data processed by that run. */
export type LatestDataColumn =
  | "latest_ownership_data"
  | "latest_inspire_data"
  | "latest_snapshot_ownership_data";


/**
 * Return the date stored in `columnName` on the most recent pipeline run that has it set, or
 * null if no pipeline run has set it yet.
 */
export const getLatestPipelineDataDate = async (
  columnName: LatestDataColumn,
): Promise<Date | null> => {
  const latestRun: any = await PipelineRunModel.findOne({    
    where: { [columnName]: { [Op.ne]: null } },
    order: [["startedAt", "DESC"]],
  });
  return latestRun ? new Date(latestRun[columnName]) : null;
};

/**
 * Set `columnName` to `date` (in YYYY-MM-DD format) on the currently running pipeline run.
 */
export const setPipelineLatestData = async (
  columnName: LatestDataColumn,
  date: string,
) => {
  await PipelineRunModel.update(
    { [columnName]: date },
    {
      where: {
        unique_key: getRunningPipelineKey(),
      },
    },
  );
};

/**
 * Return the date of the latest ownership snapshot data that was processed by the latest pipeline run, or
 * null if no pipeline has completed yet.
 */
export const getLatestOwnershipSnapshotDataDate = () =>
  getLatestPipelineDataDate("latest_snapshot_ownership_data");

/**
 * Set latest ownership snapshot data date for the running pipeline run.
 * @param date the latest snapshot date
 */
export const setPipelineLatestOwnershipSnapshotData = (date: Date) =>
  setPipelineLatestData(
    "latest_snapshot_ownership_data",
    format(date, "yyyy-MM-dd"),
  );

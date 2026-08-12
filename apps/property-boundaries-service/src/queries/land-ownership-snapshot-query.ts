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

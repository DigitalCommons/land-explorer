import "dotenv/config";
import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { readdir, lstat, open, rm } from "fs/promises";
import extract from "extract-zip";
import { exec, spawn } from "child_process";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { promisify } from "util";
import { logger } from "../logger.js";
import {
  deleteAllPendingPolygons,
  getLastPipelineRun,
  setPipelineLastCouncilDownloaded,
} from "../../queries/query.js";
import { getLatestInspirePublishMonth } from "../util.js";
import axios from "axios";

// An array of different user agents for different versions of Chrome on Windows and Mac
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.0.110 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.32.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.11.0.0 Safari/537.36",
];

let downloadPath: string;
let councils: string[] = [];
let anyNewDownloads = false;

/** Download INSPIRE files using a headless playwright browser */
const downloadInspire = async (
  maxCouncils: number,
  afterCouncil: string | undefined,
) => {
  const url =
    "https://use-land-property-data.service.gov.uk/datasets/inspire/download";
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // Randomise userAgent so that we are not blocked by bot filters
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
  });
  const page = await context.newPage();
  await page.goto(url, {
    referer: "https://use-land-property-data.service.gov.uk/datasets/inspire",
  });
  await page.locator(".govuk-link").first().waitFor({ timeout: 10000 });

  const inspireDownloadLinks = await page.evaluate((afterCouncil) => {
    const inspireDownloadLinks: any[] = [];
    const pageLinks = document.getElementsByTagName("a");
    // If afterCouncil is undefined, we want to download all councils, so set matched=true
    let afterCouncilMatched = afterCouncil === undefined;
    let linkIdCount = 0;
    let totalLinksCount = 0;

    for (const link of pageLinks) {
      if (link.innerText === "Download .gml") {
        totalLinksCount++;

        if (afterCouncilMatched) {
          link.id = `download-link-${linkIdCount++}`;
          inspireDownloadLinks.push({
            id: link.id,
            council: link.href.split("/").pop().replace(".zip", ""),
          });
        }

        if (!afterCouncilMatched && link.href.includes(afterCouncil)) {
          afterCouncilMatched = true;
        }
      }
    }
    return inspireDownloadLinks;
  }, afterCouncil);

  logger.info(`Found ${inspireDownloadLinks.length} INSPIRE download links`);

  if (inspireDownloadLinks.length === 0) {
    logger.error(`Page content: ${await page.content()}`);
    throw new Error("No INSPIRE download links found.");
  }
  await browser.close();

  for (const link of inspireDownloadLinks.slice(0, maxCouncils)) {
    const council = link.council;
    const downloadFilePath = `${downloadPath}/${council}.zip`;

    if (fs.existsSync(downloadFilePath)) {
      // If zip file is already downloaded for this month, we don't need to download it again
      logger.info(
        `Skip downloading ${council}.zip since zipfile already exists`,
      );
    } else {
      logger.info(`Downloading ${council}.zip`);
      await downloadZipFile(`${url}/${council}.zip`, downloadFilePath);
      anyNewDownloads = true;
    }
    councils.push(council);
  }
};

const DOWNLOAD_ATTEMPTS = 3;
const MIN_ZIP_BYTES = 1024; // The gov.uk error page is about 9KB

/**
 * Check that a downloaded file is a zip archive and not an error page
 * or the network didn't fail during download. We are having many months
 * of failed downloads. The gov.uk website sometimes replies 200 but has
 * an error body and we're saving those in a zip then the pipeline dies
 * when it tries to process it. The network also sometimes dies and we
 * get a broken unreadable zip
 */
const assertIsCompleteZipFile = async (
  filePath: string,
  expectedBytes: number | undefined,
) => {
  const { size } = await lstat(filePath);

  // Sometimes nginx decompresses as it streams so safe check is <
  if (expectedBytes !== undefined && size < expectedBytes) {
    throw new Error(
      `download is incorrect size, got ${size} bytes but expected ${expectedBytes}`,
    );
  }
  if (size < MIN_ZIP_BYTES) {
    throw new Error(`file is only ${size} bytes, error page or truncated zip`);
  }

  const handle = await open(filePath, "r");
  try {
    const { buffer } = await handle.read(Buffer.alloc(2), 0, 2, 0);
    if (buffer.toString("latin1") !== "PK") {
      throw new Error("file doesn't start with the zip magic bytes 'PK'");
    }
  } finally {
    await handle.close();
  }
};

/**
 * Download council zip file and retry if we don't get a valid archive
 * Download to a temp file and move it once it has been checked - stops the
 *  pipeline crashing later with error HTML or truncated zips
 */
const downloadZipFile = async (url: string, outputPath: string) => {
  const partPath = `${outputPath}.part`;

  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt++) {
    try {
      await rm(partPath, { force: true });

      const jar = new CookieJar();
      const response = await wrapper(axios).get(url, {
        jar,
        withCredentials: true,
        maxRedirects: 2,
        responseType: "stream",
      });

      const contentType = String(response.headers["content-type"] ?? "");
      if (contentType.includes("html")) {
        response.data.destroy();
        throw new Error(`server returned '${contentType}' instead of a zip`);
      }
      const contentLength = Number(response.headers["content-length"]);

      const writer = fs.createWriteStream(partPath);
      await new Promise<void>((resolve, reject) => {
        response.data.on("error", reject);
        writer.on("error", reject);
        writer.on("finish", () => resolve());
        response.data.pipe(writer);
      });

      await assertIsCompleteZipFile(
        partPath,
        Number.isFinite(contentLength) ? contentLength : undefined,
      );
      fs.renameSync(partPath, outputPath);
      return;
    } catch (err) {
      await rm(partPath, { force: true });
      const reason = err?.message ?? err;

      if (attempt === DOWNLOAD_ATTEMPTS) {
        throw new Error(
          `Failed to download ${url} after ${DOWNLOAD_ATTEMPTS} attempts: ${reason}`,
        );
      }
      logger.warn(
        `Download of ${url} failed (attempt ${attempt} of ${DOWNLOAD_ATTEMPTS}): ${reason}. Retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
    }
  }
};

/**
 * Run backup script in a separate shell process to upload latest INSPIRE zip files to our Hetzner
 * storage box.
 */
const backupInspireDownloads = async () => {
  if (!process.env.REMOTE_BACKUP_DESTINATION_PATH) {
    logger.warn(
      "Skipping backup since REMOTE_BACKUP_DESTINATION_PATH is not set",
    );
    return;
  }
  const command = "bash scripts/backup-inspire-downloads.sh";
  logger.info(`Running '${command}'`);
  try {
    const { stdout, stderr } = await promisify(exec)(command, {
      maxBuffer: 64 * 1024 * 1024, // Check the backup size looks correct
    });
    logger.info(`raw INSPIRE backup script stdout: ${stdout}`);
    logger.info(`raw INSPIRE backup script stderr: ${stderr}`);
  } catch (err) {
    // Log the error if we fail to backup but don't die
    // We get a matrix notification
    logger.error(
      err,
      "INSPIRE downloads backup failed, continuing with the pipeline",
    );
  }
};

/**
 * Download the latest INSPIRE data backup from our Hetzner storage box (as zip files for each
 * council). This is useful for re-running the pipeling on the latest data after the month has
 * passed, for example if the gov Land Reg website has stopped working.
 *
 * @returns {Promise<string>} The month of the latest INSPIRE data backup
 */
const restoreLatestInspireBackup = async (): Promise<string> => {
  if (!process.env.REMOTE_BACKUP_DESTINATION_PATH) {
    logger.warn(
      "Skipping backup since REMOTE_BACKUP_DESTINATION_PATH is not set",
    );
    return null;
  }
  const command = "bash scripts/restore-latest-inspire-downloads.sh";
  logger.info(`Running '${command}'`);
  const { stdout, stderr } = await promisify(exec)(command);
  logger.info(`raw INSPIRE restore script stdout: ${stdout}`);
  logger.info(`raw INSPIRE restore script stderr: ${stderr}`);
  return stdout.trim();
};

/** Unzip an archive then delete the original archive (to save space) */
const unzipArchive = async (council: string) => {
  const zipFile = path.resolve(`${downloadPath}/${council}.zip`);
  const unzipDir = path.resolve(`${downloadPath}/${council}`);
  await rm(unzipDir, { recursive: true, force: true }); // Remove any existing unzipped files
  logger.info(`Unzip: ${council}.zip`);
  await extract(zipFile, {
    dir: unzipDir,
  });
  await rm(zipFile, { force: true }); // Remove zip file
};

/**
 * Run the script to transform and insert data from a council's GML file into the
 * pending_inspire_polygons DB table.
 */
const gmlToPendingInspirePolygons = async (council: string) => {
  const downloadFolderPath = `${downloadPath}/${council}`;
  const stat = await lstat(downloadFolderPath);

  if (stat.isDirectory()) {
    const files = await readdir(downloadFolderPath);
    if (files.includes("Land_Registry_Cadastral_Parcels.gml")) {
      logger.info(`Transform GML and insert into DB: ${council}`);
      const gmlFile = `${downloadFolderPath}/Land_Registry_Cadastral_Parcels.gml`;

      await new Promise<void>((resolve, reject) => {
        const ls = spawn("bash", [
          "scripts/gml-to-pending-inspire-polygons.sh",
          gmlFile,
          council,
        ]);

        ls.stdout.on("data", (data) => {
          logger.info(`${data}`);
        });

        ls.stderr.on("data", (data) => {
          logger.error(`${data}`);
        });

        ls.on("close", (code) => {
          if (code == 0) {
            resolve();
          } else {
            reject(
              `spawn exited with code ${code} when transforming GML for ${council}`,
            );
          }
        });
      });

      // const { stdout, stderr } = await promisify(exec)(
      //   `bash scripts/gml-to-pending-inspire-polygons.sh ${gmlFile} ${council}`,
      //   {
      //     maxBuffer: 1024 * 1024 * 1024, // 1 GB should be enough to handle any council
      //   }
      // );
      // logger.info(
      //   `raw gml-to-pending-inspire-polygons script stdout: ${stdout}`
      // );
      // logger.info(
      //   `raw gml-to-pending-inspire-polygons script stderr: ${stderr}`
      // );

      await setPipelineLastCouncilDownloaded(council);

      // Remove download folder to save space
      await rm(downloadFolderPath, { recursive: true, force: true });
    } else {
      throw new Error(`Download for ${council} didn't contain a GML file`);
    }
  } else {
    throw new Error(`${downloadFolderPath} is not a directory`);
  }
};

/**
 * Download the latest INSPIRE data and upload it to our remote backup location. Then, unzip the
 * archive for each council and transform each of the GML files and insert the data into the
 * 'pending_inspire_polygons' table in the DB, ready for analysis.
 */
export const downloadAndBackupInspirePolygons = async (options: any) => {
  const afterCouncil: string | undefined = options.resume
    ? (await getLastPipelineRun())?.last_council_downloaded || undefined
    : options.afterCouncil;
  // Download the data for the first <maxCouncils> councils after <afterCouncil>. Default to all.
  const maxCouncils: number = options.maxCouncils || 1e4;

  const inspireDataMonth = options.inspireDataRestore
    ? await restoreLatestInspireBackup()
    : getLatestInspirePublishMonth();

  downloadPath = path.resolve("./downloads", inspireDataMonth);
  fs.mkdirSync(downloadPath, { recursive: true });

  // delete old files in the downloads folder
  const oldDownloadsFolders = fs
    .readdirSync("./downloads")
    .filter((folderName) => folderName !== inspireDataMonth);
  for (const folder of oldDownloadsFolders) {
    fs.rmSync(path.resolve("./downloads", folder), {
      recursive: true,
      force: true,
    });
  }

  if (!options.resume) {
    // delete pending polygons in the database before we start downloading new data, to ensure there
    // is disk space
    logger.info("Deleting all pending polygons in the database");
    await deleteAllPendingPolygons();
  }

  if (options.inspireDataRestore) {
    // Set councils to list of filenames in the download folder

    councils = fs
      .readdirSync(downloadPath)
      .filter((file) => file.endsWith(".zip"))
      .map((file) => file.replace(".zip", ""));
  } else {
    logger.info(
      `Download ${inspireDataMonth} INSPIRE data ` +
        (afterCouncil ? `after council ${afterCouncil}` : "for all councils"),
    );

    councils = [];

    // Download INSPIRE data from govt website
    await downloadInspire(maxCouncils, afterCouncil);

    // If new files were downloaded, back them up
    if (anyNewDownloads) {
      await backupInspireDownloads();
    }
  }

  // Unzip and transform all new downloads
  // Keep each council independent so one bad archive doesn't throw away the
  // rest of the run
  const failedCouncils: string[] = [];
  for (const council of councils) {
    try {
      await unzipArchive(council);
      await gmlToPendingInspirePolygons(council);
    } catch (err) {
      failedCouncils.push(council);
      logger.error(err, `Failed to process ${council}, skipping it`);
      // Delete the download so a later run fetches it
      // Otherwise we think this month is complete
      await rm(path.resolve(`${downloadPath}/${council}`), {
        recursive: true,
        force: true,
      });
      await rm(path.resolve(`${downloadPath}/${council}.zip`), { force: true });
    }
  }

  if (failedCouncils.length === councils.length && councils.length > 0) {
    throw new Error(
      `Failed to process all ${councils.length} councils, so something is broken`,
    );
  }
  if (failedCouncils.length > 0) {
    logger.warn(
      `Failed to process ${failedCouncils.length} of ${councils.length} councils: ${failedCouncils.join(", ")}`,
    );
  }

  logger.info(
    "Downloaded, transformed, and created all pending INSPIRE polygons in DB",
  );
};

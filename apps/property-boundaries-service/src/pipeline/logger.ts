import fs from "node:fs";
import pino from "pino";

export let logger: pino.Logger;

export const initLogger = (pipelineKey?: string) => {
  const logToStdout =
    process.env.NODE_ENV === "development" || !pipelineKey;
  // pino.destination doesn't create the directory, and a fresh checkout or
  // container doesn't have it - without this every pipeline run crashes here
  if (!logToStdout) fs.mkdirSync("logs", { recursive: true });
  logger = pino(
    {
      level: process.env.LOG_LEVEL ?? "info",
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
        bindings: () => ({}), // don't need to include PID or hostname
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.destination({
      dest: logToStdout
        ? 1 // log to stdout
        : `logs/${new Date().toISOString().split(".")[0]}_${pipelineKey}.log`,
      sync: true,
      mode: 0o600, // read/write by app user only
    })
  );

  logger.info(`Logger initialised`);
};

initLogger();

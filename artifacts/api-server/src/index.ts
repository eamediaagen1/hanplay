import app from "./app";
import { logger } from "./lib/logger";
import { runMigration006IfNeeded, runMigration007IfNeeded, runMigration012IfNeeded } from "./lib/migrate.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Best-effort: auto-apply DB migrations if tables are missing
  runMigration006IfNeeded().catch((e) => {
    logger.error({ err: e }, "Migration 006 check failed");
  });

  runMigration007IfNeeded().catch((e) => {
    logger.error({ err: e }, "Migration 007 check failed");
  });

  runMigration012IfNeeded().catch((e) => {
    logger.error({ err: e }, "Migration 012 check failed");
  });
});

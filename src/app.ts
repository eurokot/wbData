import express from "express";
import schedule from "node-schedule";
import boxesTable from "#postgres/models/boxes.js";
import { migrate, seed } from "#postgres/knex.js";
import env from "#config/env/env.js";
import loadJob from "#utils/loadJob.js";

import createLogger from "#libraries/logger.js";
const logger = createLogger("App");

const app = express();
const PORT = env.APP_PORT ?? 5000;

async function run() {
  try {
    await boxesTable();
    await migrate.latest();
    await seed.run();

    logger.info("All migrations and seeds have been run");

    for (const [job, time] of Object.entries(env.SCHEDULE)) {
      if (time !== "* * * * *") {
        const jobFunc = await loadJob(job);

        if (!jobFunc) continue;

        schedule.scheduleJob(time, jobFunc);
        logger.info(`Scheduled ${job} to run: ${time}`);
      }
    }

    app.listen(PORT, () => {
      logger.info(`Server up on ${PORT}`);
    });
  } catch (err) {
    logger.error(`Something going wrong: \n ${err}`);
  }
}

run();

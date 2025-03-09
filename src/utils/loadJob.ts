import createLogger from "#libraries/logger.js";
const logger = createLogger("Load Job");

export default async function loadJob(
  job: string,
): Promise<(() => void) | undefined> {
  try {
    const jobModule = await import(`#jobs/job-${job}.js`);
    return jobModule.default as () => void;
  } catch (err) {
    logger.warn(`Cannot find module ${job}`);
    return undefined;
  }
}

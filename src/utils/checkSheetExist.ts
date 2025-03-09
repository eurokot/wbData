import createLogger from "#libraries/logger.js";
import { sheets_v4 } from "googleapis";
const logger = createLogger("Check Sheet Exist");

export default async function checkSheetExist(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
): Promise<void> {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties",
    });

    const sheetsList = response.data.sheets || [];
    const sheetExists = sheetsList.some(
      (sheet) => sheet.properties?.title === "stocks_coefs",
    );

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "stocks_coefs",
                },
              },
            },
          ],
        },
      });
      logger.info(`Sheet stocks_coefs created in table ${spreadsheetId}`);
    }
  } catch (err) {
    logger.error(`Error checking/creating sheet in ${spreadsheetId}: ${err}`);
    throw err;
  }
}

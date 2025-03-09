import env from "#config/env/env.js";
import { google } from "googleapis";
import knex from "#postgres/knex.js";

import checkSheetExist from "#utils/checkSheetExist.js";
import createLogger from "#libraries/logger.js";
const logger = createLogger("Google Sheets");

export default async function uploadSheets(): Promise<void> {
  logger.info(
    "Start the process of collecting data to load into the Google Sheets",
  );

  if (!env.GOOGLE_API_KEYS) {
    logger.warn(
      `Google Sheets API KEYS not specified in .env . Google Sheets upload skipped`,
    );
    return;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: env.GOOGLE_API_KEYS,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  if (!env.GOOGLE_SHEETS_IDS.length) {
    logger.warn(
      `Google Sheets IDS not specified in .env . Google Sheets upload skipped`,
    );
    return;
  }

  try {
    const allData = await knex("boxes")
      .select(
        "date",
        "warehouse_name",
        "box_delivery_and_storage_expr",
        "box_delivery_base",
        "box_delivery_liter",
        "box_storage_base",
        "box_storage_liter",
      )
      .orderBy("box_delivery_base", "asc");

    const values = [
      [
        "Date",
        "Warehouse Name",
        "Delivery and Storage Expr",
        "Delivery Base",
        "Delivery Liter",
        "Storage Base",
        "Storage Liter",
      ],
      ...allData.map((row) => [
        row.date,
        row.warehouse_name,
        row.box_delivery_and_storage_expr,
        row.box_delivery_base,
        row.box_delivery_liter,
        row.box_storage_base,
        row.box_storage_liter,
      ]),
    ];

    for (const sheetId of env.GOOGLE_SHEETS_IDS) {
      // Проверяем, существует ли лист с названием "stocks_coefs" в таблице
      await checkSheetExist(sheets, sheetId);

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "stocks_coefs!A1",
        valueInputOption: "RAW",
        requestBody: { values },
      });

      logger.info(
        `Data is uploaded to Google Sheets ${sheetId} on the stocks_coefs sheet`,
      );
    }
  } catch (err) {
    logger.error(`Error in upload sheets: \n${err}`);
    return;
  }
}

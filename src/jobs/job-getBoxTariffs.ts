import moment from "moment";
import axios from "axios";
import knex from "#postgres/knex.js";
import env from "#config/env/env.js";

import uploadSheets from "#utils/sheets.js";
import createLogger from "#libraries/logger.js";
const logger = createLogger("getBoxTariffs");

interface WarehouseTariff {
  boxDeliveryAndStorageExpr: string;
  boxDeliveryBase: string;
  boxDeliveryLiter: string;
  boxStorageBase: string;
  boxStorageLiter: string;
  warehouseName: string;
}

interface ApiResponse {
  response: {
    data: {
      dtNextBox: string;
      dtTillMax: string;
      warehouseList: WarehouseTariff[];
    };
  };
}

export default async function getBoxTariffs(): Promise<void> {
  try {
    if (!env.WB_API_KEY) {
      logger.warn(`WB_API_KEY not specified in .env. Job skipped`);
      return;
    }

    const today = moment().format("YYYY-MM-DD");

    const response = await axios.get<ApiResponse>("https://common-api.wildberries.ru/api/v1/tariffs/box", {
      headers: { Authorization: `Bearer ${env.WB_API_KEY}` },
      params: { date: today },
    });

    const apiData = response?.data?.response?.data;

    if (!apiData || !Array.isArray(apiData.warehouseList)) {
      throw new Error("Bad API response");
    }

    const tariffs = apiData.warehouseList;

    await knex.transaction(async (trx) => {
      await trx("boxes").where("date", today).del();

      const tariffRows = tariffs.map((tariff) => ({
        date: today,
        warehouse_name: tariff.warehouseName,
        box_delivery_and_storage_expr: tariff.boxDeliveryAndStorageExpr,
        box_delivery_base: parseFloat(tariff.boxDeliveryBase.replace(",", ".")),
        box_delivery_liter: parseFloat(
          tariff.boxDeliveryLiter.replace(",", "."),
        ),
        box_storage_base:
          tariff.boxStorageBase === "-"
            ? 0
            : parseFloat(tariff.boxStorageBase.replace(",", ".")),
        box_storage_liter:
          tariff.boxStorageLiter === "-"
            ? 0
            : parseFloat(tariff.boxStorageLiter.replace(",", ".")),
      }));

      await trx("boxes").insert(tariffRows);
    });

    logger.info(
      `Tariff data for ${today} are updated in the boxes table (${tariffs.length} entries)`,
    );

    await uploadSheets();
  } catch (err) {
    logger.error(`Error in job getBoxTariffs: \n${err}`);
    return;
  }
}

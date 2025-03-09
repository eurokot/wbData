import knex from "#postgres/knex.js";
import createLogger from "#libraries/logger.js";
const logger = createLogger("Models");

export default async function boxesTable() {
  const hasTable = await knex.schema.hasTable("boxes");

  if (hasTable) return;

  await knex.schema.createTable("boxes", (table) => {
    table.increments("id").primary();
    table.date("date").notNullable();
    table.string("warehouse_name").notNullable();
    table.string("box_delivery_and_storage_expr").notNullable();
    table.decimal("box_delivery_base", 10, 2).notNullable();
    table.decimal("box_delivery_liter", 10, 2).notNullable();
    table.decimal("box_storage_base", 10, 2).notNullable();
    table.decimal("box_storage_liter", 10, 2).notNullable();
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.unique(["date", "warehouse_name"]);
  });

  logger.info(`Table boxes created`);
}

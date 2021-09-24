import { Database, SQLite3Connector } from "https://deno.land/x/denodb/mod.ts";
import { DATA_PATH } from "./utils/constants.ts";

const dbConnector = new SQLite3Connector({
  filepath: DATA_PATH,
});

const db = new Database(dbConnector);

export default db;

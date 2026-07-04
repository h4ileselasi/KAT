const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { Client } = require("pg");

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const r = await c.query("DELETE FROM prayer_wall WHERE intention LIKE 'TEST:%'");
  console.log("Deleted test rows:", r.rowCount);
  const cnt = await c.query("SELECT count(*) AS n FROM prayer_wall");
  console.log("Prayers remaining:", cnt.rows[0].n);
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

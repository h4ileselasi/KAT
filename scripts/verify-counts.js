const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { Client } = require("pg");

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const leftover = await c.query("SELECT count(*) AS n FROM announcements WHERE title LIKE 'ADMIN TEST%'");
  const t = await c.query(
    "SELECT (SELECT count(*) FROM announcements) AS announcements, (SELECT count(*) FROM events) AS events, (SELECT count(*) FROM products) AS products, (SELECT count(*) FROM prayer_wall) AS prayers"
  );
  console.log("Leftover test rows:", leftover.rows[0].n);
  console.log("Counts:", JSON.stringify(t.rows[0]));
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

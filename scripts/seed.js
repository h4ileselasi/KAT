/**
 * Seeds the database with starter content so the app isn't empty.
 * Safe to re-run: clears the seeded tables first, then inserts.
 *
 * Run:  node scripts/seed.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });
const { Client } = require("pg");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("❌ DATABASE_URL missing from .env.local (see migrate.js note).");
  process.exit(1);
}

const announcements = [
  {
    title: "Feast of St. Catherine — Novena Begins",
    body: "Join us for nine evenings of prayer starting Monday at 6:00 PM in the main sanctuary. All are welcome.",
    image_url: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=900&q=70&auto=format&fit=crop",
    pinned: true,
  },
  {
    title: "Youth Choir Auditions",
    body: "Calling all voices! Auditions this Saturday after the 8 AM Mass. Bring your joy.",
    image_url: null,
    pinned: false,
  },
  {
    title: "Harvest Thanksgiving — Save the Date",
    body: "Our annual Harvest is set for the last Sunday of the month. Pledge cards available at the parish office.",
    image_url: "https://images.unsplash.com/photo-1509909756405-be0199881695?w=900&q=70&auto=format&fit=crop",
    pinned: false,
  },
];

const events = [
  { title: "Adoration & Benediction", day: "Fri", date: "Jul 4", time: "5:00 PM", location: "Blessed Sacrament Chapel", image_url: null },
  { title: "Parish Family Picnic", day: "Sat", date: "Jul 12", time: "12:00 PM", location: "Church Grounds", image_url: null },
  { title: "Catechism Classes Resume", day: "Sun", date: "Jul 13", time: "10:30 AM", location: "Parish Hall", image_url: null },
];

const products = [
  { name: "St. Catherine Rosary (Blessed)", price: 45, image_url: "https://images.unsplash.com/photo-1543348750-466b55f32f16?w=700&q=70&auto=format&fit=crop", tag: "Bestseller" },
  { name: "Parish Anniversary Tee", price: 80, image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&q=70&auto=format&fit=crop", tag: null },
  { name: "Devotional Candle Set", price: 30, image_url: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=700&q=70&auto=format&fit=crop", tag: null },
  { name: "Holy Water Bottle", price: 15, image_url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=700&q=70&auto=format&fit=crop", tag: "New" },
];

const prayers = [
  { intention: "For my mother's healing and speedy recovery. May God's mercy surround her.", name: "Anonymous", candles: 24 },
  { intention: "Thanksgiving for a successful surgery. God is faithful. 🙏", name: "A grateful parishioner", candles: 57 },
  { intention: "For my son writing his final exams this week — wisdom and calm.", name: "Anonymous", candles: 41 },
];

async function main() {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("→ Connected. Seeding…");

  // Clear (fresh start), then insert
  await client.query("TRUNCATE announcements, events, products, prayer_wall RESTART IDENTITY;");

  for (const a of announcements) {
    await client.query(
      "INSERT INTO announcements (title, body, image_url, pinned) VALUES ($1,$2,$3,$4)",
      [a.title, a.body, a.image_url, a.pinned]
    );
  }
  for (const e of events) {
    await client.query(
      "INSERT INTO events (title, day, date, time, location, image_url) VALUES ($1,$2,$3,$4,$5,$6)",
      [e.title, e.day, e.date, e.time, e.location, e.image_url]
    );
  }
  for (const p of products) {
    await client.query(
      "INSERT INTO products (name, price, image_url, tag) VALUES ($1,$2,$3,$4)",
      [p.name, p.price, p.image_url, p.tag]
    );
  }
  for (const pr of prayers) {
    await client.query(
      "INSERT INTO prayer_wall (intention, name, candles) VALUES ($1,$2,$3)",
      [pr.intention, pr.name, pr.candles]
    );
  }

  console.log(
    `✅ Seeded: ${announcements.length} announcements, ${events.length} events, ${products.length} products, ${prayers.length} prayers.`
  );
  await client.end();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});

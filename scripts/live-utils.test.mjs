import { test } from "node:test";
import assert from "node:assert/strict";
import { extractYouTubeId, nextServiceOccurrence, formatCountdown } from "../lib/live-utils.ts";

test("extractYouTubeId handles all URL shapes", () => {
  assert.equal(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://www.youtube.com/live/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(extractYouTubeId("https://vimeo.com/12345"), null);
  assert.equal(extractYouTubeId(""), null);
  assert.equal(extractYouTubeId(null), null);
});

test("nextServiceOccurrence picks the soonest future service", () => {
  // Tue 2026-07-14 10:00 local
  const now = new Date(2026, 6, 14, 10, 0, 0);
  const schedule = [
    { day: 0, time: "09:00", label: "Sunday Holy Mass" },
    { day: 5, time: "18:30", label: "Friday Adoration" },
  ];
  const next = nextServiceOccurrence(schedule, now);
  assert.equal(next.label, "Friday Adoration");
  assert.equal(next.at.getDay(), 5);
  assert.equal(next.at.getHours(), 18);
  assert.equal(next.at.getMinutes(), 30);
  assert.ok(next.at > now);
});

test("nextServiceOccurrence rolls same-day past time to next week", () => {
  // Sunday 2026-07-12 10:00 — 09:00 Mass already passed
  const now = new Date(2026, 6, 12, 10, 0, 0);
  const next = nextServiceOccurrence([{ day: 0, time: "09:00", label: "Mass" }], now);
  assert.equal(next.at.getDate(), 19); // next Sunday
});

test("nextServiceOccurrence handles empty/invalid input", () => {
  const now = new Date();
  assert.equal(nextServiceOccurrence([], now), null);
  assert.equal(nextServiceOccurrence(null, now), null);
  assert.equal(nextServiceOccurrence([{ day: 9, time: "xx", label: "bad" }], now), null);
});

test("formatCountdown tiers", () => {
  assert.equal(formatCountdown((2 * 86400 + 14 * 3600 + 3 * 60) * 1000), "2d 14h 03m");
  assert.equal(formatCountdown((14 * 3600 + 3 * 60 + 22) * 1000), "14h 03m 22s");
  assert.equal(formatCountdown((3 * 60 + 22) * 1000), "03m 22s");
  assert.equal(formatCountdown(-5000), "00m 00s");
});

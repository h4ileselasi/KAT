/* Converts the church's HEIC interior photo to web JPGs and stages the logo.
   Run: node scripts/convert-assets.js */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const heicConvert = require("heic-convert");

const DL = "C:\\Users\\HP\\Downloads";
const OUT_DESIGN = "C:\\Users\\HP\\Desktop\\church-designs\\assets";
const OUT_PUBLIC = path.join(__dirname, "..", "public", "brand");

for (const d of [OUT_DESIGN, OUT_PUBLIC]) fs.mkdirSync(d, { recursive: true });

async function main() {
  // Logo: just copy the PNG to both places
  const logoSrc = path.join(DL, "IMG_0445.PNG");
  for (const d of [OUT_DESIGN, OUT_PUBLIC]) {
    fs.copyFileSync(logoSrc, path.join(d, "logo.png"));
  }
  console.log("✓ logo.png staged");

  // Interior: HEIC → JPEG buffer via pure-JS decoder, then resize with sharp.
  const heic = path.join(DL, "IMG_1588.HEIC");
  console.log("Decoding HEIC (this can take ~10s)…");
  const jpegBuffer = await heicConvert({
    buffer: fs.readFileSync(heic),
    format: "JPEG",
    quality: 0.92,
  });

  for (const d of [OUT_DESIGN, OUT_PUBLIC]) {
    await sharp(jpegBuffer)
      .rotate()
      .resize(1600, null, { withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(d, "interior.jpg"));
  }
  console.log("✓ interior.jpg written (1600w) to both locations");
}

main().catch((e) => {
  console.error("SHARP_FAILED:", e.message);
  process.exit(2);
});

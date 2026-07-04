/* Tight-crops the logo and stages the 4 story icons.
   Run: node scripts/process-icons.js */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DL = "C:\\Users\\HP\\Downloads";
const PUBLIC_BRAND = path.join(__dirname, "..", "public", "brand");
const PUBLIC_ICONS = path.join(__dirname, "..", "public", "icons");
const DESIGN = "C:\\Users\\HP\\Desktop\\church-designs\\assets";
for (const d of [PUBLIC_BRAND, PUBLIC_ICONS, DESIGN]) fs.mkdirSync(d, { recursive: true });

async function main() {
  // 1) Logo: tight-crop to the circular seal with a TRANSPARENT background.
  // Previous version flattened onto solid white before trimming, so the
  // exported PNG carried a hard white square behind the circle — visible as
  // a mismatched "box" on the cream page background, and glaringly wrong in
  // dark mode. Fix: find the crop box using a flattened *copy* (only for
  // geometry), then apply that same crop to the ORIGINAL image so alpha is
  // preserved, and finally clip to a perfect circle via a dest-in mask so
  // anything outside the seal is transparent regardless of what the source
  // file actually had baked in around it.
  const logoSrc = path.join(DL, "IMG_0445.PNG");

  const { info } = await sharp(logoSrc)
    .flatten({ background: "#ffffff" })
    .trim({ threshold: 12 })
    .toBuffer({ resolveWithObject: true });
  const { width, height, trimOffsetLeft = 0, trimOffsetTop = 0 } = info;

  const croppedAlpha = await sharp(logoSrc)
    .extract({
      left: Math.max(0, -trimOffsetLeft),
      top: Math.max(0, -trimOffsetTop),
      width,
      height,
    })
    .ensureAlpha()
    .toBuffer();

  const dim = Math.max(width, height);
  const squared = await sharp(croppedAlpha)
    .resize(dim, dim, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const circleMask = Buffer.from(
    `<svg width="${dim}" height="${dim}"><circle cx="${dim / 2}" cy="${dim / 2}" r="${dim / 2}" fill="#fff"/></svg>`
  );

  const finalLogo = await sharp(squared)
    .composite([{ input: circleMask, blend: "dest-in" }])
    .resize(512, 512)
    .png()
    .toBuffer();

  for (const out of [path.join(PUBLIC_BRAND, "logo.png"), path.join(DESIGN, "logo.png")]) {
    fs.writeFileSync(out, finalLogo);
  }
  const m = await sharp(path.join(PUBLIC_BRAND, "logo.png")).metadata();
  console.log("✓ logo cropped (transparent bg) →", m.width + "x" + m.height, "hasAlpha:", m.hasAlpha);

  // 2) Icons: trim, produce brand-colorable MASK pngs (alpha = icon shape)
  const icons = [
    { src: "News.png", out: "news.png" },
    { src: "prayer.png", out: "prayer.png" },
    { src: "Event.png", out: "events.png" },
    { src: "gallery.png", out: "gallery.png" },
  ];
  for (const ic of icons) {
    const base = sharp(path.join(DL, ic.src)).flatten({ background: "#ffffff" }).trim({ threshold: 12 });
    // greyscale → negate so the dark icon becomes white (255) and white bg becomes 0.
    // That single channel is used as the ALPHA of a transparent PNG → a clean mask.
    const { data, info } = await base
      .clone()
      .resize(128, 128, { fit: "contain", background: "#ffffff" })
      .greyscale()
      .negate()
      .raw()
      .toBuffer({ resolveWithObject: true });
    // data has info.channels channels; take channel 0 as alpha
    const w = info.width, h = info.height, ch = info.channels;
    const alpha = Buffer.alloc(w * h);
    for (let i = 0; i < w * h; i++) alpha[i] = data[i * ch];
    // build black RGB + our alpha → mask png (color irrelevant; CSS mask uses alpha)
    await sharp({ create: { width: w, height: h, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .joinChannel(alpha, { raw: { width: w, height: h, channels: 1 } })
      .png()
      .toFile(path.join(PUBLIC_ICONS, ic.out));
  }
  console.log("✓ 4 mask icons written to public/icons/");
}
main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });

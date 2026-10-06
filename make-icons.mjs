import sharp from "sharp";

const src =
  "https://cbfwattzctamumezvreo.supabase.co/storage/v1/object/public/product-images/moon%20logo/logo.png";

const res = await fetch(src);
if (!res.ok) throw new Error(`Could not download logo: ${res.status}`);
const buf = Buffer.from(await res.arrayBuffer());

for (const size of [192, 512]) {
  const inner = Math.round(size * 0.72); // padding around the logo

  const logo = await sharp(buf)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: "#FFF4E6" },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(`public/icon-${size}.png`);

  console.log(`Made public/icon-${size}.png`);
}
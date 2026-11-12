// Renders public/logo.svg into the app icons (needs Playwright's Chromium).
// Usage: node scripts/make_icons.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PUB = path.join(__dirname, '..', 'public');
const svg = fs.readFileSync(path.join(PUB, 'logo.svg'), 'utf8');
const BG = '#1c0f33';

// [file, size, logo scale, rounded background?]
const ICONS = [
  ['icon-192.png', 192, 0.86, true],
  ['icon-512.png', 512, 0.86, true],
  // Maskable: launchers crop to a circle or squircle, so keep the logo in the inner 70%.
  ['icon-maskable-512.png', 512, 0.66, false],
  ['apple-touch-icon.png', 180, 0.82, false],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [file, size, scale, rounded] of ICONS) {
    const logo = Math.round(size * scale);
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:transparent">
      <div style="width:${size}px;height:${size}px;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%, #3a2266, ${BG} 72%);${rounded ? `border-radius:${size * 0.22}px;` : ''}">
        <div style="width:${logo}px;height:${logo}px">${svg.replace('<svg ', `<svg width="${logo}" height="${logo}" `)}</div>
      </div></body></html>`);
    await page.screenshot({ path: path.join(PUB, file), omitBackground: true });
    console.log('wrote', file);
  }
  await browser.close();
})();

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// 1. Grid definition for bold letter "S" (16x16 pixels)
const S_GRID = [
  "................",
  "................",
  "....11111111....",
  "...1111111111...",
  "...11......11...",
  "...11...........",
  "...11111111.....",
  "....111111111...",
  "..........1111..",
  "............11..",
  "...11.......11..",
  "...11......111..",
  "...1111111111...",
  "....11111111....",
  "................",
  "................"
];

// Helper to write PNG of specific size
function generatePNG(filename, size) {
  const png = new PNG({ width: size, height: size });

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Map pixel to 16x16 grid coordinate
      const gridX = Math.floor((x / size) * 16);
      const gridY = Math.floor((y / size) * 16);

      const isWhite = S_GRID[gridY] && S_GRID[gridY][gridX] === '1';

      if (isWhite) {
        png.data[idx] = 255;     // Red
        png.data[idx + 1] = 255; // Green
        png.data[idx + 2] = 255; // Blue
        png.data[idx + 3] = 255; // Alpha
      } else {
        png.data[idx] = 17;      // Red
        png.data[idx + 1] = 17;  // Green
        png.data[idx + 2] = 17;  // Blue
        png.data[idx + 3] = 255; // Alpha
      }
    }
  }

  const outputPath = path.join(PUBLIC_DIR, filename);
  png.pack().pipe(fs.createWriteStream(outputPath));
  console.log(`Generated PNG: ${filename} (${size}x${size})`);
}

// 2. SVG Logo definitions
const SVG_CONTENT = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" fill="#111111"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="310" fill="#FFFFFF">S</text>
</svg>`;

function main() {
  console.log('Generating Spendly PWA graphics assets...');

  // Ensure public folder exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR);
  }

  // Write SVGs
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), SVG_CONTENT);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'icon.svg'), SVG_CONTENT);
  console.log('Generated SVG assets: favicon.svg, icon.svg');

  // Write PNG sizes
  generatePNG('favicon.png', 32);
  generatePNG('icon.png', 512);
  generatePNG('icon-192.png', 192);
  generatePNG('icon-512.png', 512);
  generatePNG('apple-touch-icon.png', 180);
  generatePNG('android-icon-foreground.png', 512);
  generatePNG('android-icon-background.png', 512);
  generatePNG('android-icon-monochrome.png', 512);
  generatePNG('splash-icon.png', 512);

  console.log('Assets generation successfully completed!');
}

main();

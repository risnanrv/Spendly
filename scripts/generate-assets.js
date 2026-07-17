const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Geometric Monochrome SVG Logo
const SVG_CONTENT = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Base premium black rounded square -->
  <rect width="512" height="512" rx="128" fill="#111111"/>
  <!-- Abstract geometric ribbon representing financial flow / letter "S" -->
  <path d="M 192,128 H 384 V 192 H 288 L 192,288 V 384 H 128 V 320 H 224 L 320,224 V 128 Z" fill="#FFFFFF"/>
</svg>`;

// Helper function to check if coordinate (nx, ny) in 512x512 canvas is inside the geometric logo
function isInsideLogoRibbon(nx, ny) {
  // 1. Top horizontal bar
  if (ny >= 128 && ny <= 192 && nx >= 192 && nx <= 384) {
    return true;
  }
  // 2. Bottom horizontal bar
  if (ny >= 320 && ny <= 384 && nx >= 128 && nx <= 320) {
    return true;
  }
  // 3. Right vertical block
  if (nx >= 320 && nx <= 384 && ny >= 128 && ny <= 224) {
    return true;
  }
  // 4. Left vertical block
  if (nx >= 128 && nx <= 192 && ny >= 288 && ny <= 384) {
    return true;
  }
  // 5. Diagonal ribbon strip
  if (nx >= 192 && nx <= 320 && ny >= 192 && ny <= 320) {
    const sum = nx + ny;
    if (sum >= 480 && sum <= 544) {
      return true;
    }
  }
  return false;
}

// Generate pixel-perfect PNG with math rendering
function generatePNG(filename, size) {
  const png = new PNG({ width: size, height: size });

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Scale coordinates to 512x512 model
      const nx = (x / size) * 512;
      const ny = (y / size) * 512;

      const isWhite = isInsideLogoRibbon(nx, ny);

      if (isWhite) {
        png.data[idx] = 255;     // R
        png.data[idx + 1] = 255; // G
        png.data[idx + 2] = 255; // B
        png.data[idx + 3] = 255; // A
      } else {
        png.data[idx] = 17;      // R (0x11)
        png.data[idx + 1] = 17;  // G (0x11)
        png.data[idx + 2] = 17;  // B (0x11)
        png.data[idx + 3] = 255; // A
      }
    }
  }

  const outputPath = path.join(PUBLIC_DIR, filename);
  png.pack().pipe(fs.createWriteStream(outputPath));
  console.log(`Generated PNG: ${filename} (${size}x${size})`);
}

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

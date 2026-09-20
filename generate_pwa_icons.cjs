const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createStyleAiPng(size, isAppleTouch = false) {
  const width = size;
  const height = size;
  
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  
  const cx = width / 2;
  const cy = height / 2;
  const cornerRadius = isAppleTouch ? 0 : width * 0.22; // Apple touch icon must have square solid edges; iOS rounds it

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None
    
    for (let x = 0; x < width; x++) {
      let isInside = true;
      if (!isAppleTouch) {
        const dx = Math.max(0, Math.abs(x - cx) - (cx - cornerRadius));
        const dy = Math.max(0, Math.abs(y - cy) - (cy - cornerRadius));
        isInside = (dx * dx + dy * dy) <= (cornerRadius * cornerRadius);
      }
      
      if (isInside) {
        const distCenter = Math.sqrt((x - cx)*(x - cx) + (y - cy)*(y - cy));
        const relY = y / height;
        
        // Deep purple to dark violet gradient: #7c3aed to #1e1035
        let r = Math.round(124 * (1 - relY) + 30 * relY);
        let g = Math.round(58 * (1 - relY) + 16 * relY);
        let b = Math.round(237 * (1 - relY) + 53 * relY);
        let a = 255;
        
        // Center subtle glow
        if (distCenter < width * 0.4) {
          const glow = 1 - (distCenter / (width * 0.4));
          r = Math.min(255, Math.round(r + 60 * glow));
          g = Math.min(255, Math.round(g + 50 * glow));
          b = Math.min(255, Math.round(b + 30 * glow));
        }

        // Draw Stylized "S" / Hanger / Sparkle in the center
        const fx = x / width;
        const fy = y / height;

        // Top arc of S
        const topArc = (fx >= 0.35 && fx <= 0.65 && fy >= 0.28 && fy <= 0.36) ||
                       (fx >= 0.32 && fx <= 0.42 && fy >= 0.32 && fy <= 0.48) ||
                       // Middle bar of S
                       (fx >= 0.35 && fx <= 0.65 && fy >= 0.46 && fy <= 0.54) ||
                       // Bottom arc of S
                       (fx >= 0.58 && fx <= 0.68 && fy >= 0.52 && fy <= 0.68) ||
                       (fx >= 0.35 && fx <= 0.65 && fy >= 0.64 && fy <= 0.72);

        // Sparkle star at top right
        const dxStar = Math.abs(fx - 0.72);
        const dyStar = Math.abs(fy - 0.26);
        const isSparkle = (dxStar < 0.025 && dyStar < 0.08) || (dyStar < 0.025 && dxStar < 0.08);

        if (topArc || isSparkle) {
          r = 255;
          g = 255;
          b = 255;
          a = 255;
        }

        rawData[offset++] = r;
        rawData[offset++] = g;
        rawData[offset++] = b;
        rawData[offset++] = a;
      } else {
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
        rawData[offset++] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  
  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4);
  data.copy(chunk, 8);
  
  const crc = crc32(chunk.slice(4, 8 + len));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
    }
  }
  return (c ^ 0xffffffff) | 0;
}

const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

fs.writeFileSync(path.join(iconsDir, 'pwa-192x192.png'), createStyleAiPng(192, false));
fs.writeFileSync(path.join(iconsDir, 'pwa-512x512.png'), createStyleAiPng(512, false));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon-180x180.png'), createStyleAiPng(180, true));

// Also SVG favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="24" fill="#7c3aed"/>
  <text x="50" y="65" font-family="-apple-system, sans-serif" font-size="52" font-weight="bold" fill="white" text-anchor="middle">👗</text>
</svg>`;
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), svgContent);
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.svg'), svgContent);

console.log('✅ StyleAI PWA icons & favicon created successfully in public/icons/');

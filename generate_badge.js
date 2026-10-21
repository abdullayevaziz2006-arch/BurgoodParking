const sharp = require('./backend/node_modules/sharp');
const fs = require('fs');

async function generateBadge() {
  // Read trimmed burgood logo
  const logoBuffer = await sharp('frontend/src/assets/burgood-logo.png')
    .resize(130, 95, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
    
  const logoBase64 = logoBuffer.toString('base64');
  
  // Create 256x256 SVG badge matching user reference image
  const svgBadge = `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0e1a38" />
          <stop offset="100%" stop-color="#050a16" />
        </linearGradient>
        <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0084ff" />
          <stop offset="100%" stop-color="#005bb5" />
        </linearGradient>
      </defs>
      <!-- Rounded square container -->
      <rect x="8" y="8" width="240" height="240" rx="54" ry="54" fill="url(#bgGrad)" stroke="url(#borderGrad)" stroke-width="4" />
      
      <!-- Inner subtle glow border -->
      <rect x="12" y="12" width="232" height="232" rx="50" ry="50" fill="none" stroke="#22d3ee" stroke-width="1.5" stroke-opacity="0.45" />
      
      <!-- Logo Image -->
      <image href="data:image/png;base64,${logoBase64}" x="63" y="38" width="130" height="95" />
      
      <!-- BURGOOD Text -->
      <text x="128" y="184" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">BURGOOD</text>
      
      <!-- Subtitle -->
      <text x="128" y="208" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="10" font-weight="bold" fill="#22d3ee" text-anchor="middle" letter-spacing="4">ACCESS CONTROL</text>
    </svg>
  `;
  
  const badge256 = await sharp(Buffer.from(svgBadge)).png().toBuffer();
  await sharp(badge256).toFile('frontend/src/assets/burgood-badge.png');
  await sharp(badge256).toFile('frontend/public/logo-badge.png');
  await sharp(badge256).toFile('backend/public/logo-badge.png');
  
  // Generate multi-size ICO: 16, 32, 48, 64, 128, 256
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  
  for (const size of sizes) {
    const buf = await sharp(badge256)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toBuffer();
    pngBuffers.push({ size, buf });
  }

  // Build proper Windows ICO format
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(count, 4); // count of images

  let offset = 6 + count * 16;
  const dirEntries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 0); // width
    entry.writeUInt8(img.size === 256 ? 0 : img.size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // offset
    dirEntries.push(entry);
    offset += img.buf.length;
  }

  const finalIco = Buffer.concat([
    header,
    ...dirEntries,
    ...pngBuffers.map(p => p.buf)
  ]);

  fs.writeFileSync('burgood.ico', finalIco);
  fs.writeFileSync('app_icon.ico', finalIco);
  console.log('Badge ICO created successfully! Size: ' + finalIco.length + ' bytes');
}

generateBadge().catch(console.error);

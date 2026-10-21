const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download: status ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(dest));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  const targetDir = 'd:\\Shlagbaun';
  const url1 = 'https://semper.co.za/download/Receipt_Printer_Drivers/Xprinter/XPrinter%20Driver%20Setup%20V7.77.exe';
  const dest1 = path.join(targetDir, 'XPrinter_Driver_Setup_V7.77.exe');

  console.log(`Downloading ${url1}...`);
  try {
    await download(url1, dest1);
    const stats = fs.statSync(dest1);
    console.log(`Success! Downloaded to ${dest1} (${stats.size} bytes)`);
  } catch (e) {
    console.error('Download error:', e.message);
  }
}

main();

const fs = require('fs');
const s = fs.readFileSync('d:/Shlagbaun/backend/common.js', 'utf8');

const regex = /templateUrl\s*:\s*["']([^"']+)["']/g;
let match;
while ((match = regex.exec(s)) !== null) {
  console.log('Template:', match[1]);
}

const regex2 = /\.state\s*\(\s*["']([^"']+)["']/g;
while ((match = regex2.exec(s)) !== null) {
  console.log('State:', match[1]);
}

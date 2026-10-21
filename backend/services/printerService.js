const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const PRINTER_NAME = process.env.RECEIPT_PRINTER || 'POS-58';
const WIDTH = 32; // 58mm = 32 belgi

// Printer kodlash muammosi bo'lmasligi uchun faqat ASCII
function ascii(s) {
  return String(s == null ? '' : s)
    .replace(/[ʻʼ’‘`´]/g, "'")
    .replace(/[^\x20-\x7E]/g, '?');
}

function line(left, right = '') {
  left = ascii(left); right = ascii(right);
  const space = Math.max(1, WIDTH - left.length - right.length);
  return left + ' '.repeat(space) + right;
}

function center(s) {
  s = ascii(s);
  const pad = Math.max(0, Math.floor((WIDTH - s.length) / 2));
  return ' '.repeat(pad) + s;
}

function fmtDate(d) {
  const x = new Date(d);
  const p = n => String(n).padStart(2, '0');
  return `${p(x.getDate())}.${p(x.getMonth() + 1)}.${x.getFullYear()} ${p(x.getHours())}:${p(x.getMinutes())}`;
}

function fmtDuration(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h} soat ${m} daq` : `${m} daq`;
}

function fmtMoney(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
}

function methodName(m) {
  if (!m) return '';
  if (/CASH/i.test(m)) return 'Naqd';
  if (/CARD|TERMINAL/i.test(m)) return 'Karta';
  return m;
}

function buildReceipt({ plateNumber, entryTime, exitTime, durationMins, fee, method, id, parkingName }) {
  const ESC = '\x1b', GS = '\x1d';
  const sep = '-'.repeat(WIDTH);
  let t = '';
  t += ESC + '@';
  t += ESC + 'a' + '\x01' + ESC + 'E' + '\x01';
  t += ascii(parkingName || 'SMARTPARK') + '\n';
  t += ESC + 'E' + '\x00';
  t += 'Avtoturargoh cheki\n';
  t += ESC + 'a' + '\x00';
  t += sep + '\n';
  t += line('Avto raqam:', plateNumber) + '\n';
  t += line('Kirish:', fmtDate(entryTime)) + '\n';
  t += line('Chiqish:', fmtDate(exitTime)) + '\n';
  t += line('Davomiyligi:', fmtDuration(durationMins)) + '\n';
  t += sep + '\n';
  t += ESC + 'E' + '\x01';
  t += line('JAMI:', fmtMoney(fee)) + '\n';
  t += ESC + 'E' + '\x00';
  if (method) t += line("To'lov:", methodName(method)) + '\n';
  t += sep + '\n';
  t += line('Chek:', String(id || '').slice(0, 8).toUpperCase()) + '\n';
  t += '\n' + center('Xizmatimizdan foydalanganingiz') + '\n';
  t += center('uchun rahmat!') + '\n\n\n\n';
  t += GS + 'V' + '\x42' + '\x00'; // kesish
  return Buffer.from(t, 'latin1');
}

function printBuffer(buf) {
  return new Promise((resolve, reject) => {
    const tmp = path.join(os.tmpdir(), `receipt_${Date.now()}.bin`);
    fs.writeFileSync(tmp, buf);
    const exe = path.join(__dirname, 'rawprint.exe');
    execFile(exe, [PRINTER_NAME, tmp], { timeout: 10000 }, (err, stdout, stderr) => {
      fs.unlink(tmp, () => {});
      if (err) return reject(new Error((stderr || err.message).toString().trim()));
      resolve(stdout.toString().trim());
    });
  });
}

async function printReceipt(data) {
  try {
    await printBuffer(buildReceipt(data));
    console.log(`🖨️ [PRINTER] Chek chop etildi: ${data.plateNumber}`);
    return true;
  } catch (e) {
    console.error('❌ [PRINTER] Chek chiqarishda xato:', e.message);
    return false;
  }
}

module.exports = { printReceipt, buildReceipt, printBuffer };

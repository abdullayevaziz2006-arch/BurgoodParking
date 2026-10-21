// Live video: har bir kamera uchun BITTA RTSP ulanish (ffmpeg), barcha tomoshabinlarga MJPEG sifatida tarqatiladi.
// Kadr uchun qayta-qayta parol so'ralmaydi (avvalgi snapshot usuli kamerani qotirar va bloklar edi).
// Birinchi tomoshabin kelganda ochiladi, oxirgisi ketganda yopiladi.
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const streams = new Map(); // ip -> { proc, clients:Set, buf, lastFrame, failures, retryTimer, device }

const SOI = Buffer.from([0xff, 0xd8]);
const EOI = Buffer.from([0xff, 0xd9]);

function rtspUrl(device) {
  const u = encodeURIComponent(device.username || 'admin');
  const p = encodeURIComponent(device.password || 'Q135246q');
  // 102 = sub-stream (kichik, tez). Kerak bo'lsa 101 (asosiy) ga o'zgartiring.
  return `rtsp://${u}:${p}@${device.ipAddress}:554/Streaming/Channels/102`;
}

function broadcast(s, frame) {
  s.lastFrame = frame;
  const head = Buffer.from(`--myboundary\r\nContent-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`);
  for (const res of s.clients) {
    if (res.writableLength > 2_000_000) continue; // sekin klientga kadr tashlab ketamiz
    try { res.write(head); res.write(frame); res.write('\r\n'); } catch (e) {}
  }
}

function start(ip) {
  const s = streams.get(ip);
  if (!s || s.proc || s.clients.size === 0) return;

  const args = [
    '-rtsp_transport', 'tcp',
    '-fflags', 'nobuffer', '-flags', 'low_delay',
    '-i', rtspUrl(s.device),
    '-an', '-r', '10',
    '-vf', 'scale=640:-2',
    '-q:v', '7',
    '-f', 'image2pipe', '-vcodec', 'mjpeg', 'pipe:1'
  ];
  console.log(`🎥 [Live ${ip}] RTSP ulanish ochilmoqda...`);
  const startedAt = Date.now();
  const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'ignore'] });
  s.proc = proc;
  s.buf = Buffer.alloc(0);

  proc.stdout.on('data', chunk => {
    s.failures = 0;
    s.buf = Buffer.concat([s.buf, chunk]);
    let start, end;
    while ((start = s.buf.indexOf(SOI)) !== -1 && (end = s.buf.indexOf(EOI, start + 2)) !== -1) {
      broadcast(s, s.buf.subarray(start, end + 2));
      s.buf = s.buf.subarray(end + 2);
    }
    if (s.buf.length > 3_000_000) s.buf = Buffer.alloc(0);
  });

  proc.on('exit', code => {
    s.proc = null;
    if (s.clients.size === 0) return;
    // Tez-tez yiqilsa (parol xato / kamera bloklangan) — kamerani bloklab qo'ymaslik uchun kutamiz
    const quick = Date.now() - startedAt < 5000;
    s.failures = quick ? s.failures + 1 : 0;
    const delay = s.failures >= 3 ? 120000 : (quick ? 5000 : 1000);
    console.log(`🎥 [Live ${ip}] ffmpeg tugadi (kod ${code}). ${delay / 1000}s dan keyin qayta uriniladi.`);
    s.retryTimer = setTimeout(() => start(ip), delay);
  });
  proc.on('error', err => console.error(`🎥 [Live ${ip}] ffmpeg xato:`, err.message));
}

function stop(ip) {
  const s = streams.get(ip);
  if (!s) return;
  clearTimeout(s.retryTimer);
  if (s.proc) { try { s.proc.kill('SIGKILL'); } catch (e) {} s.proc = null; }
  streams.delete(ip);
  console.log(`🎥 [Live ${ip}] tomoshabin yo'q — ulanish yopildi.`);
}

function addViewer(device, req, res) {
  const ip = device.ipAddress;
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary',
    'Cache-Control': 'no-cache, no-store',
    'Connection': 'close',
    'Pragma': 'no-cache'
  });

  let s = streams.get(ip);
  if (!s) {
    s = { proc: null, clients: new Set(), buf: Buffer.alloc(0), lastFrame: null, failures: 0, retryTimer: null, device };
    streams.set(ip, s);
  }
  s.device = device; // eng so'nggi parol
  s.clients.add(res);
  if (s.lastFrame) broadcast(s, s.lastFrame);

  req.on('close', () => {
    s.clients.delete(res);
    if (s.clients.size === 0) stop(ip);
  });

  start(ip);
}

module.exports = { addViewer };

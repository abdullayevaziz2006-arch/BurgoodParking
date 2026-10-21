const { request } = require('urllib');
const prisma = require('../config/db');
const { processPlateDetection } = require('../controllers/cameraController');

const activeConnections = new Map(); // ip -> { abortController, timer }
const recentDetections = new Map(); // plateNumber -> timestamp (debounce)

const DEBOUNCE_MS = 6000;

function isRecentlyDetected(plate) {
  const now = Date.now();
  const lastTime = recentDetections.get(plate);
  if (lastTime && now - lastTime < DEBOUNCE_MS) {
    return true;
  }
  recentDetections.set(plate, now);
  // Clean up map periodically
  if (recentDetections.size > 200) {
    for (const [p, t] of recentDetections.entries()) {
      if (now - t > 30000) recentDetections.delete(p);
    }
  }
  return false;
}

/**
 * Bitta kamera uchun doimiy ISAPI alertStream ulanishini o'rnatadi.
 */
function connectCameraStream(device) {
  if (!device || !device.ipAddress) return;
  const ip = device.ipAddress;

  if (activeConnections.has(ip)) {
    return; // Allaqachon ulangan
  }

  const username = device.username || 'admin';
  const password = device.password || 'Q135246q';
  const port = device.port || 80;
  const url = `http://${ip}:${port}/ISAPI/Event/notification/alertStream`;

  console.log(`📡 [AlertStream] Ulanish boshlanmoqda: ${device.name || ''} (${ip})...`);

  let isStopping = false;
  activeConnections.set(ip, {
    stop: () => {
      isStopping = true;
    }
  });

  let xmlBuffer = '';

  const reqStream = request(url, {
    method: 'GET',
    digestAuth: `${username}:${password}`,
    streaming: true,
    timeout: 0 // cheksiz oqim
  });

  reqStream.then(res => {
    if (res.status !== 200) {
      const authFail = res.status === 401;
      const delay = authFail ? 300000 : 5000;
      console.warn(`⚠️ [AlertStream] Kamera ${ip} javob statusi: ${res.status}.${authFail ? ' PAROL XATO yoki kamera bloklangan!' : ''} ${delay / 1000}s dan so'ng qayta ulanadi.`);
      activeConnections.delete(ip);
      if (!isStopping) {
        setTimeout(async () => {
          let fresh = device;
          try { fresh = (await prisma.device.findFirst({ where: { ipAddress: ip } })) || device; } catch (e) {}
          connectCameraStream(fresh);
        }, delay);
      }
      return;
    }

    console.log(`✅ [AlertStream] Kamera ${ip} ga jonli ulandi! Kadrlar va avto-raqamlar kutilmoqda...`);

    const stream = res.res;

    stream.on('data', chunk => {
      xmlBuffer += chunk.toString('utf8');

      // Har bir </EventNotificationAlert> xabarini ajratib olamiz
      let endTagIndex;
      while ((endTagIndex = xmlBuffer.indexOf('</EventNotificationAlert>')) !== -1) {
        const fullXml = xmlBuffer.substring(0, endTagIndex + '</EventNotificationAlert>'.length);
        xmlBuffer = xmlBuffer.substring(endTagIndex + '</EventNotificationAlert>'.length);

        // Raqamni qidiramiz
        const match = fullXml.match(/<licensePlate>([^<]+)<\/licensePlate>/i) ||
                      fullXml.match(/<plateNumber>([^<]+)<\/plateNumber>/i);

        if (match && match[1]) {
          const plateNumber = match[1].trim().toUpperCase();
          if (plateNumber && plateNumber !== 'UNKNOWN' && plateNumber !== 'NO_PLATE') {
            if (!isRecentlyDetected(plateNumber)) {
              prisma.device.findFirst({ where: { ipAddress: ip } }).then(freshDevice => {
                const liveDevice = freshDevice || device;
                console.log(`🚗 [AlertStream EVENT] Kamera: ${liveDevice.name} (${ip}) [${liveDevice.type}] | Raqam: ${plateNumber} aniqlandi!`);
                return processPlateDetection({
                  plateNumber,
                  device: liveDevice,
                  rawDirection: liveDevice.type
                });
              }).then(result => {
                console.log(`✅ [AlertStream RESULT] ${plateNumber} natija:`, result);
              }).catch(err => {
                console.error(`❌ [AlertStream ERROR] ${plateNumber}:`, err.message);
              });
            }
          }
        }
      }

      // Xotira to'lib ketmasligi uchun
      if (xmlBuffer.length > 500000) {
        xmlBuffer = xmlBuffer.substring(xmlBuffer.length - 100000);
      }
    });

    stream.on('end', () => {
      console.warn(`⚠️ [AlertStream] Kamera ${ip} oqimi yakunlandi. 3s dan so'ng qayta ulanadi.`);
      activeConnections.delete(ip);
      if (!isStopping) setTimeout(() => connectCameraStream(device), 3000);
    });

    stream.on('error', err => {
      console.error(`❌ [AlertStream] Kamera ${ip} stream xatosi:`, err.message);
      activeConnections.delete(ip);
      if (!isStopping) setTimeout(() => connectCameraStream(device), 4000);
    });
  }).catch(err => {
    console.error(`❌ [AlertStream] Kamera ${ip} ulanish xatosi:`, err.message);
    activeConnections.delete(ip);
    if (!isStopping) setTimeout(() => connectCameraStream(device), 5000);
  });
}

/**
 * Barcha ro'yxatdan o'tgan kameralar uchun oqimni ishga tushirish.
 */
async function startAllAlertStreams() {
  try {
    const devices = await prisma.device.findMany();
    for (const dev of devices) {
      connectCameraStream(dev);
    }
  } catch (err) {
    console.error('Failed to start alert streams:', err);
  }
}

module.exports = {
  startAllAlertStreams,
  connectCameraStream
};

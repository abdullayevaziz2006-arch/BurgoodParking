const { request } = require('urllib');
const xmlBuilder = require('../utils/xmlBuilder');
const { getBarrierRequests } = require('../config/cameraModels');

let DigestClient = null;

// Dynamically load digest-fetch since it is an ES module
(async () => {
  try {
    const mod = await import('digest-fetch');
    const base = mod.default || mod;
    DigestClient = base.default || base;
  } catch (err) {
    console.error('Failed to load digest-fetch module dynamically:', err);
  }
})();

const cameraClients = {};

function getCameraClient(ip, username = 'admin', password = 'Q135246q') {
  const cacheKey = `${ip}_${username}`;
  if (!cameraClients[cacheKey]) {
    if (!DigestClient) {
      throw new Error('DigestClient is not loaded yet');
    }
    cameraClients[cacheKey] = new DigestClient(username, password);
  }
  return cameraClients[cacheKey];
}

// Barrier Auto-Close delay in seconds (default 35 seconds per user request)
const DEFAULT_AUTO_CLOSE_SECONDS = 35;

/**
 * Modelga qarab to'g'ri ISAPI endpointlarni tanlab shlagbaumni ochadi,
 * va belgilangan taymerdan so'ng avtomatik yopish signalini yuboradi.
 * @param {string[]} ips - Kamera IP manzillari
 * @param {string} username - Login
 * @param {string} password - Parol
 * @param {string} model - Kamera modeli (masalan: 'DS-TCG406')
 * @param {number} autoCloseSeconds - Taymer soniyasi (0 bo'lsa avtomatik yopilmaydi)
 */
async function triggerBarrierOpen(ips = ['192.168.2.70', '192.168.2.64'], username = 'admin', password = 'Q135246q', model = 'DS-TCG406', autoCloseSeconds = DEFAULT_AUTO_CLOSE_SECONDS) {
  const creds = `${username}:${password}`;
  const variations = getBarrierRequests(model);

  console.log(`[BARRIER OPEN] Model: ${model}, IPs: ${ips.join(', ')}, Endpoints: ${variations.length}`);

  ips.forEach(ip => {
    variations.forEach(v => {
      const fullUrl = `http://${ip}${v.url}`;
      request(fullUrl, {
        method: v.method,
        digestAuth: creds,
        headers: { 'Content-Type': 'application/xml', 'X-Requested-With': 'XMLHttpRequest' },
        data: v.data,
        timeout: 3000
      }).then(res => {
        console.log(`[BARRIER OPEN SUCCESS] Model: ${model}, IP: ${ip}, URL: ${v.url}, Status: ${res.status}`);
      }).catch(err => {
        // Silently catch
      });
    });

    // Taymer bilan avtomatik yopish (foydalanuvchi talabi: 'bizning dasturda taymerda ishlasin yopilsin')
    if (autoCloseSeconds && autoCloseSeconds > 0) {
      console.log(`⏳ [BARRIER TIMER] ${ip} shlagbaumi ${autoCloseSeconds} soniyadan keyin avtomatik yopiladi...`);
      setTimeout(() => {
        triggerBarrierClose([ip], username, password, model);
      }, autoCloseSeconds * 1000);
    }
  });

  try {
    const socketService = require('./socketService');
    socketService.emit('barrier_status', { open: true, timestamp: new Date() });
  } catch (e) {}
}

/**
 * Shlagbaumni yopish buyrug'i.
 */
async function triggerBarrierClose(ips = ['192.168.2.70', '192.168.2.64'], username = 'admin', password = 'Q135246q', model = 'DS-TCG406') {
  const creds = `${username}:${password}`;
  console.log(`🔒 [BARRIER AUTO-CLOSE TRIGGER] Model: ${model}, IPs: ${ips.join(', ')} yopilmoqda...`);

  const closePayloads = [
    {
      method: 'PUT',
      url: '/ISAPI/ITC/Entrance/barrierGateCtrl',
      data: xmlBuilder.buildTCG205BarrierCtrlXml(1, 'off')
    },
    {
      method: 'PUT',
      url: '/ISAPI/Parking/channels/1/barrierGate',
      data: '<?xml version="1.0" encoding="UTF-8"?><BarrierGate><ctrlMode>close</ctrlMode></BarrierGate>'
    }
  ];

  ips.forEach(ip => {
    closePayloads.forEach(v => {
      const fullUrl = `http://${ip}${v.url}`;
      request(fullUrl, {
        method: v.method,
        digestAuth: creds,
        headers: { 'Content-Type': 'application/xml', 'X-Requested-With': 'XMLHttpRequest' },
        data: v.data,
        timeout: 3000
      }).then(res => {
        console.log(`🔒 [BARRIER CLOSE RESULT] IP: ${ip}, URL: ${v.url}, Status: ${res.status}`);
      }).catch(() => {});
    });
  });

  try {
    const socketService = require('./socketService');
    socketService.emit('barrier_status', { open: false, timestamp: new Date() });
  } catch (e) {}
}

module.exports = {
  getCameraClient,
  triggerBarrierOpen,
  triggerBarrierClose
};

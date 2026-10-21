const { io } = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const centralUrl = process.env.CENTRAL_SERVER_URL || 'http://localhost:5000';
const lotId = process.env.PARKING_LOT_ID;

if (!lotId) {
  console.error('❌ [IoT Agent] PARKING_LOT_ID topilmadi! .env faylini sozlang.');
  return;
}

console.log(`[IoT Agent] Connecting to central server: ${centralUrl}...`);
const socket = io(centralUrl, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000
});

socket.on('connect', () => {
  console.log(`✅ [IoT Agent] Central serverga ulandi. Registering lotId: ${lotId}...`);
  socket.emit('register_agent', { lotId });
});

socket.on('disconnect', () => {
  console.warn('⚠️ [IoT Agent] Central serverdan uzildi.');
});

// Listen to barrier open commands from central server
socket.on('open_barrier_cmd', async () => {
  console.log('⚡ [IoT Agent] Markazdan shlagbaumni ochish buyrug\'i keldi!');
  try {
    const { getBarrierRequests } = require('./config/cameraModels');
    const { request } = require('urllib');

    // DBdan barcha qurilmalarni olamiz
    const devices = await prisma.device.findMany();

    if (devices.length === 0) {
      // Fallback: qurilma yo'q bo'lsa default
      const defaultIps = ['192.168.2.70', '192.168.2.64'];
      const defaultCreds = 'admin:Q135246q';
      const variations = getBarrierRequests('DS-TCG406');
      defaultIps.forEach(ip => {
        variations.forEach(v => {
          request(`http://${ip}${v.url}`, {
            method: v.method, digestAuth: defaultCreds,
            headers: { 'Content-Type': 'application/xml', 'X-Requested-With': 'XMLHttpRequest' },
            data: v.data, timeout: 5000
          }).then(res => console.log(`[BARRIER] ${ip} → ${res.status}`)).catch(() => {});
        });
      });
    } else {
      // Har bir qurilma uchun o'z modelini ishlatamiz
      devices.forEach(device => {
        const model = device.model || 'DS-TCG406';
        const creds = `${device.username || 'admin'}:${device.password || 'Q135246q'}`;
        const variations = getBarrierRequests(model);
        variations.forEach(v => {
          request(`http://${device.ipAddress}${v.url}`, {
            method: v.method, digestAuth: creds,
            headers: { 'Content-Type': 'application/xml', 'X-Requested-With': 'XMLHttpRequest' },
            data: v.data, timeout: 5000
          }).then(res => console.log(`[BARRIER] ${device.ipAddress} (${model}) → ${res.status}`)).catch(() => {});
        });
      });
    }
    console.log('🔓 [IoT Agent] Shlagbaum ochish signallari yuborildi.');
  } catch (err) {
    console.error('❌ [IoT Agent] Shlagbaumni ochishda xatolik:', err.message);
  }
});

// Sync database records
async function syncDatabase() {
  if (!socket.connected) return;
  try {
    const sessions = await prisma.parkingSession.findMany({
      take: 50,
      orderBy: { updatedAt: 'desc' }
    });
    const payments = await prisma.payment.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    const logs = await prisma.log.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });
    const cars = await prisma.car.findMany({
      take: 100
    });

    console.log(`[IoT Agent] Syncing ${sessions.length} sessions, ${payments.length} payments, ${logs.length} logs, ${cars.length} cars...`);
    socket.emit('sync_data', { lotId, sessions, payments, logs, cars });
  } catch (err) {
    console.error('❌ [IoT Agent] Sinxronizatsiya qilishda xatolik:', err.message);
  }
}

// Sync database every 15 seconds
setInterval(syncDatabase, 15000);

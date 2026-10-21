const bcrypt = require('bcryptjs');
const { request } = require('urllib');
const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');
const socketService = require('../services/socketService');
const { getModelList } = require('../config/cameraModels');

// --- CASHIERS ---

async function getCashiers(req, res) {
  try {
    const cashiers = await prisma.user.findMany({
      where: { role: 'CASHIER', parkingLotId: req.user.parkingLotId },
      select: { id: true, name: true, username: true, createdAt: true }
    });
    res.json(cashiers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createCashier(req, res) {
  try {
    const { name, username, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Username taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const cashier = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: 'CASHIER',
        parkingLotId: req.user.parkingLotId
      }
    });
    res.json({ success: true, cashier: { id: cashier.id, name: cashier.name, username: cashier.username } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function deleteCashier(req, res) {
  try {
    await prisma.user.delete({ where: { id: req.params.id, parkingLotId: req.user.parkingLotId } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// --- PARKING LOT ---

async function updateParkingLot(req, res) {
  try {
    const { telegramChatId, name } = req.body;
    const lot = await prisma.parkingLot.update({
      where: { id: req.user.parkingLotId },
      data: { telegramChatId, name }
    });
    res.json({ success: true, lot });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// --- STATS ---

async function getDashboardStats(req, res) {
  try {
    const lotFilter = req.user?.parkingLotId ? { lotId: req.user.parkingLotId } : {};
    const activeSessions = await prisma.parkingSession.count({
      where: { status: 'ACTIVE', ...lotFilter }
    });

    const cashiersCount = await prisma.user.count({
      where: { role: 'CASHIER' }
    });

    const totalRevenueResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        ...(req.user?.parkingLotId ? { session: { lotId: req.user.parkingLotId } } : {})
      }
    });

    res.json({
      totalRevenue: totalRevenueResult._sum.amount || 0,
      activeSessions,
      cashiersCount
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// --- TARIFFS ---

async function getTariff(req, res) {
  try {
    let tariff = await prisma.tariff.findFirst();
    if (!tariff) {
      const firstLot = await prisma.parkingLot.findFirst();
      if (firstLot) {
        tariff = await prisma.tariff.create({
          data: { 
            name: 'Standard',
            billingType: 'HOURLY',
            pricePerHour: 5000,
            pricePerMin: 100,
            fixedFee: 5000,
            maxHours: 4,
            freeMinutes: 10, 
            monthlyPrices: JSON.stringify({ 1: 50000, 3: 140000, 6: 260000, 12: 480000, 24: 900000 }),
            lotId: firstLot.id 
          }
        });
      } else {
        return res.json({ billingType: 'HOURLY', pricePerHour: 5000, pricePerMin: 100, fixedFee: 5000, maxHours: 4, freeMinutes: 10, monthlyPrices: null });
      }
    }
    res.json({
      ...tariff,
      pricePerHour: tariff.pricePerHour || tariff.pricePerMin || 5000,
      pricePerMin: tariff.pricePerMin || 100,
      fixedFee: tariff.fixedFee !== undefined ? tariff.fixedFee : 5000,
      billingType: tariff.billingType || 'HOURLY',
      maxHours: tariff.maxHours !== undefined ? tariff.maxHours : 4
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function saveTariff(req, res) {
  try {
    const { 
      billingType = 'HOURLY', 
      pricePerHour, 
      pricePerMin, 
      fixedFee, 
      maxHours, 
      freeMinutes, 
      monthlyPrices 
    } = req.body;

    const firstLot = await prisma.parkingLot.findFirst();
    if (!firstLot) return res.status(404).json({ error: 'No parking lot found' });

    const hourlyRate = parseFloat(pricePerHour) || 5000;
    const minRate = parseFloat(pricePerMin) || 100;
    const fixedRate = parseFloat(fixedFee) || 5000;
    const maxH = maxHours !== undefined && maxHours !== '' ? parseInt(maxHours) : null;
    const freeM = parseInt(freeMinutes) || 0;

    const existing = await prisma.tariff.findFirst({ where: { lotId: firstLot.id } });
    const formattedMonthly = typeof monthlyPrices === 'object' && monthlyPrices !== null
      ? JSON.stringify(monthlyPrices)
      : (monthlyPrices || null);

    const updateData = {
      billingType: ['HOURLY', 'MINUTE', 'FIXED'].includes(billingType) ? billingType : 'HOURLY',
      pricePerHour: hourlyRate,
      pricePerMin: minRate,
      fixedFee: fixedRate,
      maxHours: maxH,
      freeMinutes: freeM
    };
    if (monthlyPrices !== undefined) {
      updateData.monthlyPrices = formattedMonthly;
    }

    let tariff;
    if (existing) {
      tariff = await prisma.tariff.update({
        where: { id: existing.id },
        data: updateData
      });
    } else {
      tariff = await prisma.tariff.create({
        data: { 
          name: 'Standard', 
          ...updateData,
          monthlyPrices: formattedMonthly,
          lotId: firstLot.id 
        }
      });
    }
    res.json({
      ...tariff,
      pricePerHour: tariff.pricePerHour,
      billingType: tariff.billingType
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// --- DEVICES ---

async function getDevices(req, res) {
  try {
    const devices = await prisma.device.findMany();
    res.json(devices);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function createDevice(req, res) {
  try {
    const { name, ipAddress, port, type, username, password, lotId, model } = req.body;
    let targetLotId = lotId;
    if (!targetLotId) {
      const firstLot = await prisma.parkingLot.findFirst();
      if (firstLot) targetLotId = firstLot.id;
    }
    const newDevice = await prisma.device.create({
      data: {
        name,
        ipAddress,
        port: parseInt(port || 80),
        type,
        username,
        password,
        model: model || 'iDS-TCM203-A',
        lotId: targetLotId
      }
    });

    if (process.env.ALERT_STREAM === '1') {
      try {
        const alertStreamService = require('../services/alertStreamService');
        alertStreamService.connectCameraStream(newDevice);
      } catch (streamErr) {
        console.error('Failed to connect alert stream for new device:', streamErr);
      }
    }

    res.json(newDevice);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getCameraModels(req, res) {
  res.json(getModelList());
}

async function deleteDevice(req, res) {
  try {
    await prisma.device.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete device' });
  }
}

async function pingDevice(req, res) {
  try {
    const device = await prisma.device.findUnique({ where: { id: req.params.id } });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    
    let url = device.ipAddress;
    if (!url.startsWith('http')) {
      url = `http://${url}:${device.port}`;
    }
    
    try {
      await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      res.json({ status: 'ONLINE' });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      res.json({ status: 'OFFLINE' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

async function syncDevice(req, res) {
  try {
    const device = await prisma.device.findUnique({ where: { id: req.params.id } });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    if (!device.username || !device.password) return res.status(400).json({ error: 'Device credentials missing' });

    let baseUrl = device.ipAddress;
    if (!baseUrl.startsWith('http')) baseUrl = `http://${baseUrl}:${device.port}`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startIso = today.toISOString().split('.')[0] + 'Z';
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endIso = tomorrow.toISOString().split('.')[0] + 'Z';

    const searchUrl = `${baseUrl}/ISAPI/ContentMgmt/search`;
    
    const payloads = [
      `<?xml version="1.0" encoding="utf-8"?><CMSearchDescription><searchID>1</searchID><trackList><trackID>103</trackID></trackList><timeSpanList><timeSpan><startTime>${startIso}</startTime><endTime>${endIso}</endTime></timeSpan></timeSpanList><maxResults>50</maxResults><searchResultPosition>0</searchResultPosition></CMSearchDescription>`,
      `<?xml version="1.0" encoding="utf-8"?><CMSearchDescription><searchID>2</searchID><trackList><trackID>1</trackID></trackList><timeSpanList><timeSpan><startTime>${startIso}</startTime><endTime>${endIso}</endTime></timeSpan></timeSpanList><contentTypeList><contentType>metadata</contentType></contentTypeList><maxResults>50</maxResults><searchResultPosition>0</searchResultPosition></CMSearchDescription>`,
      `<?xml version="1.0" encoding="utf-8"?><CMSearchDescription><searchID>3</searchID><timeSpanList><timeSpan><startTime>${startIso}</startTime><endTime>${endIso}</endTime></timeSpan></timeSpanList><contentTypeList><contentType>picture</contentType></contentTypeList><maxResults>50</maxResults><searchResultPosition>0</searchResultPosition></CMSearchDescription>`,
      `<?xml version="1.0" encoding="utf-8"?><CMSearchDescription><searchID>4</searchID><timeSpanList><timeSpan><startTime>${startIso}</startTime><endTime>${endIso}</endTime></timeSpan></timeSpanList><maxResults>50</maxResults><searchResultPosition>0</searchResultPosition></CMSearchDescription>`
    ];

    let xmlRes = '';
    let foundMatches = false;
    
    for (let i = 0; i < payloads.length; i++) {
      try {
        const response = await request(searchUrl, {
          method: 'POST',
          digestAuth: `${device.username}:${device.password}`,
          data: payloads[i],
          headers: { 'Content-Type': 'application/xml' },
          timeout: 5000
        });
        
        if (response.status === 200) {
          const resStr = response.data.toString();
          xmlRes = resStr;
          
          if (resStr.includes('<numOfMatches>') && !resStr.includes('<numOfMatches>0</numOfMatches>')) {
             foundMatches = true;
             fs.writeFileSync(path.join(__dirname, '..', 'sync_debug.log'), `SUCCESS PAYLOAD ${i}:\n${resStr}`);
             break;
          }
        }
      } catch (e) {
        console.error('Payload fail', i);
      }
    }

    if (!foundMatches) {
      fs.writeFileSync(path.join(__dirname, '..', 'sync_debug.log'), `ALL PAYLOADS RETURNED 0 MATCHES.\nLAST RESPONSE:\n${xmlRes}`);
    }

    let plates = [...xmlRes.matchAll(/<licensePlate>([^<]+)<\/licensePlate>/g)].map(m => m[1]);
    if (plates.length === 0) plates = [...xmlRes.matchAll(/<plateNumber>([^<]+)<\/plateNumber>/g)].map(m => m[1]);

    let addedCount = 0;
    for (const plate of plates) {
      const exists = await prisma.log.findFirst({
        where: { car: { plateNumber: plate }, createdAt: { gte: today } }
      });
      
      if (!exists) {
        const car = await prisma.car.upsert({
          where: { plateNumber: plate },
          update: {},
          create: { plateNumber: plate }
        });
        
        const existingSession = await prisma.parkingSession.findFirst({
          where: { carId: car.id, status: 'ACTIVE' }
        });

        if (!existingSession) {
          const firstLot = await prisma.parkingLot.findFirst();
          if (firstLot) {
            await prisma.parkingSession.create({
              data: { carId: car.id, lotId: firstLot.id, entryTime: new Date() }
            });
          }
        }

        await prisma.log.create({ data: { type: 'ENTRY', carId: car.id, description: 'SYNCED' } });
        
        socketService.emit('car_entry', { plateNumber: plate, time: new Date() });
        addedCount++;
      }
    }

    res.json({ success: true, syncedCount: addedCount });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Failed to sync with device' });
  }
}

module.exports = {
  getCashiers,
  createCashier,
  deleteCashier,
  updateParkingLot,
  getDashboardStats,
  getTariff,
  saveTariff,
  getDevices,
  createDevice,
  deleteDevice,
  pingDevice,
  syncDevice,
  getCameraModels
};

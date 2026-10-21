const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { XMLParser } = require('fast-xml-parser');
const prisma = require('../config/db');
const socketService = require('../services/socketService');
const barrierService = require('../services/barrierService');

const parser = new XMLParser({ ignoreAttributes: false });

async function saveVehiclePhoto(imageBuffer, ip, plateNumber, type = 'entry') {
  try {
    let buf = imageBuffer;
    if (!buf && ip) {
      try {
        const client = barrierService.getCameraClient(ip, 'admin', 'Q135246q');
        const url = `http://${ip}/ISAPI/Streaming/channels/1/picture`;
        const res = await client.fetch(url, { method: 'GET', timeout: 2500 });
        if (res.status === 200) {
          const ab = await res.arrayBuffer();
          buf = Buffer.from(ab);
        }
      } catch (e) {
        // Live snapshot fallback error ignored
      }
    }

    if (buf && buf.length > 0) {
      const cleanPlate = (plateNumber || 'CAR').replace(/[^a-zA-Z0-9]/g, '');
      const filename = `${type}_${cleanPlate}_${Date.now()}.jpg`;
      const uploadDir = path.join(__dirname, '../public/uploads/snapshots');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const targetFile = path.join(uploadDir, filename);

      await sharp(buf)
        .resize(800, 450, { fit: 'inside' })
        .jpeg({ quality: 75 })
        .toFile(targetFile);

      console.log(`📸 [RASM SAQLANDI] ${filename} (${type})`);
      return `/uploads/snapshots/${filename}`;
    }
  } catch (err) {
    console.error('[PHOTO SAVE ERROR]:', err.message);
  }
  return null;
}

async function handleCameraWebhook(req, res) {
  try {
    const debugPath = path.join(__dirname, '..', 'camera_debug.log');
    const logData = {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body,
      files: req.files ? req.files.map(f => ({ fieldname: f.fieldname, mimetype: f.mimetype, size: f.size, path: f.path })) : []
    };
    
    try {
      fs.appendFileSync(debugPath, JSON.stringify(logData, null, 2) + '\n\n');
    } catch (err) {}

    let plateNumber = null;
    let cameraIp = null;
    let direction = 'IN'; 
    let lotId = req.body?.lotId || null;
    let imageBuffer = null;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.mimetype && file.mimetype.startsWith('image/')) {
          imageBuffer = file.buffer || (file.path && fs.existsSync(file.path) ? fs.readFileSync(file.path) : null);
        } else if (file.buffer && file.buffer.length > 100 && file.buffer[0] === 0xFF && file.buffer[1] === 0xD8) {
          imageBuffer = file.buffer;
        }

        let xmlData = null;

        if (file.buffer && file.buffer.length > 0) {
          const str = file.buffer.toString('utf8');
          if (str.includes('<EventNotificationAlert') || str.includes('<?xml')) {
            xmlData = str;
          }
        } else if (file.path && fs.existsSync(file.path)) {
          try {
            const str = fs.readFileSync(file.path, 'utf8');
            if (str.includes('<EventNotificationAlert') || str.includes('<?xml')) {
              xmlData = str;
            }
          } catch (e) {}
        }

        if (xmlData) {
          try {
            const parsed = parser.parse(xmlData);
            try {
              fs.appendFileSync(debugPath, 'PARSED XML: ' + JSON.stringify(parsed, null, 2) + '\n\n');
            } catch (err) {}

            if (parsed.EventNotificationAlert) {
              if (parsed.EventNotificationAlert.ipAddress) {
                cameraIp = String(parsed.EventNotificationAlert.ipAddress).trim();
              }
              const anprObj = parsed.EventNotificationAlert.ANPR || parsed.EventNotificationAlert.plateResult;
              if (anprObj) {
                const rawPlate = anprObj.licensePlate || anprObj.originalLicensePlate || anprObj.plateNo;
                if (rawPlate) {
                  plateNumber = typeof rawPlate === 'object' ? (rawPlate['#text'] || rawPlate._text || String(rawPlate)) : String(rawPlate);
                }
              }
            }
          } catch (e) {
            console.error('XML Parse Error:', e.message);
          }
        }
      }
    }

    // Direct body XML fallback (if raw XML sent in body)
    if (!plateNumber && typeof req.body === 'string' && req.body.includes('<EventNotificationAlert')) {
      try {
        const parsed = parser.parse(req.body);
        if (parsed.EventNotificationAlert) {
          if (parsed.EventNotificationAlert.ipAddress) {
            cameraIp = String(parsed.EventNotificationAlert.ipAddress).trim();
          }
          const anprObj = parsed.EventNotificationAlert.ANPR || parsed.EventNotificationAlert.plateResult;
          if (anprObj) {
            const rawPlate = anprObj.licensePlate || anprObj.originalLicensePlate || anprObj.plateNo;
            if (rawPlate) {
              plateNumber = typeof rawPlate === 'object' ? (rawPlate['#text'] || rawPlate._text || String(rawPlate)) : String(rawPlate);
            }
          }
        }
      } catch(e) {}
    }

    // Detect client IP and match with registered Device
    const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.connection?.remoteAddress || req.ip || '';
    const clientIp = String(rawIp).replace(/^.*:/, '').trim();
    const targetIp = cameraIp || clientIp;

    let matchedDevice = null;
    if (targetIp) {
      matchedDevice = await prisma.device.findFirst({
        where: {
          OR: [
            { ipAddress: targetIp },
            { ipAddress: { contains: targetIp } }
          ]
        }
      });
      if (matchedDevice && matchedDevice.lotId) {
        lotId = matchedDevice.lotId;
      }
      
      // Explicit IP mappings guarantee correct direction
      if (targetIp.includes('192.168.2.64')) {
        direction = 'IN';
      } else if (targetIp.includes('192.168.2.70')) {
        direction = 'OUT';
      } else if (matchedDevice && matchedDevice.type) {
        direction = (matchedDevice.type === 'ENTRY' || matchedDevice.type === 'IN') ? 'IN' : 'OUT';
      }
    }

    if (req.query.direction) {
      const qd = req.query.direction.toUpperCase();
      direction = (qd === 'ENTRY' || qd === 'IN') ? 'IN' : 'OUT';
    }
    if (req.body?.direction) {
      const bd = String(req.body.direction).toUpperCase();
      direction = (bd === 'ENTRY' || bd === 'IN') ? 'IN' : 'OUT';
    }

    // JSON/URL-encoded fallback (for simulator)
    if (!plateNumber && req.body?.plateNumber) {
      plateNumber = req.body.plateNumber;
    }

    if (!plateNumber) {
      return res.status(200).send('No plate in event');
    }

    plateNumber = String(plateNumber).trim().toUpperCase();
    if (!plateNumber || plateNumber === 'UNKNOWN' || plateNumber === 'NO_PLATE') {
      return res.status(200).send('Unknown plate');
    }

    const nowTs = Date.now();
    const debKey = `${matchedDevice ? matchedDevice.id : targetIp}:${plateNumber}`;
    if (global.__plateDebounce === undefined) global.__plateDebounce = new Map();
    const last = global.__plateDebounce.get(debKey);
    if (last && nowTs - last < 6000) {
      return res.status(200).send('Duplicate ignored');
    }
    global.__plateDebounce.set(debKey, nowTs);
    console.log(`🚗 [WEBHOOK] ${matchedDevice ? matchedDevice.name : targetIp} [${direction}] | Raqam: ${plateNumber}`);

    const result = await processPlateDetection({
      plateNumber,
      device: matchedDevice,
      rawDirection: matchedDevice ? matchedDevice.type : direction,
      lotId,
      imageBuffer,
      targetIp
    });

    if (result.error) return res.status(400).json(result);
    if (result.reason === 'BLACKLISTED') return res.status(403).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}

async function processPlateDetection({ plateNumber, device = null, rawDirection = null, lotId = null, imageBuffer = null, targetIp = null }) {
  if (!plateNumber) return { error: 'No plate' };

  let direction = 'IN';
  if (device && device.type) {
    direction = (device.type === 'ENTRY' || device.type === 'IN') ? 'IN' : 'OUT';
  }
  if (rawDirection) {
    const rd = String(rawDirection).toUpperCase();
    direction = (rd === 'ENTRY' || rd === 'IN') ? 'IN' : 'OUT';
  }

  let car = null;
  if (direction === 'OUT' || direction === 'EXIT') {
    car = await prisma.car.findUnique({ where: { plateNumber } });
    if (!car) {
      console.log(`⚠️ [EXIT RAD ETILDI] ${plateNumber} bazada mavjud emas (kirmagan). E'tiborga olinmaydi.`);
      return { allowed: false, reason: 'NOT_IN_DB', message: "Mashina bazada mavjud emas." };
    }

    const session = await prisma.parkingSession.findFirst({
      where: { carId: car.id, status: 'ACTIVE' }
    });

    if (!session) {
      console.log(`⚠️ [EXIT RAD ETILDI] ${plateNumber} kirish kamerasidan kirmagan (bazada faol seans yo'q). E'tiborga olinmaydi.`);
      return { allowed: false, reason: 'NO_ACTIVE_SESSION', message: "Bazada faol kirish seansi topilmadi. E'tiborga olinmadi." };
    }
  } else {
    car = await prisma.car.upsert({
      where: { plateNumber },
      update: {},
      create: { plateNumber }
    });
  }

  if (car.isBlacklisted) {
    socketService.emit('alert', { message: `Qora ro'yxatdagi mashina: ${plateNumber}` });
    await prisma.log.create({ data: { type: 'BLACKLIST_ATTEMPT', carId: car.id, description: 'Qora ro\'yxatdagi mashina urindi' } });
    return { allowed: false, reason: 'BLACKLISTED' };
  }

  const isSubscriber = car.isSubscriber && (!car.subscriberEnd || new Date(car.subscriberEnd) > new Date());

  if (direction === 'IN' || direction === 'ENTRY') {
    const cameraIp = targetIp || (device ? device.ipAddress : '192.168.2.64');
    const entryPhotoUrl = await saveVehiclePhoto(imageBuffer, cameraIp, plateNumber, 'entry');

    const existingSession = await prisma.parkingSession.findFirst({
      where: { carId: car.id, status: 'ACTIVE' }
    });

    if (!existingSession) {
      let targetLotId = lotId || (device ? device.lotId : null);
      if (!targetLotId) {
        const firstLot = await prisma.parkingLot.findFirst();
        if (firstLot) targetLotId = firstLot.id;
      }

      if (targetLotId) {
        await prisma.parkingSession.create({
          data: {
            carId: car.id,
            lotId: targetLotId,
            entryTime: new Date(),
            entryPhoto: entryPhotoUrl
          }
        });
      }
    } else if (entryPhotoUrl && !existingSession.entryPhoto) {
      await prisma.parkingSession.update({
        where: { id: existingSession.id },
        data: { entryPhoto: entryPhotoUrl }
      });
    }

    const logDesc = isSubscriber ? "Kirish kamerasi orqali kirdi (VIP / Obunachi)" : "Kirish kamerasi orqali kirdi";
    await prisma.log.create({ data: { type: 'ENTRY', carId: car.id, description: logDesc } });
    socketService.emit('car_entry', { plateNumber, time: new Date(), isSubscriber, entryPhoto: entryPhotoUrl });

    // Trigger physical barrier open (chiqish kamerasi 192.168.2.70 asosiy)
    const barrierIps = ['192.168.2.70', '192.168.2.64'];
    barrierService.triggerBarrierOpen(
      barrierIps,
      'admin',
      'Q135246q',
      'DS-TCG406'
    );

    return { allowed: true, action: 'OPEN_BARRIER', isSubscriber };

  } else if (direction === 'OUT' || direction === 'EXIT') {
    const session = await prisma.parkingSession.findFirst({
      where: { carId: car.id, status: 'ACTIVE' }
    });

    const exitCameraIp = targetIp || (device ? device.ipAddress : '192.168.2.70');
    const exitPhotoUrl = await saveVehiclePhoto(imageBuffer, exitCameraIp, plateNumber, 'exit');

    const exitTime = new Date();
    const diffMs = exitTime - session.entryTime;
    const diffMins = Math.max(1, Math.ceil(diffMs / 60000));

    const tariff = await prisma.tariff.findFirst({ where: { lotId: session.lotId } });
    
    const freeMinutes = tariff ? (tariff.freeMinutes ?? 10) : 10;
    const billingType = tariff?.billingType || 'HOURLY';
    let fee = 0;
    let billableHours = 0;
    let calculationText = '';

    if (!isSubscriber) {
      if (diffMins <= freeMinutes) {
        fee = 0;
        calculationText = `Bepul vaqt (${freeMinutes} daq ichida)`;
      } else if (billingType === 'FIXED') {
        fee = tariff?.fixedFee !== undefined ? tariff.fixedFee : 5000;
        calculationText = `Bir martalik to'lov: ${fee.toLocaleString()} so'm`;
      } else if (billingType === 'MINUTE') {
        const pricePerMin = tariff?.pricePerMin || 100;
        const billableMins = Math.max(1, diffMins - freeMinutes);
        fee = billableMins * pricePerMin;
        calculationText = `${billableMins} daqiqa × ${pricePerMin} so'm = ${fee.toLocaleString()} so'm`;
      } else {
        // HOURLY
        const pricePerHour = tariff ? (tariff.pricePerHour || tariff.pricePerMin || 5000) : 5000;
        const maxHours = tariff?.maxHours !== undefined && tariff?.maxHours !== null ? tariff.maxHours : 4;
        
        billableHours = Math.ceil(diffMins / 60);
        if (billableHours < 1) billableHours = 1;
        if (maxHours > 0 && billableHours > maxHours) {
          billableHours = maxHours;
        }
        fee = billableHours * pricePerHour;
        calculationText = `${billableHours} soat × ${pricePerHour.toLocaleString()} so'm = ${fee.toLocaleString()} so'm`;
      }
    } else {
      fee = 0; // VIP har doim bepul
      calculationText = 'VIP / Obunachi (Bepul)';
    }

    const durHrs = Math.floor(diffMins / 60);
    const durMinsRem = diffMins % 60;
    const durationText = durHrs > 0 ? (durMinsRem > 0 ? `${durHrs} soat ${durMinsRem} daqiqa` : `${durHrs} soat`) : `${durMinsRem} daqiqa`;

    await prisma.parkingSession.update({
      where: { id: session.id },
      data: {
        exitTime,
        fee,
        status: fee > 0 ? 'UNPAID' : 'COMPLETED',
        exitPhoto: exitPhotoUrl
      }
    });

    let logDesc = "Chiqish kamerasi orqali chiqdi";
    if (isSubscriber) {
      logDesc = "Chiqish kamerasi orqali chiqdi (VIP / Obunachi - To'lovsiz)";
    }

    await prisma.log.create({ 
      data: { 
        type: 'EXIT', 
        carId: car.id, 
        description: logDesc 
      } 
    });
    
    socketService.emit('car_exit', { 
      plateNumber, 
      fee, 
      time: exitTime, 
      sessionId: session.id, 
      entryTime: session.entryTime, 
      durationMins: diffMins,
      entryPhoto: session.entryPhoto,
      exitPhoto: exitPhotoUrl
    });

    if (fee === 0) {
      const barrierIps = ['192.168.2.70', '192.168.2.64'];
      barrierService.triggerBarrierOpen(
        barrierIps,
        'admin',
        'Q135246q',
        'DS-TCG406'
      );
      return { allowed: true, action: 'OPEN_BARRIER', fee: 0 };
    } else {
      socketService.emit('checkout_request', {
        sessionId: session.id,
        plateNumber,
        entryTime: session.entryTime,
        exitTime,
        durationMins: diffMins,
        durationText,
        billingType,
        calculationText,
        billableHours,
        pricePerHour: tariff ? (tariff.pricePerHour || tariff.pricePerMin) : 5000,
        freeMinutes,
        overtimeMins: Math.max(0, diffMins - freeMinutes),
        fee,
        entryPhoto: session.entryPhoto,
        exitPhoto: exitPhotoUrl,
        session: {
          id: session.id,
          entryTime: session.entryTime,
          entryPhoto: session.entryPhoto,
          exitPhoto: exitPhotoUrl,
          car: {
            id: car.id,
            plateNumber: car.plateNumber,
            isSubscriber: car.isSubscriber
          }
        }
      });

      return { allowed: false, action: 'WAIT_FOR_PAYMENT', fee, sessionId: session.id };
    }
  }

  return { success: true };
}

async function handleHeartbeat(req, res) {
  global.lastAgentHeartbeat = {
    receivedAt: new Date(),
    cameras: req.body.cameras || []
  };
  res.json({ success: true });
}

async function getCameraSnapshot(req, res) {
  const { ip } = req.params;
  const url = `http://${ip}/ISAPI/Streaming/channels/1/picture`;

  try {
    const device = await prisma.device.findFirst({ where: { ipAddress: ip } });
    const username = device ? (device.username || 'admin') : 'admin';
    const password = device ? (device.password || 'Q135246q') : 'Q135246q';

    const client = barrierService.getCameraClient(ip, username, password);
    const response = await client.fetch(url, {
      method: 'GET',
      timeout: 3000
    });

    if (response.status === 200) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const compressedBuffer = await sharp(buffer)
        .resize(640, 360, { fit: 'inside' })
        .jpeg({ quality: 60 })
        .toBuffer();

      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': compressedBuffer.length,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private'
      });
      res.end(compressedBuffer);
    } else {
      res.status(response.status).send('Failed to get snapshot');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
}

async function getCameraMjpegStream(req, res) {
  const { ip } = req.params;
  try {
    const device = await prisma.device.findFirst({ where: { ipAddress: ip } });
    if (!device) return res.status(404).send('Camera not found');
    require('../services/liveStreamService').addViewer(device, req, res);
  } catch (err) {
    if (!res.headersSent) res.status(500).send(err.message); else res.end();
  }
}

async function manualOpenCamera(req, res) {
  const { ip } = req.body;
  try {
    // Qurilmani DBdan topib modelini aniqlaymiz
    const device = await prisma.device.findFirst({ where: { ipAddress: ip } });
    const model = device ? device.model : 'DS-TCG406';
    const username = device ? (device.username || 'admin') : 'admin';
    const password = device ? (device.password || 'Q135246q') : 'Q135246q';

    await barrierService.triggerBarrierOpen(['192.168.2.70', '192.168.2.64'], username, password, model);
    return res.json({ success: true, model });
  } catch (err) {
    console.error('Camera open failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

async function manualCloseCamera(req, res) {
  const { ip } = req.body;
  try {
    const device = await prisma.device.findFirst({ where: { ipAddress: ip } });
    const model = device ? device.model : 'DS-TCG406';
    const username = device ? (device.username || 'admin') : 'admin';
    const password = device ? (device.password || 'Q135246q') : 'Q135246q';

    await barrierService.triggerBarrierClose(['192.168.2.70', '192.168.2.64'], username, password, model);
    return res.json({ success: true, model, message: 'Shlagbaum yopish signali yuborildi' });
  } catch (err) {
    console.error('Camera close failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

async function triggerBarrierManual(req, res) {
  console.log('[API] Barrier open requested');
  try {
    const devices = await prisma.device.findMany();
    if (devices.length === 0) {
      barrierService.triggerBarrierOpen(['192.168.2.70', '192.168.2.64'], 'admin', 'Q135246q', 'DS-TCG406');
    } else {
      const groups = {};
      devices.forEach(d => {
        const model = d.model || 'DS-TCG406';
        if (!groups[model]) groups[model] = { ips: [], username: d.username || 'admin', password: d.password || 'Q135246q' };
        if (d.ipAddress === '192.168.2.70') {
          groups[model].ips.unshift(d.ipAddress);
        } else {
          groups[model].ips.push(d.ipAddress);
        }
      });
      for (const [model, cfg] of Object.entries(groups)) {
        barrierService.triggerBarrierOpen(cfg.ips, cfg.username, cfg.password, model);
      }
    }
    res.json({ success: true, message: 'Shlagbaum ochildi!' });
  } catch (err) {
    console.error('[BARRIER] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

async function triggerBarrierCloseManual(req, res) {
  console.log('[API] Barrier close requested');
  try {
    const devices = await prisma.device.findMany();
    if (devices.length === 0) {
      barrierService.triggerBarrierClose(['192.168.2.70', '192.168.2.64'], 'admin', 'Q135246q', 'DS-TCG406');
    } else {
      const groups = {};
      devices.forEach(d => {
        const model = d.model || 'DS-TCG406';
        if (!groups[model]) groups[model] = { ips: [], username: d.username || 'admin', password: d.password || 'Q135246q' };
        if (d.ipAddress === '192.168.2.70') {
          groups[model].ips.unshift(d.ipAddress);
        } else {
          groups[model].ips.push(d.ipAddress);
        }
      });
      for (const [model, cfg] of Object.entries(groups)) {
        barrierService.triggerBarrierClose(cfg.ips, cfg.username, cfg.password, model);
      }
    }
    res.json({ success: true, message: 'Shlagbaum yopildi!' });
  } catch (err) {
    console.error('[BARRIER CLOSE] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  handleCameraWebhook,
  processPlateDetection,
  handleHeartbeat,
  getCameraSnapshot,
  getCameraMjpegStream,
  manualOpenCamera,
  manualCloseCamera,
  triggerBarrierManual,
  triggerBarrierCloseManual
};

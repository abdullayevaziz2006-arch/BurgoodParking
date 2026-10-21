const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function resetData() {
  console.log('Tozalash boshlandi...');

  // 1. To'lovlar (Payments) ni o'chirish
  const deletedPayments = await prisma.payment.deleteMany();
  console.log(`To'lovlar tozalandi: ${deletedPayments.count} ta`);

  // 2. Barcha kirish-chiqish seanslari (ParkingSessions) ni o'chirish
  const deletedSessions = await prisma.parkingSession.deleteMany();
  console.log(`Mashina seanslari tozalandi: ${deletedSessions.count} ta`);

  // 3. Tizim loglari (Logs) ni o'chirish
  const deletedLogs = await prisma.log.deleteMany();
  console.log(`Hodisalar loglari tozalandi: ${deletedLogs.count} ta`);

  // 4. Kameralar (Devices) ni o'chirish
  const deletedDevices = await prisma.device.deleteMany();
  console.log(`Kameralar tozalandi: ${deletedDevices.count} ta`);

  // 5. Faol bo'lmagan / obunachi bo'lmagan test mashinalarni o'chirish
  const deletedCars = await prisma.car.deleteMany({
    where: { isSubscriber: false }
  });
  console.log(`Test mashinalar bazasi tozalandi: ${deletedCars.count} ta`);

  // 6. Rasm snapshots papkasini tozalash
  const snapshotsDir = path.join(__dirname, 'backend/public/uploads/snapshots');
  if (fs.existsSync(snapshotsDir)) {
    const files = fs.readdirSync(snapshotsDir);
    let photoCount = 0;
    for (const file of files) {
      if (file !== '.gitkeep') {
        try {
          fs.unlinkSync(path.join(snapshotsDir, file));
          photoCount++;
        } catch (e) {}
      }
    }
    console.log(`Suratlar (snapshots) tozalandi: ${photoCount} ta`);
  }

  // 7. Yangilangan toza dev.db ni template sifatida saqlash
  const dbPath = path.join(__dirname, 'backend/prisma/dev.db');
  const templatePath = path.join(__dirname, 'backend/prisma/dev.db.template');
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, templatePath);
    console.log('dev.db.template toza holatda yangilandi.');
  }

  console.log('Barcha test ma\'lumotlar muvaffaqiyatli tozalandi!');
}

resetData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

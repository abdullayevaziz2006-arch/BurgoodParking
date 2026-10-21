const prisma = require('../config/db');
const barrierService = require('../services/barrierService');
const printerService = require('../services/printerService');

async function printPaymentReceipt(sessionId, payment) {
  try {
    const s = await prisma.parkingSession.findUnique({
      where: { id: sessionId },
      include: { car: true, lot: true }
    });
    if (!s) return;
    const exitTime = s.exitTime || new Date();
    const durationMins = Math.max(1, Math.ceil((new Date(exitTime) - new Date(s.entryTime)) / 60000));
    await printerService.printReceipt({
      plateNumber: s.car.plateNumber,
      entryTime: s.entryTime,
      exitTime,
      durationMins,
      fee: payment.amount,
      method: payment.method,
      id: payment.id,
      parkingName: s.lot && s.lot.name
    });
  } catch (e) {
    console.error('[PRINTER] receipt error:', e.message);
  }
}

async function triggerExitBarrier() {
  try {
    const ips = ['192.168.2.70', '192.168.2.64'];
    barrierService.triggerBarrierOpen(
      ips,
      'admin',
      'Q135246q',
      'DS-TCG406'
    );
  } catch (e) {
    console.error('Trigger exit barrier error:', e);
  }
}

async function processTerminalPayment(req, res) {
  const { sessionId, amount } = req.body;
  try {
    const session = await prisma.parkingSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    console.log(`[TERMINAL] Processing payment of ${amount} UZS...`);

    const payment = await prisma.payment.create({
      data: { sessionId, amount: parseFloat(amount), method: 'CARD_TERMINAL', status: 'SUCCESS' }
    });
    
    await prisma.parkingSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' }
    });

    // Avval chek chop etiladi, chek chiqqandan so'ng shlagbaum ochiladi
    console.log(`[PAYMENT] Card payment approved for session ${sessionId}. Printing receipt first...`);
    await printPaymentReceipt(sessionId, payment);
    await new Promise(resolve => setTimeout(resolve, 800)); // Chek to'liq chiqib olishi uchun qisqa tanaffus
    console.log(`[PAYMENT] Chek chiqdi. Shlagbaum ochilmoqda...`);
    triggerExitBarrier();
    
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: 'Terminal xatosi' });
  }
}

async function processCashPayment(req, res) {
  const { sessionId, fee, insertedAmount } = req.body;
  try {
    const session = await prisma.parkingSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    const change = parseFloat(insertedAmount) - parseFloat(fee);
    if (change < 0) return res.status(400).json({ error: 'Mablag\' yetarli emas' });

    console.log(`[CASH_ACCEPTOR] Qabul qilindi: ${insertedAmount}, To'lov: ${fee}, Qaytim: ${change}`);

    const payment = await prisma.payment.create({
      data: { sessionId, amount: parseFloat(fee), method: 'CASH_HARDWARE', status: 'SUCCESS' }
    });
    
    await prisma.parkingSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' }
    });

    // Avval chek chop etiladi, chek chiqqandan so'ng shlagbaum ochiladi
    console.log(`[PAYMENT] Cash payment accepted for session ${sessionId}. Printing receipt first...`);
    await printPaymentReceipt(sessionId, payment);
    await new Promise(resolve => setTimeout(resolve, 800)); // Chek to'liq chiqib olishi uchun qisqa tanaffus
    console.log(`[PAYMENT] Chek chiqdi. Shlagbaum ochilmoqda...`);
    triggerExitBarrier();
    
    res.json({ success: true, payment, change });
  } catch (err) {
    res.status(500).json({ error: 'Kassa xatosi' });
  }
}

async function processGeneralPayment(req, res) {
  const { sessionId, method, amount } = req.body;
  try {
    const session = await prisma.parkingSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    const payment = await prisma.payment.create({
      data: { sessionId, amount: parseFloat(amount), method, status: 'SUCCESS' }
    });
    
    await prisma.parkingSession.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED' }
    });

    // Avval chek chop etiladi, chek chiqqandan so'ng shlagbaum ochiladi
    console.log(`[PAYMENT] General payment approved for session ${sessionId}. Printing receipt first...`);
    await printPaymentReceipt(sessionId, payment);
    await new Promise(resolve => setTimeout(resolve, 800)); // Chek to'liq chiqib olishi uchun qisqa tanaffus
    console.log(`[PAYMENT] Chek chiqdi. Shlagbaum ochilmoqda...`);
    triggerExitBarrier();
    
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: 'Payment failed' });
  }
}

module.exports = {
  processTerminalPayment,
  processCashPayment,
  processGeneralPayment
};

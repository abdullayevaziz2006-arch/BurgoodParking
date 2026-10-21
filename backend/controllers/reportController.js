const prisma = require('../config/db');

async function getRevenueReport(req, res) {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'asc' }
    });
    
    const aggregated = {};
    for (const p of payments) {
      const date = p.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!aggregated[date]) aggregated[date] = 0;
      aggregated[date] += p.amount;
    }
    
    let data = Object.keys(aggregated).map(date => ({
      date,
      revenue: aggregated[date]
    }));
    
    if (data.length === 0) {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        data.push({ date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), revenue: 0 });
      }
    }
    
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getTrafficReport(req, res) {
  try {
    const logs = await prisma.log.findMany({
      where: { type: { in: ['ENTRY', 'EXIT'] } },
      orderBy: { createdAt: 'asc' }
    });
    
    const aggregated = {};
    for (const log of logs) {
      const date = log.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!aggregated[date]) aggregated[date] = { date, entries: 0, exits: 0 };
      if (log.type === 'ENTRY') aggregated[date].entries += 1;
      if (log.type === 'EXIT') aggregated[date].exits += 1;
    }
    
    let data = Object.values(aggregated);
    
    if (data.length === 0) {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        data.push({ date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), entries: 0, exits: 0 });
      }
    }
    
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getHistoryReport(req, res) {
  try {
    const sessions = await prisma.parkingSession.findMany({
      include: { car: true, payments: true },
      orderBy: { entryTime: 'desc' },
      take: 200
    });
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getSessions(req, res) {
  try {
    const { search, status, startDate, endDate, method } = req.query;

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      where.car = {
        plateNumber: { contains: search.trim().toUpperCase() }
      };
    }

    if (startDate || endDate) {
      where.entryTime = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.entryTime.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.entryTime.lte = end;
      }
    }

    const rawSessions = await prisma.parkingSession.findMany({
      where,
      include: {
        car: true,
        lot: true,
        payments: true
      },
      orderBy: { entryTime: 'desc' }
    });

    let filteredSessions = rawSessions;
    if (method && method !== 'ALL') {
      filteredSessions = rawSessions.filter(s => {
        if (!s.payments || s.payments.length === 0) return method === 'NONE';
        return s.payments.some(p => p.method === method);
      });
    }

    let totalRevenue = 0;
    let cashRevenue = 0;
    let cardRevenue = 0;
    let totalStayMinutes = 0;
    let stayCount = 0;

    const enrichedSessions = filteredSessions.map(session => {
      const exitTime = session.exitTime ? new Date(session.exitTime) : new Date();
      const entryTime = new Date(session.entryTime);
      const diffMs = exitTime - entryTime;
      const durationMins = Math.max(1, Math.round(diffMs / 60000));
      
      const hrs = Math.floor(durationMins / 60);
      const mins = durationMins % 60;
      const durationText = hrs > 0 
        ? (mins > 0 ? `${hrs} soat ${mins} daq` : `${hrs} soat`)
        : `${mins} daqiqa`;

      if (session.status === 'COMPLETED') {
        totalStayMinutes += durationMins;
        stayCount++;
      }

      // Hisoblangan to'lovlar
      let paidMethod = '-';
      let sessionPaidAmount = 0;
      if (session.payments && session.payments.length > 0) {
        session.payments.forEach(p => {
          sessionPaidAmount += p.amount;
          if (p.method === 'CASH') {
            cashRevenue += p.amount;
            paidMethod = 'Naqd';
          } else {
            cardRevenue += p.amount;
            paidMethod = p.method === 'CARD' ? 'Karta' : p.method;
          }
        });
        totalRevenue += sessionPaidAmount;
      } else if (session.car?.isSubscriber) {
        paidMethod = 'VIP';
      }

      return {
        ...session,
        durationMins,
        durationText,
        paidMethod,
        sessionPaidAmount: sessionPaidAmount > 0 ? sessionPaidAmount : session.fee
      };
    });

    const activeCount = rawSessions.filter(s => s.status === 'ACTIVE').length;
    const completedCount = rawSessions.filter(s => s.status === 'COMPLETED').length;
    const unpaidCount = rawSessions.filter(s => s.status === 'UNPAID').length;
    const avgDurationMins = stayCount > 0 ? Math.round(totalStayMinutes / stayCount) : 0;

    if (req.query.withSummary === 'true') {
      return res.json({
        sessions: enrichedSessions,
        summary: {
          totalCars: rawSessions.length,
          activeCars: activeCount,
          completedCars: completedCount,
          unpaidCars: unpaidCount,
          totalRevenue,
          cashRevenue,
          cardRevenue,
          avgDurationMins
        }
      });
    }

    // Default: return enrichedSessions array directly for backward compatibility
    res.json(enrichedSessions);
  } catch (e) {
    console.error('getSessions error:', e);
    res.status(500).json({ error: e.message });
  }
}

async function getStats(req, res) {
  try {
    const activeCount = await prisma.parkingSession.count({ where: { status: 'ACTIVE' } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPayments = await prisma.payment.findMany({
      where: { createdAt: { gte: today } }
    });

    const todayRevenue = todayPayments.reduce((acc, p) => acc + p.amount, 0);
    const todayCash = todayPayments.filter(p => p.method === 'CASH').reduce((acc, p) => acc + p.amount, 0);
    const todayCard = todayPayments.filter(p => p.method !== 'CASH').reduce((acc, p) => acc + p.amount, 0);

    res.json({
      activeCars: activeCount,
      todayRevenue,
      todayCash,
      todayCard
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function getLogs(req, res) {
  try {
    const { search, type, startDate, endDate, limit = 200 } = req.query;
    const where = {};

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (search && search.trim() !== '') {
      where.OR = [
        { car: { plateNumber: { contains: search.trim().toUpperCase() } } },
        { description: { contains: search.trim() } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const logs = await prisma.log.findMany({
      where,
      include: { car: true },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) || 200
    });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

async function exportExcel(req, res) {
  try {
    const { startDate, endDate, status } = req.query;
    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (startDate || endDate) {
      where.entryTime = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.entryTime.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.entryTime.lte = end;
      }
    }

    const sessions = await prisma.parkingSession.findMany({
      where,
      include: { car: true, lot: true, payments: true },
      orderBy: { entryTime: 'desc' }
    });

    const host = req.get('host') || 'localhost:3001';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    let rowsHtml = '';
    sessions.forEach((s, idx) => {
      const exitTime = s.exitTime ? new Date(s.exitTime) : null;
      const entryTime = new Date(s.entryTime);
      const diffMs = (exitTime || new Date()) - entryTime;
      const durationMins = Math.max(1, Math.round(diffMs / 60000));
      const hrs = Math.floor(durationMins / 60);
      const mins = durationMins % 60;
      const durText = hrs > 0 ? `${hrs} soat ${mins} daq` : `${mins} daqiqa`;

      let paidMethod = '-';
      let paidAmt = 0;
      if (s.payments && s.payments.length > 0) {
        paidAmt = s.payments.reduce((a, p) => a + p.amount, 0);
        paidMethod = s.payments.map(p => p.method === 'CASH' ? 'Naqd' : (p.method === 'CARD' ? 'Karta' : p.method)).join(', ');
      } else if (s.car?.isSubscriber) {
        paidMethod = 'VIP';
      }

      const entryImgTag = s.entryPhoto 
        ? `<a href="${baseUrl}${s.entryPhoto}" target="_blank"><img src="${baseUrl}${s.entryPhoto}" width="95" height="55" style="border:1px solid #ccc;border-radius:4px;object-fit:cover;"/><br/><font size="1" color="#2563EB">Ko'rish</font></a>` 
        : `<em>Rasm yo'q</em>`;

      const exitImgTag = s.exitPhoto 
        ? `<a href="${baseUrl}${s.exitPhoto}" target="_blank"><img src="${baseUrl}${s.exitPhoto}" width="95" height="55" style="border:1px solid #ccc;border-radius:4px;object-fit:cover;"/><br/><font size="1" color="#2563EB">Ko'rish</font></a>` 
        : `<em>Rasm yo'q</em>`;

      const statusText = s.status === 'COMPLETED' ? 'Tugallandi' : (s.status === 'ACTIVE' ? 'Hududda' : "To'lanmagan");
      const statusColor = s.status === 'COMPLETED' ? '#10B981' : (s.status === 'ACTIVE' ? '#2563EB' : '#EF4444');

      rowsHtml += `
        <tr style="height: 65px; vertical-align: middle; text-align: center;">
          <td style="border: 1px solid #d1d5db; padding: 6px;">${idx + 1}</td>
          <td style="border: 1px solid #d1d5db; padding: 6px; font-weight: bold; font-family: monospace; font-size: 14px; color: #1E293B;">${s.car?.plateNumber || '-'}</td>
          <td style="border: 1px solid #d1d5db; padding: 4px;">${entryImgTag}</td>
          <td style="border: 1px solid #d1d5db; padding: 4px;">${exitImgTag}</td>
          <td style="border: 1px solid #d1d5db; padding: 6px;">${entryTime.toLocaleString('uz-UZ')}</td>
          <td style="border: 1px solid #d1d5db; padding: 6px;">${exitTime ? exitTime.toLocaleString('uz-UZ') : 'Hududda'}</td>
          <td style="border: 1px solid #d1d5db; padding: 6px;">${durText}</td>
          <td style="border: 1px solid #d1d5db; padding: 6px; font-weight: bold; color: #047857;">${(paidAmt || s.fee || 0).toLocaleString('uz-UZ')} so'm</td>
          <td style="border: 1px solid #d1d5db; padding: 6px;">${paidMethod}</td>
          <td style="border: 1px solid #d1d5db; padding: 6px; font-weight: bold; color: ${statusColor};">${statusText}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Avtoturargoh Hisoboti</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #1E293B; color: #FFFFFF; font-weight: bold; padding: 10px; border: 1px solid #000; text-align: center; }
          td { border: 1px solid #d1d5db; vertical-align: middle; }
        </style>
      </head>
      <body>
        <h2 style="font-family: Arial, sans-serif; color: #1E293B;">SmartPark Avtoturargoh Hisoboti</h2>
        <p style="font-family: Arial, sans-serif; font-size: 12px; color: #64748B;">Sana: ${new Date().toLocaleString('uz-UZ')} | Jami mashinalar soni: ${sessions.length}</p>
        <table border="1" cellpadding="4" cellspacing="0" style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px;">
          <thead>
            <tr>
              <th style="width: 40px;">№</th>
              <th style="width: 120px;">Avto Raqam</th>
              <th style="width: 110px;">Kirish Rasmi</th>
              <th style="width: 110px;">Chiqish Rasmi</th>
              <th style="width: 150px;">Kirish Vaqti</th>
              <th style="width: 150px;">Chiqish Vaqti</th>
              <th style="width: 100px;">Turgan Vaqti</th>
              <th style="width: 120px;">To'lov Summasi</th>
              <th style="width: 100px;">To'lov Turi</th>
              <th style="width: 100px;">Holati</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const fileName = `SmartPark_Hisobot_${Date.now()}.xls`;
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(htmlContent);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getRevenueReport,
  getTrafficReport,
  getHistoryReport,
  getSessions,
  getStats,
  getLogs,
  exportExcel
};

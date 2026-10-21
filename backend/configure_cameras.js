// Kameralarni "mashina kelganda serverga o'zi signal yuborsin" rejimiga sozlaydi.
// Ishlatish:  node configure_cameras.js
// Parol bazadagi (Qurilmalar sahifasidagi) parol bo'lishi kerak. Bitta urinish — bloklanmaslik uchun.
require('dotenv').config();
const os = require('os');
const { request } = require('urllib');
const prisma = require('./config/db');

function localIpFor(cameraIp) {
  const prefix = cameraIp.split('.').slice(0, 3).join('.') + '.';
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list) {
      if (i.family === 'IPv4' && !i.internal && i.address.startsWith(prefix)) return i.address;
    }
  }
  return null;
}

(async () => {
  const port = process.env.PORT || 3001;
  const devices = await prisma.device.findMany();
  for (const d of devices) {
    const serverIp = localIpFor(d.ipAddress);
    if (!serverIp) { console.log(`❌ ${d.name}: shu tarmoqda kompyuter IP topilmadi`); continue; }
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HttpHostNotification version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
<id>1</id>
<url>/webhook/camera</url>
<protocolType>HTTP</protocolType>
<parameterFormatType>XML</parameterFormatType>
<addressingFormatType>ipaddress</addressingFormatType>
<ipAddress>${serverIp}</ipAddress>
<portNo>${port}</portNo>
<userName></userName>
<httpAuthenticationMethod>none</httpAuthenticationMethod>
<ANPR><detectionUpLoadPicturesType>all</detectionUpLoadPicturesType></ANPR>
<SubscribeEvent><heartbeat>0</heartbeat><eventMode>all</eventMode></SubscribeEvent>
<enabled>true</enabled>
<checkResponseEnabled>false</checkResponseEnabled>
</HttpHostNotification>`;
    try {
      const r = await request(`http://${d.ipAddress}:${d.port || 80}/ISAPI/Event/notification/httpHosts/1`, {
        method: 'PUT',
        digestAuth: `${d.username || 'admin'}:${d.password}`,
        headers: { 'Content-Type': 'application/xml' },
        data: xml,
        timeout: 8000
      });
      console.log(`${r.status === 200 ? '✅' : '❌'} ${d.name} (${d.ipAddress}) -> http://${serverIp}:${port}/webhook/camera | status ${r.status}${r.status === 401 ? ' (PAROL XATO yoki kamera bloklangan)' : ''}`);
    } catch (e) {
      console.log(`❌ ${d.name} (${d.ipAddress}): ${e.message}`);
    }
  }
  process.exit(0);
})();

const { request } = require('urllib');

async function testExitCamera() {
  const ip = '192.168.2.70';
  const creds = 'admin:Q135246q';
  try {
    console.log(`Connecting to exit camera at ${ip}...`);
    const res = await request(`http://${ip}/ISAPI/System/deviceInfo`, {
      digestAuth: creds,
      timeout: 5000
    });
    console.log('Exit Camera Status:', res.status);
    console.log('Exit Camera Info:', res.data.toString());
  } catch (err) {
    console.error('Exit Camera Connection Error:', err.message);
  }
}

testExitCamera();

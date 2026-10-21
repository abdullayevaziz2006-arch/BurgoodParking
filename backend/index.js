require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');

const socketService = require('./services/socketService');
const rtspStreamServer = require('./rtsp_stream_server');

// Initialize globals
global.lastAgentHeartbeat = null;

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
socketService.init(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: ['text/xml', 'application/xml'], limit: '10mb' }));

// Routing
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const carRouter = require('./routes/car');
const paymentRouter = require('./routes/payment');
const reportRouter = require('./routes/report');
const cameraRouter = require('./routes/camera');

app.use('/api/auth', authRouter);
app.use('/api', adminRouter);
app.use('/api', carRouter);
app.use('/api', paymentRouter);
app.use('/api', reportRouter);
app.use('/api', cameraRouter);
app.use('/', cameraRouter);

// Telegram Mini-App HTML serving
app.get('/mini-app', (req, res) => {
  res.sendFile(path.join(__dirname, 'mini-app.html'));
});

// Serve static assets for React Frontend
app.use(express.static(path.join(__dirname, 'public')));

// SPA routing fallback to index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/stream') || req.path.startsWith('/mini-app') || req.path.startsWith('/webhook')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start IoT Agent, Telegram Bot & Camera Alert Streams
require('./iotAgent');
require('./telegramBot');
const alertStreamService = require('./services/alertStreamService');

// WebSocket upgrades for RTSP streams
const wssProxy = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/stream/kirish' || pathname === '/stream/chiqish') {
    rtspStreamServer.handleUpgrade(pathname, request, socket, head, wssProxy);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`SmartPark Backend running on port ${PORT}`);
  if (process.env.ALERT_STREAM === '1') {
    alertStreamService.startAllAlertStreams();
  } else {
    console.log('📮 [Kamera] Doimiy ulanish o\'chiq. Kamera mashina kelganda /webhook/camera ga o\'zi signal yuboradi.');
  }
});

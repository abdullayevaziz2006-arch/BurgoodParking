const express = require('express');
const multer = require('multer');
const router = express.Router();
const cameraController = require('../controllers/cameraController');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fieldSize: 10 * 1024 * 1024,
    fileSize: 10 * 1024 * 1024
  }
});

router.post('/webhook/camera', (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.warn('⚠️ [WEBHOOK MULTER WARN]:', err.message);
    }
    next();
  });
}, cameraController.handleCameraWebhook);
router.post('/webhook/heartbeat', cameraController.handleHeartbeat);
router.get('/camera/snapshot/:ip', cameraController.getCameraSnapshot);
router.get('/camera/stream/:ip', cameraController.getCameraMjpegStream);
router.post('/manual-open-camera', cameraController.manualOpenCamera);
router.post('/manual-close-camera', cameraController.manualCloseCamera);
router.post('/barrier/open', cameraController.triggerBarrierManual);
router.post('/barrier/close', cameraController.triggerBarrierCloseManual);

module.exports = router;

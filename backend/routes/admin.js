const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Cashiers Management
router.get('/admin/cashiers', authenticateToken, requireRole('ADMIN'), adminController.getCashiers);
router.post('/admin/cashiers', authenticateToken, requireRole('ADMIN'), adminController.createCashier);
router.delete('/admin/cashiers/:id', authenticateToken, requireRole('ADMIN'), adminController.deleteCashier);

// Parking Lot Settings
router.put('/admin/parking-lot', authenticateToken, requireRole('ADMIN'), adminController.updateParkingLot);

// Dashboard Stats
router.get('/admin/dashboard-stats', adminController.getDashboardStats);

// Tariff Management
router.get('/tariff', adminController.getTariff);
router.post('/tariff', adminController.saveTariff);

// Devices Management
router.get('/devices', adminController.getDevices);
router.post('/devices', adminController.createDevice);
router.delete('/devices/:id', adminController.deleteDevice);
router.get('/devices/:id/ping', adminController.pingDevice);
router.post('/devices/:id/sync', adminController.syncDevice);

// Camera Models (multi-model support)
router.get('/camera-models', adminController.getCameraModels);

module.exports = router;

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/reports/revenue', reportController.getRevenueReport);
router.get('/reports/traffic', reportController.getTrafficReport);
router.get('/reports/history', reportController.getHistoryReport);
router.get('/reports/export-excel', reportController.exportExcel);
router.get('/sessions', reportController.getSessions);
router.get('/stats', reportController.getStats);
router.get('/logs', reportController.getLogs);

module.exports = router;

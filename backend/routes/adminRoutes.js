const express = require('express');
const router = express.Router();
const { getAdminMetrics } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/metrics', protect, authorizeRoles('admin'), getAdminMetrics);

module.exports = router;

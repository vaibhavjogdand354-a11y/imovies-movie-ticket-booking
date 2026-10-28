const express = require('express');
const router = express.Router();
const {
  getShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow,
} = require('../controllers/showController');
const {
  getSeatsForShow,
  lockSeats,
  unlockSeats,
} = require('../controllers/seatController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', getShows);
router.get('/:id', getShowById);
router.get('/:id/seats', getSeatsForShow);

// Seat holding routes
router.post('/:id/lock-seats', protect, lockSeats);
router.post('/:id/unlock-seats', protect, unlockSeats);

// Admin-only endpoints
router.post('/', protect, authorizeRoles('admin'), createShow);
router.put('/:id', protect, authorizeRoles('admin'), updateShow);
router.delete('/:id', protect, authorizeRoles('admin'), deleteShow);

module.exports = router;

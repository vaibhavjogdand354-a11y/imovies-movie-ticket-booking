const express = require('express');
const router = express.Router();
const {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
} = require('../controllers/theatreController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', getTheatres);
router.get('/:id', getTheatreById);

// Admin-only endpoints
router.post('/', protect, authorizeRoles('admin'), createTheatre);
router.put('/:id', protect, authorizeRoles('admin'), updateTheatre);
router.delete('/:id', protect, authorizeRoles('admin'), deleteTheatre);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getFilterMeta,
} = require('../controllers/movieController');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getMovies);
router.get('/filters/meta', getFilterMeta);
router.get('/:id', getMovieById);

// Admin-only endpoints
router.post('/', protect, authorizeRoles('admin'), upload.single('poster'), createMovie);
router.put('/:id', protect, authorizeRoles('admin'), upload.single('poster'), updateMovie);
router.delete('/:id', protect, authorizeRoles('admin'), deleteMovie);

module.exports = router;

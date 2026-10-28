const Show = require('../models/Show');
const Seat = require('../models/Seat');

/**
 * Generate 8x8 auditorium seat matrix (64 seats) for a newly scheduled show
 * Rows A-B: VIP
 * Rows C-E: Executive
 * Rows F-H: Regular
 */
const generateSeatsForShow = async (show) => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8];
  const seats = [];

  for (const row of rows) {
    let tier = 'regular';
    let price = show.pricing.regular;

    if (['A', 'B'].includes(row)) {
      tier = 'vip';
      price = show.pricing.vip;
    } else if (['C', 'D', 'E'].includes(row)) {
      tier = 'executive';
      price = show.pricing.executive;
    }

    for (const col of columns) {
      seats.push({
        show: show._id,
        seatNumber: `${row}${col}`,
        row: row,
        column: col,
        tier: tier,
        price: price,
        status: 'available',
        lockedBy: null,
        lockedUntil: null,
      });
    }
  }

  await Seat.insertMany(seats);
};

/**
 * @desc    Get shows with optional filters
 * @route   GET /api/shows
 * @access  Public
 */
const getShows = async (req, res, next) => {
  try {
    const { movie, theatre, date } = req.query;
    const filter = { isActive: true };

    if (movie) filter.movie = movie;
    if (theatre) filter.theatre = theatre;
    if (date) filter.date = date;

    const shows = await Show.find(filter)
      .populate('movie', 'title posterUrl duration language certification')
      .populate('theatre', 'name location city address')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: shows.length,
      data: shows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single show details
 * @route   GET /api/shows/:id
 * @access  Public
 */
const getShowById = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie')
      .populate('theatre');

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found',
      });
    }

    // Release any expired locks before returning
    await Seat.releaseExpiredLocks(show._id);

    // Get seat summary
    const totalSeats = await Seat.countDocuments({ show: show._id });
    const availableSeats = await Seat.countDocuments({ show: show._id, status: 'available' });

    res.status(200).json({
      success: true,
      data: {
        show,
        totalSeats,
        availableSeats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new show and auto-initialize 64 auditorium seats
 * @route   POST /api/shows
 * @access  Private/Admin
 */
const createShow = async (req, res, next) => {
  try {
    const { movie, theatre, screenName, date, time, format, pricing } = req.body;

    const show = await Show.create({
      movie,
      theatre,
      screenName: screenName || 'Audi 1',
      date,
      time,
      format: format || '2D',
      pricing: {
        regular: pricing?.regular || 180,
        executive: pricing?.executive || 280,
        vip: pricing?.vip || 450,
      },
    });

    // Automatically generate 64 seats for this show
    await generateSeatsForShow(show);

    const populatedShow = await Show.findById(show._id)
      .populate('movie', 'title')
      .populate('theatre', 'name city');

    res.status(201).json({
      success: true,
      message: 'Showtime scheduled and 64 auditorium seats initialized successfully.',
      data: populatedShow,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update show
 * @route   PUT /api/shows/:id
 * @access  Private/Admin
 */
const updateShow = async (req, res, next) => {
  try {
    const show = await Show.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Show updated successfully.',
      data: show,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete show and cascade delete seats
 * @route   DELETE /api/shows/:id
 * @access  Private/Admin
 */
const deleteShow = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    // Cascade delete seats
    await Seat.deleteMany({ show: show._id });
    await Show.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Show and its seat matrix deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow,
  generateSeatsForShow,
};

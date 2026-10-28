const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const User = require('../models/User');

/**
 * @desc    Get aggregated business & revenue metrics for Admin Dashboard
 * @route   GET /api/admin/metrics
 * @access  Private/Admin
 */
const getAdminMetrics = async (req, res, next) => {
  try {
    // 1. Total Gross Revenue & Confirmed Bookings count
    const revenueAgg = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalTickets: { $sum: { $size: '$seats' } },
          totalBookings: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalTickets = revenueAgg[0]?.totalTickets || 0;
    const totalBookings = revenueAgg[0]?.totalBookings || 0;

    // 2. Counts of active catalog entities
    const activeMovies = await Movie.countDocuments({ isActive: true });
    const totalTheatres = await Theatre.countDocuments({ isActive: true });
    const activeShows = await Show.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ role: 'user' });

    // 3. Recent 10 bookings
    const recentBookings = await Booking.find()
      .populate('user', 'name email')
      .populate({
        path: 'show',
        populate: [{ path: 'movie', select: 'title' }, { path: 'theatre', select: 'name city' }],
      })
      .sort({ createdAt: -1 })
      .limit(10);

    // 4. Revenue grouped by movie
    const revenueByMovieAgg = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $lookup: {
          from: 'shows',
          localField: 'show',
          foreignField: '_id',
          as: 'showData',
        },
      },
      { $unwind: '$showData' },
      {
        $lookup: {
          from: 'movies',
          localField: 'showData.movie',
          foreignField: '_id',
          as: 'movieData',
        },
      },
      { $unwind: '$movieData' },
      {
        $group: {
          _id: '$movieData._id',
          title: { $first: '$movieData.title' },
          posterUrl: { $first: '$movieData.posterUrl' },
          revenue: { $sum: '$finalAmount' },
          ticketsSold: { $sum: { $size: '$seats' } },
          bookingsCount: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalTickets,
          totalBookings,
          activeMovies,
          totalTheatres,
          activeShows,
          totalUsers,
        },
        revenueByMovie: revenueByMovieAgg,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAdminMetrics };

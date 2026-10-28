const Seat = require('../models/Seat');
const Show = require('../models/Show');

const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes hold

/**
 * @desc    Get all 64 seats for a show with live availability
 * @route   GET /api/shows/:id/seats
 * @access  Public (optional auth to identify user's locked seats)
 */
const getSeatsForShow = async (req, res, next) => {
  try {
    const showId = req.params.id;

    // 1. Release expired locks first
    await Seat.releaseExpiredLocks(showId);

    // 2. Fetch all seats
    const seats = await Seat.find({ show: showId }).sort({ row: 1, column: 1 });

    const userId = req.user ? req.user._id.toString() : null;

    // Format response to indicate whether the seat is locked by the requesting user
    const formattedSeats = seats.map((seat) => {
      const isLockedByMe =
        seat.status === 'locked' &&
        userId &&
        seat.lockedBy &&
        seat.lockedBy.toString() === userId;

      return {
        _id: seat._id,
        seatNumber: seat.seatNumber,
        row: seat.row,
        column: seat.column,
        tier: seat.tier,
        price: seat.price,
        status: seat.status,
        lockedUntil: seat.lockedUntil,
        isLockedByMe,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedSeats.length,
      data: formattedSeats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Lock selected seats for 5 minutes (Concurrency-safe)
 * @route   POST /api/shows/:id/lock-seats
 * @access  Private (protect)
 */
const lockSeats = async (req, res, next) => {
  try {
    const showId = req.params.id;
    const { seatNumbers } = req.body; // e.g. ['A1', 'A2']
    const userId = req.user._id;

    if (!seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of seat numbers to lock.',
      });
    }

    if (seatNumbers.length > 8) {
      return res.status(400).json({
        success: false,
        message: 'You cannot select more than 8 seats in a single transaction.',
      });
    }

    // 1. First release any expired locks globally for this show
    await Seat.releaseExpiredLocks(showId);

    // 2. Fetch requested seats
    const targetSeats = await Seat.find({
      show: showId,
      seatNumber: { $in: seatNumbers },
    });

    if (targetSeats.length !== seatNumbers.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more requested seats could not be found for this show.',
      });
    }

    // 3. Concurrency check: Ensure no seat is booked, or locked by someone else
    const now = new Date();
    const unavailableSeats = [];

    for (const seat of targetSeats) {
      if (seat.status === 'booked') {
        unavailableSeats.push(`${seat.seatNumber} (Already Booked)`);
      } else if (
        seat.status === 'locked' &&
        seat.lockedBy &&
        seat.lockedBy.toString() !== userId.toString() &&
        seat.lockedUntil > now
      ) {
        unavailableSeats.push(`${seat.seatNumber} (Held by another customer)`);
      }
    }

    if (unavailableSeats.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Seats unavailable: ${unavailableSeats.join(', ')}`,
        unavailableSeats,
      });
    }

    // 4. Concurrency-safe atomic lock
    const lockedUntil = new Date(Date.now() + HOLD_DURATION_MS);

    await Seat.updateMany(
      {
        show: showId,
        seatNumber: { $in: seatNumbers },
        $or: [
          { status: 'available' },
          { lockedBy: userId },
          { lockedUntil: { $lte: now } },
        ],
      },
      {
        $set: {
          status: 'locked',
          lockedBy: userId,
          lockedUntil: lockedUntil,
        },
      }
    );

    // 5. Broadcast to Socket.IO if io instance is attached to app
    const io = req.app.get('io');
    if (io) {
      io.to(`show_${showId}`).emit('seats_locked', {
        showId,
        seatNumbers,
        lockedBy: userId.toString(),
        lockedUntil,
      });
    }

    res.status(200).json({
      success: true,
      message: `${seatNumbers.length} seat(s) held for 5 minutes.`,
      seatNumbers,
      lockedUntil,
      expiresInSeconds: 300,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unlock/Release seats manually
 * @route   POST /api/shows/:id/unlock-seats
 * @access  Private (protect)
 */
const unlockSeats = async (req, res, next) => {
  try {
    const showId = req.params.id;
    const { seatNumbers } = req.body;
    const userId = req.user._id;

    const query = {
      show: showId,
      lockedBy: userId,
      status: 'locked',
    };

    if (seatNumbers && Array.isArray(seatNumbers) && seatNumbers.length > 0) {
      query.seatNumber = { $in: seatNumbers };
    }

    const released = await Seat.updateMany(query, {
      $set: {
        status: 'available',
        lockedBy: null,
        lockedUntil: null,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`show_${showId}`).emit('seats_unlocked', {
        showId,
        seatNumbers: seatNumbers || [],
        unlockedBy: userId.toString(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seats released back to available pool.',
      modifiedCount: released.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSeatsForShow,
  lockSeats,
  unlockSeats,
};

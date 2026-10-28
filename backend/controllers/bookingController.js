const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Show = require('../models/Show');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

/**
 * Generate a unique Booking Reference: e.g. IMV-7X9B2
 */
const generateBookingReference = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `IMV-${code}`;
};

/**
 * @desc    Create a new booking & process simulated payment
 * @route   POST /api/bookings
 * @access  Private (protect)
 */
const createBooking = async (req, res, next) => {
  try {
    const { showId, seatNumbers, paymentMethod = 'UPI', simulateFailure = false } = req.body;
    const userId = req.user._id;

    if (!showId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide show ID and an array of selected seat numbers.',
      });
    }

    const show = await Show.findById(showId).populate('movie theatre');
    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Showtime not found.',
      });
    }

    // 1. Validate that the requesting user currently holds a valid lock on ALL requested seats
    const seats = await Seat.find({
      show: showId,
      seatNumber: { $in: seatNumbers },
    });

    if (seats.length !== seatNumbers.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more seat numbers are invalid for this show.',
      });
    }

    const now = new Date();
    const invalidSeats = [];
    for (const seat of seats) {
      if (seat.status === 'booked') {
        invalidSeats.push(`${seat.seatNumber} is already booked`);
      } else if (
        seat.status !== 'locked' ||
        !seat.lockedBy ||
        seat.lockedBy.toString() !== userId.toString() ||
        seat.lockedUntil < now
      ) {
        invalidSeats.push(`${seat.seatNumber} hold has expired or is not held by you`);
      }
    }

    if (invalidSeats.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Unable to proceed: ${invalidSeats.join('; ')}. Please re-select your seats.`,
        invalidSeats,
      });
    }

    // 2. Pricing calculations
    const baseTotal = seats.reduce((sum, seat) => sum + seat.price, 0);
    const convenienceFee = seatNumbers.length * 30; // ₹30 per ticket
    const taxAmount = Math.round(convenienceFee * 0.18); // 18% GST on convenience fee
    const finalAmount = baseTotal + convenienceFee + taxAmount;

    const bookingReference = generateBookingReference();
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const io = req.app.get('io');

    // 3. Simulated Payment Failure Branch
    if (simulateFailure === true) {
      // Revert seats back to available
      await Seat.updateMany(
        { show: showId, seatNumber: { $in: seatNumbers } },
        {
          $set: {
            status: 'available',
            lockedBy: null,
            lockedUntil: null,
          },
        }
      );

      // Create failed payment record
      await Payment.create({
        booking: null, // No confirmed booking
        user: userId,
        transactionId,
        method: paymentMethod,
        amount: finalAmount,
        status: 'failed',
        failureReason: 'User triggered simulation: Payment authorization declined by bank.',
      });

      // Notify user of failed booking
      await Notification.create({
        user: userId,
        title: 'Payment Failed',
        message: `Your transaction of ₹${finalAmount} for ${show.movie.title} failed. Selected seats were released.`,
        type: 'system',
      });

      // Broadcast seat release to room
      if (io) {
        io.to(`show_${showId}`).emit('seats_unlocked', {
          showId,
          seatNumbers,
          reason: 'payment_failed',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Payment simulation failure: Transaction declined by bank. Your locked seats have been released.',
        transactionId,
        refundStatus: 'Not charged',
      });
    }

    // 4. Payment Success Branch: Atomically update seats to booked
    await Seat.updateMany(
      { show: showId, seatNumber: { $in: seatNumbers } },
      {
        $set: {
          status: 'booked',
          lockedBy: userId,
          lockedUntil: null,
        },
      }
    );

    // Create confirmed booking
    const booking = await Booking.create({
      bookingReference,
      user: userId,
      show: showId,
      seats: seatNumbers,
      totalAmount: baseTotal,
      convenienceFee,
      taxAmount,
      finalAmount,
      paymentMethod,
      transactionId,
      status: 'confirmed',
      isUpcoming: true,
    });

    // Create successful payment
    await Payment.create({
      booking: booking._id,
      user: userId,
      transactionId,
      method: paymentMethod,
      amount: finalAmount,
      status: 'success',
    });

    // Create Notification
    await Notification.create({
      user: userId,
      title: 'Booking Confirmed!',
      message: `Your tickets for ${show.movie.title} (${seatNumbers.join(', ')}) at ${show.theatre.name} are confirmed! Booking Ref: ${bookingReference}`,
      type: 'booking_confirmation',
    });

    // Broadcast seats booked to Socket.IO room
    if (io) {
      io.to(`show_${showId}`).emit('seats_booked', {
        showId,
        seatNumbers,
        bookedBy: userId.toString(),
      });
    }

    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'show',
        populate: [{ path: 'movie' }, { path: 'theatre' }],
      })
      .populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Tickets booked successfully! Enjoy your movie.',
      data: populatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's booking history
 * @route   GET /api/bookings/my
 * @access  Private (protect)
 */
const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: userId };

    const todayStr = new Date().toISOString().split('T')[0];

    if (status === 'upcoming') {
      query.status = 'confirmed';
      query.isUpcoming = true;
    } else if (status === 'past') {
      query.status = 'confirmed';
      query.isUpcoming = false;
    } else if (status === 'cancelled') {
      query.status = 'cancelled';
    }

    const currentPage = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * pageSize;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate({
        path: 'show',
        populate: [{ path: 'movie' }, { path: 'theatre' }],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // Auto-update isUpcoming flag based on show date
    for (const b of bookings) {
      if (b.show && b.show.date < todayStr && b.isUpcoming) {
        b.isUpcoming = false;
        await b.save();
      }
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get booking details by ID or Reference
 * @route   GET /api/bookings/:id
 * @access  Private (protect)
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let booking;

    if (id.startsWith('IMV-')) {
      booking = await Booking.findOne({ bookingReference: id });
    } else {
      booking = await Booking.findById(id);
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Access authorization: only the booking owner or an admin
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this booking.',
      });
    }

    await booking.populate([
      {
        path: 'show',
        populate: [{ path: 'movie' }, { path: 'theatre' }],
      },
      { path: 'user', select: 'name email phone' },
    ]);

    const payment = await Payment.findOne({ booking: booking._id });

    res.status(200).json({
      success: true,
      data: {
        booking,
        payment,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel booking and instantly release seats & issue refund
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private (protect)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('show');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking.',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been cancelled.',
      });
    }

    // Update booking state
    booking.status = 'cancelled';
    booking.isUpcoming = false;
    booking.cancelledAt = new Date();
    await booking.save();

    // Release seats back to available
    await Seat.updateMany(
      {
        show: booking.show._id,
        seatNumber: { $in: booking.seats },
      },
      {
        $set: {
          status: 'available',
          lockedBy: null,
          lockedUntil: null,
        },
      }
    );

    // Create refund record
    const refundTxnId = `RFD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await Payment.create({
      booking: booking._id,
      user: booking.user,
      transactionId: refundTxnId,
      method: booking.paymentMethod,
      amount: booking.finalAmount,
      status: 'refunded',
    });

    // Create Notification
    await Notification.create({
      user: booking.user,
      title: 'Booking Cancelled & Refund Initiated',
      message: `Your booking ${booking.bookingReference} has been cancelled. Full refund of ₹${booking.finalAmount} was credited.`,
      type: 'cancellation',
    });

    // Socket.IO broadcast seats released
    const io = req.app.get('io');
    if (io) {
      io.to(`show_${booking.show._id}`).emit('seats_unlocked', {
        showId: booking.show._id,
        seatNumbers: booking.seats,
        reason: 'booking_cancelled',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Seats have been returned to available pool.',
      refundTransactionId: refundTxnId,
      refundAmount: booking.finalAmount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
};

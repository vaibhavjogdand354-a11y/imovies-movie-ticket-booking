const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Seat must belong to a Show'],
    },
    seatNumber: {
      type: String, // e.g. A1, B4, H8
      required: [true, 'Seat number is required'],
      trim: true,
      uppercase: true,
    },
    row: {
      type: String, // A, B, C, etc.
      required: true,
      trim: true,
      uppercase: true,
    },
    column: {
      type: Number, // 1 to 8
      required: true,
    },
    tier: {
      type: String,
      enum: ['regular', 'executive', 'vip'],
      required: [true, 'Seat tier is required'],
      default: 'regular',
    },
    price: {
      type: Number,
      required: [true, 'Seat price is required'],
      min: [0, 'Seat price cannot be negative'],
    },
    status: {
      type: String,
      enum: ['available', 'locked', 'booked'],
      default: 'available',
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring a seat number cannot be duplicated inside the same show
seatSchema.index({ show: 1, seatNumber: 1 }, { unique: true });

// Step 7 Index: Compound index on show, status, and seatNumber for high-speed availability queries
seatSchema.index({ show: 1, status: 1, seatNumber: 1 });
seatSchema.index({ show: 1, status: 1 });

// Index on lockedUntil for fast cleanup and query filtering of expired locks
seatSchema.index({ lockedUntil: 1 });

/**
 * Static method to release all expired seat locks across a show (or globally)
 */
seatSchema.statics.releaseExpiredLocks = async function (showId) {
  const query = {
    status: 'locked',
    lockedUntil: { $lte: new Date() },
  };
  if (showId) {
    query.show = showId;
  }
  const result = await this.updateMany(query, {
    $set: {
      status: 'available',
      lockedBy: null,
      lockedUntil: null,
    },
  });
  return result;
};

module.exports = mongoose.model('Seat', seatSchema);

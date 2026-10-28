const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must be attached to a User'],
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Booking must reference a Show'],
    },
    seats: {
      type: [String], // Array of seat numbers: ['A1', 'A2']
      required: [true, 'At least one seat must be selected'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'A booking must have at least one seat',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    convenienceFee: {
      type: Number,
      required: true,
      default: 30, // Rs. 30 per ticket or fixed
    },
    taxAmount: {
      type: Number,
      required: true, // 18% GST on convenience fee
    },
    finalAmount: {
      type: Number,
      required: true,
      min: [0, 'Final amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking'],
      default: 'UPI',
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'failed'],
      default: 'confirmed',
    },
    isUpcoming: {
      type: Boolean,
      default: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Step 7 Index: Compound index on user, createdAt, and status for instant paginated booking history queries
bookingSchema.index({ user: 1, createdAt: -1, status: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });

// Compound index on show and status for capacity calculations
bookingSchema.index({ show: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

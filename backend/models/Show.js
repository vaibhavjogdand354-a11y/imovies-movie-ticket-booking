const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Show must be associated with a Movie'],
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Show must be associated with a Theatre'],
    },
    screenName: {
      type: String,
      required: [true, 'Please specify screen name (e.g. Audi 1, IMAX)'],
      trim: true,
      default: 'Audi 1',
    },
    date: {
      type: String, // Stored as YYYY-MM-DD for easy querying
      required: [true, 'Show date is required (YYYY-MM-DD)'],
      trim: true,
    },
    time: {
      type: String, // Stored as HH:mm (e.g. 14:30)
      required: [true, 'Show time is required (HH:mm)'],
      trim: true,
    },
    format: {
      type: String,
      enum: ['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX'],
      default: '2D',
    },
    pricing: {
      regular: {
        type: Number,
        required: [true, 'Please specify regular seat price'],
        min: [50, 'Minimum price is 50'],
        default: 180,
      },
      executive: {
        type: Number,
        required: [true, 'Please specify executive seat price'],
        min: [50, 'Minimum price is 50'],
        default: 280,
      },
      vip: {
        type: Number,
        required: [true, 'Please specify VIP seat price'],
        min: [50, 'Minimum price is 50'],
        default: 450,
      },
    },
    totalSeats: {
      type: Number,
      default: 64, // 8 rows (A-H) x 8 columns (1-8)
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on movie, theatre, and date for schedule lookups
showSchema.index({ movie: 1, theatre: 1, date: 1 });

// Compound index on date and time for timeline management
showSchema.index({ date: 1, time: 1 });

module.exports = mongoose.model('Show', showSchema);

const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide theatre name'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide theatre location/neighborhood'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide complete address'],
      trim: true,
    },
    facilities: {
      type: [String],
      default: ['Dolby Atmos', '4K Projection', 'Recliner Seats', 'Food & Beverages', 'Parking'],
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

// Compound index on city and name for location-based directory queries
theatreSchema.index({ city: 1, name: 1 });

module.exports = mongoose.model('Theatre', theatreSchema);

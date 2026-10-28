const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide movie title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide movie synopsis/description'],
      trim: true,
    },
    genre: {
      type: [String],
      required: [true, 'Please provide at least one genre'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A movie must have at least one genre',
      },
    },
    language: {
      type: String,
      required: [true, 'Please provide language'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Please provide runtime duration in minutes'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Please provide release date'],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [10, 'Rating cannot be greater than 10'],
    },
    certification: {
      type: String,
      enum: ['U', 'UA', 'A', 'R', 'PG-13', 'Universal', 'Adult'],
      default: 'UA',
    },
    director: {
      type: String,
      required: [true, 'Please provide director name'],
      trim: true,
    },
    cast: {
      type: [String],
      required: [true, 'Please provide cast members'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A movie must list at least one cast member',
      },
    },
    posterUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    },
    bannerUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1600&q=80',
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

// 1. Text index on title, description, and director for free-text search
movieSchema.index(
  { title: 'text', description: 'text', director: 'text' },
  { weights: { title: 5, director: 3, description: 1 }, name: 'MovieTextIndex' }
);

// 2. Compound index on genre, language, and releaseDate for catalog filters
movieSchema.index({ genre: 1, language: 1, releaseDate: -1 }, { name: 'MovieFilterCompoundIndex' });

// 3. Index on isActive for filtering active movies
movieSchema.index({ isActive: 1 });

module.exports = mongoose.model('Movie', movieSchema);

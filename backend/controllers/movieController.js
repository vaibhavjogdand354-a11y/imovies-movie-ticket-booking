const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');

/**
 * @desc    Get all movies with multi-criteria filtering, search, and pagination
 * @route   GET /api/movies
 * @access  Public
 * @query   genre, language, theatre, location (city), date, search, page, limit
 */
const getMovies = async (req, res, next) => {
  try {
    const { genre, language, theatre, location, date, search, page = 1, limit = 12 } = req.query;

    const query = { isActive: true };

    // 1. Text Search across title, description, and director
    if (search && search.trim() !== '') {
      query.$text = { $search: search.trim() };
    }

    // 2. Genre filter (matches if movie's genre array contains the genre)
    if (genre && genre !== 'All') {
      query.genre = { $in: [new RegExp(`^${genre}$`, 'i')] };
    }

    // 3. Language filter
    if (language && language !== 'All') {
      query.language = { $regex: new RegExp(`^${language}$`, 'i') };
    }

    // 4. Theatre, Location (City), and Date filters require Show lookups
    if (theatre || location || date) {
      const showMatch = { isActive: true };

      if (theatre && theatre !== 'All') {
        showMatch.theatre = theatre;
      }
      if (date) {
        showMatch.date = date;
      }

      if (location && location !== 'All') {
        const matchingTheatres = await Theatre.find({
          city: { $regex: new RegExp(`^${location}$`, 'i') },
        }).select('_id');
        const theatreIds = matchingTheatres.map((t) => t._id);
        if (showMatch.theatre) {
          // Both theatre & location specified
        } else {
          showMatch.theatre = { $in: theatreIds };
        }
      }

      const activeShows = await Show.find(showMatch).select('movie').distinct('movie');
      query._id = { $in: activeShows };
    }

    const currentPage = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 12;
    const skip = (currentPage - 1) * pageSize;

    const total = await Movie.countDocuments(query);
    const movies = await Movie.find(query)
      .sort({ releaseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    res.status(200).json({
      success: true,
      count: movies.length,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single movie by ID with grouped showtimes
 * @route   GET /api/movies/:id
 * @access  Public
 */
const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Fetch upcoming shows for this movie
    const today = new Date().toISOString().split('T')[0];
    const shows = await Show.find({
      movie: movie._id,
      isActive: true,
      date: { $gte: today },
    })
      .populate('theatre')
      .sort({ date: 1, time: 1 });

    // Group shows by Date and Theatre
    const scheduleByDate = {};
    shows.forEach((show) => {
      const { date } = show;
      if (!scheduleByDate[date]) {
        scheduleByDate[date] = {};
      }
      const theatreId = show.theatre._id.toString();
      if (!scheduleByDate[date][theatreId]) {
        scheduleByDate[date][theatreId] = {
          theatre: show.theatre,
          shows: [],
        };
      }
      scheduleByDate[date][theatreId].shows.push(show);
    });

    res.status(200).json({
      success: true,
      data: {
        movie,
        schedules: scheduleByDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new movie
 * @route   POST /api/movies
 * @access  Private/Admin
 */
const createMovie = async (req, res, next) => {
  try {
    const {
      title,
      description,
      genre,
      language,
      duration,
      releaseDate,
      rating,
      certification,
      director,
      cast,
      posterUrl,
      bannerUrl,
    } = req.body;

    let poster = posterUrl;
    if (req.file) {
      poster = `/uploads/${req.file.filename}`;
    }

    const movie = await Movie.create({
      title,
      description,
      genre: Array.isArray(genre) ? genre : genre ? genre.split(',').map((g) => g.trim()) : [],
      language,
      duration: Number(duration),
      releaseDate: new Date(releaseDate),
      rating: rating ? Number(rating) : 0,
      certification: certification || 'UA',
      director,
      cast: Array.isArray(cast) ? cast : cast ? cast.split(',').map((c) => c.trim()) : [],
      posterUrl: poster || undefined,
      bannerUrl: bannerUrl || undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Movie created successfully.',
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing movie
 * @route   PUT /api/movies/:id
 * @access  Private/Admin
 */
const updateMovie = async (req, res, next) => {
  try {
    let movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    const updateData = { ...req.body };
    if (req.file) {
      updateData.posterUrl = `/uploads/${req.file.filename}`;
    }
    if (updateData.genre && typeof updateData.genre === 'string') {
      updateData.genre = updateData.genre.split(',').map((g) => g.trim());
    }
    if (updateData.cast && typeof updateData.cast === 'string') {
      updateData.cast = updateData.cast.split(',').map((c) => c.trim());
    }

    movie = await Movie.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Movie updated successfully.',
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete movie
 * @route   DELETE /api/movies/:id
 * @access  Private/Admin
 */
const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    await Movie.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Movie deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dynamic distinct filter options (genres, languages, cities)
 * @route   GET /api/movies/filters/meta
 * @access  Public
 */
const getFilterMeta = async (req, res, next) => {
  try {
    const genres = await Movie.distinct('genre');
    const languages = await Movie.distinct('language');
    const cities = await Theatre.distinct('city');

    res.status(200).json({
      success: true,
      data: {
        genres: genres.sort(),
        languages: languages.sort(),
        cities: cities.sort(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getFilterMeta,
};

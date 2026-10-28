const Theatre = require('../models/Theatre');
const Show = require('../models/Show');

/**
 * @desc    Get all theatres (optional city filter)
 * @route   GET /api/theatres
 * @access  Public
 */
const getTheatres = async (req, res, next) => {
  try {
    const { city } = req.query;
    const filter = { isActive: true };
    if (city && city !== 'All') {
      filter.city = { $regex: new RegExp(`^${city}$`, 'i') };
    }

    const theatres = await Theatre.find(filter).sort({ city: 1, name: 1 });
    res.status(200).json({
      success: true,
      count: theatres.length,
      data: theatres,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single theatre by ID
 * @route   GET /api/theatres/:id
 * @access  Public
 */
const getTheatreById = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    const shows = await Show.find({ theatre: theatre._id, isActive: true })
      .populate('movie', 'title posterUrl duration rating certification language')
      .sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      data: {
        theatre,
        shows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new theatre
 * @route   POST /api/theatres
 * @access  Private/Admin
 */
const createTheatre = async (req, res, next) => {
  try {
    const { name, location, city, address, facilities } = req.body;
    const theatre = await Theatre.create({
      name,
      location,
      city,
      address,
      facilities: Array.isArray(facilities)
        ? facilities
        : facilities
        ? facilities.split(',').map((f) => f.trim())
        : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Theatre added successfully.',
      data: theatre,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update theatre
 * @route   PUT /api/theatres/:id
 * @access  Private/Admin
 */
const updateTheatre = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.facilities && typeof updateData.facilities === 'string') {
      updateData.facilities = updateData.facilities.split(',').map((f) => f.trim());
    }

    const theatre = await Theatre.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Theatre updated successfully.',
      data: theatre,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete theatre
 * @route   DELETE /api/theatres/:id
 * @access  Private/Admin
 */
const deleteTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
    }

    await Theatre.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Theatre deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
};

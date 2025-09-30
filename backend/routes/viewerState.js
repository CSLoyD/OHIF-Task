const express = require('express');
const { body, query, validationResult } = require('express-validator');
const ViewerState = require('../models/ViewerState');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const saveStateValidation = [
  body('studyInstanceUID')
    .notEmpty()
    .withMessage('Study Instance UID is required'),
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID is required'),
  body('state')
    .isObject()
    .withMessage('State must be an object')
];

const getStateValidation = [
  query('studyInstanceUID')
    .notEmpty()
    .withMessage('Study Instance UID is required')
];

// Save viewer state
router.post('/save', auth, saveStateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { studyInstanceUID, sessionId, state, autoSaved = false } = req.body;
    const userId = req.user._id;

    // Check for existing state with same user, study, and session
    let viewerState = await ViewerState.findOne({
      userId,
      studyInstanceUID,
      sessionId
    });

    if (viewerState) {
      // Update existing state
      viewerState.state = state;
      viewerState.autoSaved = autoSaved;
    } else {
      // Create new state
      viewerState = new ViewerState({
        userId,
        studyInstanceUID,
        sessionId,
        state,
        autoSaved
      });
    }

    await viewerState.save();

    // Cleanup old states (keep only latest 10 per user-study)
    await ViewerState.cleanupOldStates(userId, studyInstanceUID);

    res.json({
      message: 'Viewer state saved successfully',
      stateId: viewerState._id,
      version: viewerState.version,
      timestamp: viewerState.updatedAt
    });

  } catch (error) {
    console.error('Save state error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Concurrent modification detected. Please refresh and try again.'
      });
    }
    
    res.status(500).json({
      error: 'Failed to save viewer state',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get viewer state
router.get('/', auth, getStateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { studyInstanceUID, sessionId } = req.query;
    const userId = req.user._id;

    let query = { userId, studyInstanceUID };
    
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const viewerState = await ViewerState.findOne(query)
      .sort({ updatedAt: -1 })
      .exec();

    if (!viewerState) {
      return res.status(404).json({
        error: 'Viewer state not found'
      });
    }

    res.json({
      state: viewerState.state,
      stateId: viewerState._id,
      version: viewerState.version,
      sessionId: viewerState.sessionId,
      autoSaved: viewerState.autoSaved,
      createdAt: viewerState.createdAt,
      updatedAt: viewerState.updatedAt
    });

  } catch (error) {
    console.error('Get state error:', error);
    res.status(500).json({
      error: 'Failed to retrieve viewer state',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all states for a study
router.get('/history', auth, getStateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { studyInstanceUID } = req.query;
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    const states = await ViewerState.find({ userId, studyInstanceUID })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('sessionId version autoSaved createdAt updatedAt')
      .exec();

    const total = await ViewerState.countDocuments({ userId, studyInstanceUID });

    res.json({
      states,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    });

  } catch (error) {
    console.error('Get state history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve state history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete viewer state
router.delete('/:stateId', auth, async (req, res) => {
  try {
    const { stateId } = req.params;
    const userId = req.user._id;

    const viewerState = await ViewerState.findOne({
      _id: stateId,
      userId
    });

    if (!viewerState) {
      return res.status(404).json({
        error: 'Viewer state not found'
      });
    }

    await ViewerState.deleteOne({ _id: stateId });

    res.json({
      message: 'Viewer state deleted successfully'
    });

  } catch (error) {
    console.error('Delete state error:', error);
    res.status(500).json({
      error: 'Failed to delete viewer state',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Auto-save endpoint (higher frequency, minimal validation)
router.post('/auto-save', auth, async (req, res) => {
  try {
    const { studyInstanceUID, sessionId, state } = req.body;
    
    if (!studyInstanceUID || !sessionId || !state) {
      return res.status(400).json({
        error: 'Missing required fields for auto-save'
      });
    }

    const userId = req.user._id;

    // Use upsert for auto-save to handle concurrent requests
    const result = await ViewerState.findOneAndUpdate(
      { userId, studyInstanceUID, sessionId },
      { 
        state, 
        autoSaved: true,
        $inc: { version: 1 }
      },
      { 
        upsert: true, 
        new: true,
        runValidators: false // Skip validation for performance
      }
    );

    res.json({
      success: true,
      stateId: result._id,
      version: result.version
    });

  } catch (error) {
    console.error('Auto-save error:', error);
    // Don't fail auto-save requests, just log the error
    res.json({
      success: false,
      error: 'Auto-save failed'
    });
  }
});

// Get user's recent studies with states
router.get('/recent-studies', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const recentStudies = await ViewerState.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$studyInstanceUID',
          lastAccessed: { $max: '$updatedAt' },
          sessionCount: { $sum: 1 },
          hasAutoSave: { $max: '$autoSaved' }
        }
      },
      { $sort: { lastAccessed: -1 } },
      { $limit: limit }
    ]);

    res.json({
      studies: recentStudies.map(study => ({
        studyInstanceUID: study._id,
        lastAccessed: study.lastAccessed,
        sessionCount: study.sessionCount,
        hasAutoSave: study.hasAutoSave
      }))
    });

  } catch (error) {
    console.error('Get recent studies error:', error);
    res.status(500).json({
      error: 'Failed to retrieve recent studies',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

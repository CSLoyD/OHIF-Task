const express = require('express');
const { body, query, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Annotation = require('../models/Annotation');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/audio');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Validation rules
const createAnnotationValidation = [
  body('studyInstanceUID')
    .notEmpty()
    .withMessage('Study Instance UID is required'),
  body('tooth.system')
    .isIn(['FDI', 'Universal'])
    .withMessage('Invalid tooth system'),
  body('tooth.value')
    .notEmpty()
    .withMessage('Tooth value is required'),
  body('category')
    .isIn(['diagnosis', 'treatment', 'observation', 'note'])
    .withMessage('Invalid category'),
  body('content.text')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Text content must be between 1 and 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each tag must be less than 50 characters')
];

const updateAnnotationValidation = [
  body('content.text')
    .optional()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Text content must be between 1 and 2000 characters'),
  body('category')
    .optional()
    .isIn(['diagnosis', 'treatment', 'observation', 'note'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['draft', 'final', 'reviewed', 'archived'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

// Create annotation
router.post('/', auth, upload.single('audio'), createAnnotationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      studyInstanceUID,
      seriesInstanceUID,
      sopInstanceUID,
      tooth,
      category,
      content,
      metadata,
      priority,
      tags,
      isPrivate
    } = req.body;

    const annotationData = {
      userId: req.user._id,
      studyInstanceUID,
      seriesInstanceUID,
      sopInstanceUID,
      tooth: typeof tooth === 'string' ? JSON.parse(tooth) : tooth,
      category,
      content: typeof content === 'string' ? JSON.parse(content) : content,
      metadata: metadata ? (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) : {},
      priority: priority || 'normal',
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      isPrivate: isPrivate === 'true' || isPrivate === true
    };

    // Handle audio file if uploaded
    if (req.file) {
      annotationData.content.audioData = {
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/api/annotations/audio/${req.file.filename}`
      };
    }

    const annotation = new Annotation(annotationData);
    await annotation.save();

    // Populate user info for response
    await annotation.populate('userId', 'profile.firstName profile.lastName');

    res.status(201).json({
      message: 'Annotation created successfully',
      annotation
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    console.error('Create annotation error:', error);
    res.status(500).json({
      error: 'Failed to create annotation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get annotations
router.get('/', auth, async (req, res) => {
  try {
    const {
      studyInstanceUID,
      toothSystem,
      toothValue,
      category,
      status,
      priority,
      tags,
      search,
      limit = 50,
      skip = 0
    } = req.query;

    const userId = req.user._id;
    let query = { userId };

    // Build query filters
    if (studyInstanceUID) query.studyInstanceUID = studyInstanceUID;
    if (toothSystem && toothValue) {
      query['tooth.system'] = toothSystem;
      query['tooth.value'] = toothValue;
    }
    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const annotations = await Annotation.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('userId', 'profile.firstName profile.lastName')
      .populate('reviewedBy.userId', 'profile.firstName profile.lastName')
      .exec();

    const total = await Annotation.countDocuments(query);

    res.json({
      annotations,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Get annotations error:', error);
    res.status(500).json({
      error: 'Failed to retrieve annotations',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get annotation by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const annotation = await Annotation.findById(req.params.id)
      .populate('userId', 'profile.firstName profile.lastName')
      .populate('reviewedBy.userId', 'profile.firstName profile.lastName')
      .populate('sharedWith.userId', 'profile.firstName profile.lastName')
      .exec();

    if (!annotation) {
      return res.status(404).json({
        error: 'Annotation not found'
      });
    }

    // Check access permissions
    if (!annotation.canAccess(req.user._id)) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    res.json({ annotation });

  } catch (error) {
    console.error('Get annotation error:', error);
    res.status(500).json({
      error: 'Failed to retrieve annotation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update annotation
router.put('/:id', auth, updateAnnotationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const annotation = await Annotation.findById(req.params.id);

    if (!annotation) {
      return res.status(404).json({
        error: 'Annotation not found'
      });
    }

    // Check write permissions
    if (!annotation.canAccess(req.user._id, 'write')) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Update allowed fields
    const allowedUpdates = ['content', 'category', 'status', 'priority', 'tags', 'metadata', 'isPrivate'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(annotation, updates);
    await annotation.save();

    await annotation.populate('userId', 'profile.firstName profile.lastName');

    res.json({
      message: 'Annotation updated successfully',
      annotation
    });

  } catch (error) {
    console.error('Update annotation error:', error);
    res.status(500).json({
      error: 'Failed to update annotation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete annotation
router.delete('/:id', auth, async (req, res) => {
  try {
    const annotation = await Annotation.findById(req.params.id);

    if (!annotation) {
      return res.status(404).json({
        error: 'Annotation not found'
      });
    }

    // Only owner can delete
    if (annotation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied. Only the owner can delete this annotation.'
      });
    }

    // Delete associated audio file if exists
    if (annotation.content.audioData?.filename) {
      const audioPath = path.join(__dirname, '../uploads/audio', annotation.content.audioData.filename);
      await fs.unlink(audioPath).catch(console.error);
    }

    await Annotation.deleteOne({ _id: req.params.id });

    res.json({
      message: 'Annotation deleted successfully'
    });

  } catch (error) {
    console.error('Delete annotation error:', error);
    res.status(500).json({
      error: 'Failed to delete annotation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get annotations by tooth
router.get('/tooth/:system/:value', auth, async (req, res) => {
  try {
    const { system, value } = req.params;
    const { studyInstanceUID, category, status } = req.query;

    const annotations = await Annotation.findByTooth(
      req.user._id,
      system,
      value,
      { studyInstanceUID, category, status }
    );

    res.json({ annotations });

  } catch (error) {
    console.error('Get tooth annotations error:', error);
    res.status(500).json({
      error: 'Failed to retrieve tooth annotations',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get annotation statistics
router.get('/stats/:studyInstanceUID', auth, async (req, res) => {
  try {
    const { studyInstanceUID } = req.params;
    const stats = await Annotation.getStats(req.user._id, studyInstanceUID);

    res.json({
      stats: stats[0] || {
        total: 0,
        byCategory: [],
        byStatus: [],
        byPriority: []
      }
    });

  } catch (error) {
    console.error('Get annotation stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve annotation statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Serve audio files
router.get('/audio/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const audioPath = path.join(__dirname, '../uploads/audio', filename);

    // Verify file exists and user has access
    const annotation = await Annotation.findOne({
      'content.audioData.filename': filename
    });

    if (!annotation) {
      return res.status(404).json({
        error: 'Audio file not found'
      });
    }

    if (!annotation.canAccess(req.user._id)) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Check if file exists
    try {
      await fs.access(audioPath);
    } catch {
      return res.status(404).json({
        error: 'Audio file not found on disk'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', annotation.content.audioData.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Stream the file
    res.sendFile(audioPath);

  } catch (error) {
    console.error('Serve audio error:', error);
    res.status(500).json({
      error: 'Failed to serve audio file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Share annotation
router.post('/:id/share', auth, [
  body('userIds')
    .isArray()
    .withMessage('User IDs must be an array'),
  body('permission')
    .isIn(['read', 'write'])
    .withMessage('Permission must be read or write')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const annotation = await Annotation.findById(req.params.id);

    if (!annotation) {
      return res.status(404).json({
        error: 'Annotation not found'
      });
    }

    // Only owner can share
    if (annotation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied. Only the owner can share this annotation.'
      });
    }

    const { userIds, permission } = req.body;

    // Add new shared users
    userIds.forEach(userId => {
      const existingShare = annotation.sharedWith.find(
        share => share.userId.toString() === userId
      );

      if (existingShare) {
        existingShare.permission = permission;
      } else {
        annotation.sharedWith.push({
          userId,
          permission,
          sharedAt: new Date()
        });
      }
    });

    await annotation.save();

    res.json({
      message: 'Annotation shared successfully',
      sharedWith: annotation.sharedWith
    });

  } catch (error) {
    console.error('Share annotation error:', error);
    res.status(500).json({
      error: 'Failed to share annotation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

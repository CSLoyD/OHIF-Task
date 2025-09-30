const mongoose = require('mongoose');

const viewerStateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studyInstanceUID: {
    type: String,
    required: true,
    trim: true
  },
  sessionId: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    // Viewport configurations
    viewports: [{
      viewportId: String,
      displaySetInstanceUID: String,
      imageIndex: Number,
      zoom: Number,
      pan: {
        x: Number,
        y: Number
      },
      rotation: Number,
      flip: {
        horizontal: Boolean,
        vertical: Boolean
      },
      windowLevel: {
        width: Number,
        center: Number
      },
      colormap: String,
      invert: Boolean
    }],
    
    // Layout configuration
    layout: {
      numRows: {
        type: Number,
        default: 2
      },
      numCols: {
        type: Number,
        default: 2
      },
      activeViewportId: String
    },
    
    // Tool states
    tools: {
      activeTool: String,
      toolStates: mongoose.Schema.Types.Mixed
    },
    
    // Measurements
    measurements: [{
      id: String,
      toolName: String,
      data: mongoose.Schema.Types.Mixed,
      metadata: {
        tooth: String,
        category: String,
        notes: String
      }
    }],
    
    // Dental-specific state
    dental: {
      selectedTooth: {
        system: {
          type: String,
          enum: ['FDI', 'Universal'],
          default: 'FDI'
        },
        value: String
      },
      theme: {
        type: String,
        enum: ['standard', 'dental'],
        default: 'dental'
      },
      hangingProtocol: String
    },
    
    // Custom metadata
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Auto-save tracking
  autoSaved: {
    type: Boolean,
    default: false
  },
  
  // Version for optimistic locking
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes for performance
viewerStateSchema.index({ userId: 1, studyInstanceUID: 1 });
viewerStateSchema.index({ sessionId: 1 });
viewerStateSchema.index({ userId: 1, updatedAt: -1 });

// Compound index for unique user-study-session combination
viewerStateSchema.index({ 
  userId: 1, 
  studyInstanceUID: 1, 
  sessionId: 1 
}, { unique: true });

// Pre-save middleware to increment version
viewerStateSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// Static method to find latest state for user and study
viewerStateSchema.statics.findLatestForStudy = function(userId, studyInstanceUID) {
  return this.findOne({ userId, studyInstanceUID })
    .sort({ updatedAt: -1 })
    .exec();
};

// Static method to cleanup old states (keep only latest 10 per user-study)
viewerStateSchema.statics.cleanupOldStates = async function(userId, studyInstanceUID) {
  const states = await this.find({ userId, studyInstanceUID })
    .sort({ updatedAt: -1 })
    .skip(10)
    .select('_id')
    .exec();
  
  if (states.length > 0) {
    const idsToDelete = states.map(state => state._id);
    await this.deleteMany({ _id: { $in: idsToDelete } });
  }
};

module.exports = mongoose.model('ViewerState', viewerStateSchema);

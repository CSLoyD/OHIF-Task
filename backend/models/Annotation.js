const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema({
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
  seriesInstanceUID: {
    type: String,
    trim: true
  },
  sopInstanceUID: {
    type: String,
    trim: true
  },
  tooth: {
    system: {
      type: String,
      enum: ['FDI', 'Universal'],
      required: true
    },
    value: {
      type: String,
      required: true,
      trim: true
    }
  },
  category: {
    type: String,
    enum: ['diagnosis', 'treatment', 'observation', 'note'],
    required: true
  },
  content: {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    audioData: {
      filename: String,
      mimeType: String,
      size: Number,
      duration: Number, // in seconds
      url: String
    }
  },
  metadata: {
    coordinates: {
      x: Number,
      y: Number,
      z: Number
    },
    imageIndex: Number,
    viewportId: String,
    toolName: String,
    measurements: [{
      type: String,
      value: Number,
      unit: String
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'final', 'reviewed', 'archived'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reviewedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    comments: String
  }
}, {
  timestamps: true
});

// Indexes for performance
annotationSchema.index({ userId: 1, studyInstanceUID: 1 });
annotationSchema.index({ 'tooth.system': 1, 'tooth.value': 1 });
annotationSchema.index({ category: 1 });
annotationSchema.index({ status: 1 });
annotationSchema.index({ priority: 1 });
annotationSchema.index({ tags: 1 });
annotationSchema.index({ createdAt: -1 });

// Compound indexes
annotationSchema.index({ 
  userId: 1, 
  studyInstanceUID: 1, 
  'tooth.system': 1, 
  'tooth.value': 1 
});

// Text search index
annotationSchema.index({ 
  'content.text': 'text',
  tags: 'text'
});

// Virtual for tooth display
annotationSchema.virtual('toothDisplay').get(function() {
  return `${this.tooth.system} ${this.tooth.value}`;
});

// Static method to find annotations by tooth
annotationSchema.statics.findByTooth = function(userId, toothSystem, toothValue, options = {}) {
  const query = {
    userId,
    'tooth.system': toothSystem,
    'tooth.value': toothValue
  };
  
  if (options.studyInstanceUID) {
    query.studyInstanceUID = options.studyInstanceUID;
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('userId', 'profile.firstName profile.lastName')
    .populate('reviewedBy.userId', 'profile.firstName profile.lastName');
};

// Static method to get annotation statistics
annotationSchema.statics.getStats = function(userId, studyInstanceUID) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId), studyInstanceUID } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byCategory: {
          $push: {
            category: '$category',
            count: 1
          }
        },
        byStatus: {
          $push: {
            status: '$status',
            count: 1
          }
        },
        byPriority: {
          $push: {
            priority: '$priority',
            count: 1
          }
        }
      }
    }
  ]);
};

// Method to check if user can access annotation
annotationSchema.methods.canAccess = function(userId, permission = 'read') {
  // Owner always has access
  if (this.userId.toString() === userId.toString()) {
    return true;
  }
  
  // Check if annotation is private
  if (this.isPrivate) {
    return false;
  }
  
  // Check shared permissions
  const sharedEntry = this.sharedWith.find(
    entry => entry.userId.toString() === userId.toString()
  );
  
  if (!sharedEntry) {
    return false;
  }
  
  if (permission === 'write') {
    return sharedEntry.permission === 'write';
  }
  
  return true; // read access
};

// Pre-save middleware
annotationSchema.pre('save', function(next) {
  // Ensure tags are unique and lowercase
  if (this.tags) {
    this.tags = [...new Set(this.tags.map(tag => tag.toLowerCase()))];
  }
  
  next();
});

module.exports = mongoose.model('Annotation', annotationSchema);

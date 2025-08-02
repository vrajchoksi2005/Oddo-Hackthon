const mongoose = require('mongoose');
const { ISSUE_CATEGORIES, ISSUE_STATUSES } = require('../config/constants');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ISSUE_CATEGORIES
  },
  status: {
    type: String,
    enum: ISSUE_STATUSES,
    default: 'Reported'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.isAnonymous; }
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates are required'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates format'
      }
    }
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  images: [{
    type: String,
    validate: {
      validator: function(images) {
        return images.length <= 5;
      },
      message: 'Maximum 5 images allowed per issue'
    }
  }],
  spamVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  spamVotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVisible: {
    type: Boolean,
    default: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  estimatedResolutionTime: {
    type: Date
  },
  actualResolutionTime: {
    type: Date
  },
  adminNotes: {
    type: String,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  lastStatusUpdate: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  },
  upvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Geospatial index for location-based queries
issueSchema.index({ location: '2dsphere' });

// Compound indexes for common queries
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ isVisible: 1, createdAt: -1 });
issueSchema.index({ user: 1, createdAt: -1 });
issueSchema.index({ spamVotes: 1, isVisible: 1 });

// Auto-hide if spam threshold reached
issueSchema.pre('save', function(next) {
  if (this.spamVotes >= 3 && this.isVisible) {
    this.isVisible = false;
  }
  next();
});

// Update lastStatusUpdate when status changes
issueSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.lastStatusUpdate = new Date();
    if (this.status === 'Resolved') {
      this.actualResolutionTime = new Date();
    }
  }
  next();
});

// Virtual for getting reporter info
issueSchema.virtual('reporter', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
issueSchema.set('toJSON', { virtuals: true });
issueSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Issue', issueSchema);

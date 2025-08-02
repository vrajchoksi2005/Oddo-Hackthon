const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Reported', 'In Progress', 'Resolved']
  },
  previousStatus: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved']
  },
  note: {
    type: String,
    maxlength: [500, 'Note cannot exceed 500 characters']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow null for anonymous issues
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    estimatedResolutionTime: Date,
    priority: String,
    adminNotes: String
  }
}, {
  timestamps: true
});

// Index for faster queries
activityLogSchema.index({ issueId: 1, timestamp: -1 });
activityLogSchema.index({ updatedBy: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);

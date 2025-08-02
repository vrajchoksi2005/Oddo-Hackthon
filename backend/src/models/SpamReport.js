const mongoose = require('mongoose');

const spamReportSchema = new mongoose.Schema({
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['Inappropriate Content', 'Fake Report', 'Duplicate', 'Spam', 'Other'],
    required: true
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Action Taken', 'Dismissed'],
    default: 'Pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  actionTaken: {
    type: String,
    maxlength: [300, 'Action taken description cannot exceed 300 characters']
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate spam reports
spamReportSchema.index({ issueId: 1, reportedBy: 1 }, { unique: true });
spamReportSchema.index({ status: 1 });

module.exports = mongoose.model('SpamReport', spamReportSchema);

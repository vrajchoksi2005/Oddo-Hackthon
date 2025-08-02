const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issue.controller');
const { auth, optionalAuth } = require('../middlewares/auth');
const { requireUser } = require('../middlewares/role');
const { validate, issueCreateSchema, issueUpdateSchema, spamReportSchema } = require('../middlewares/validate');
const { upload } = require('../utils/fileUtils');

// @route   GET /api/issues
// @desc    Get all issues with filters
// @access  Public
router.get('/', issueController.getIssues);

// @route   GET /api/issues/nearby
// @desc    Get nearby issues
// @access  Public
router.get('/nearby', issueController.getNearbyIssues);

// @route   POST /api/issues
// @desc    Create a new issue
// @access  Public (with optional auth for non-anonymous)
router.post(
  '/',
  optionalAuth,
  upload.array('images', 5),
  validate(issueCreateSchema),
  issueController.createIssue
);

// @route   GET /api/issues/:id
// @desc    Get issue by ID
// @access  Public
router.get('/:id', issueController.getIssueById);

// @route   PATCH /api/issues/:id/status
// @desc    Update issue status (Admin only)
// @access  Private (Admin)
router.patch(
  '/:id/status',
  auth,
  requireUser,
  validate(issueUpdateSchema),
  issueController.updateIssueStatus
);

// @route   POST /api/issues/:id/spam
// @desc    Report issue as spam
// @access  Private
router.post(
  '/:id/spam',
  auth,
  requireUser,
  validate(spamReportSchema),
  issueController.reportSpam
);

// @route   POST /api/issues/:id/upvote
// @desc    Upvote/downvote an issue
// @access  Private
router.post('/:id/upvote', auth, requireUser, issueController.upvoteIssue);

// @route   GET /api/issues/:id/activity
// @desc    Get issue activity timeline
// @access  Public
router.get('/:id/activity', issueController.getIssueActivity);

// @route   DELETE /api/issues/:id
// @desc    Delete an issue
// @access  Private (Owner or Admin)
router.delete('/:id', auth, requireUser, issueController.deleteIssue);

module.exports = router;

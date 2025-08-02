const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { auth } = require('../middlewares/auth');
const { requireUser } = require('../middlewares/role');

// @route   GET /api/users/stats
// @desc    Get current user statistics
// @access  Private
router.get('/stats', auth, requireUser, userController.getUserStats);

// @route   GET /api/users/issues
// @desc    Get current user's issues
// @access  Private
router.get('/issues', auth, requireUser, userController.getUserIssues);

// @route   GET /api/users/spam-reports
// @desc    Get current user's spam reports
// @access  Private
router.get('/spam-reports', auth, requireUser, userController.getSpamReports);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, requireUser, userController.updateProfile);

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, requireUser, userController.deleteAccount);

// @route   GET /api/users/:userId/profile
// @desc    Get public user profile
// @access  Public
router.get('/:userId/profile', userController.getPublicProfile);

module.exports = router;

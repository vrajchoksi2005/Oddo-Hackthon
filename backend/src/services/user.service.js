const User = require('../models/User');
const Issue = require('../models/Issue');
const SpamReport = require('../models/SpamReport');

class UserService {
  async getUserStats(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const issuesCount = await Issue.countDocuments({ user: userId });
    const resolvedIssues = await Issue.countDocuments({ 
      user: userId, 
      status: 'Resolved' 
    });
    const pendingIssues = await Issue.countDocuments({ 
      user: userId, 
      status: { $in: ['Reported', 'In Progress'] }
    });

    return {
      user: user.toJSON(),
      stats: {
        totalIssues: issuesCount,
        resolvedIssues,
        pendingIssues,
        spamReports: user.spamReports
      }
    };
  }

  async getUserIssues(userId, filters = {}, pagination = {}) {
    const { status, category } = filters;
    const { page = 1, limit = 10 } = pagination;

    let query = { user: userId, isVisible: true };

    if (status) query.status = status;
    if (category) query.category = category;

    const skip = (page - 1) * limit;
    const totalIssues = await Issue.countDocuments(query);

    const issues = await Issue.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return {
      issues,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalIssues / limit),
        totalIssues
      }
    };
  }

  async getSpamReports(userId) {
    const reports = await SpamReport.find({ reportedBy: userId })
      .populate('issueId', 'title description')
      .sort({ createdAt: -1 });

    return reports;
  }

  async updateUserProfile(userId, updateData) {
    const allowedUpdates = ['username', 'phone'];
    const updates = {};

    for (const key of allowedUpdates) {
      if (updateData[key]) {
        updates[key] = updateData[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user.toJSON();
  }

  async deleteUserAccount(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Mark user's issues as anonymous
    await Issue.updateMany(
      { user: userId },
      { 
        $unset: { user: 1 },
        isAnonymous: true 
      }
    );

    // Delete spam reports by this user
    await SpamReport.deleteMany({ reportedBy: userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    return { message: 'Account deleted successfully' };
  }
}

module.exports = new UserService();

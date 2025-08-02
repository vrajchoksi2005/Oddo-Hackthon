const userService = require('../services/user.service');

class UserController {
  async getUserStats(req, res, next) {
    try {
      const userId = req.user._id;
      const result = await userService.getUserStats(userId);

      res.json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserIssues(req, res, next) {
    try {
      const userId = req.user._id;
      const filters = {
        status: req.query.status,
        category: req.query.category
      };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await userService.getUserIssues(userId, filters, pagination);

      res.json({
        success: true,
        message: 'User issues retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getSpamReports(req, res, next) {
    try {
      const userId = req.user._id;
      const reports = await userService.getSpamReports(userId);

      res.json({
        success: true,
        message: 'Spam reports retrieved successfully',
        data: { reports }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user._id;
      const user = await userService.updateUserProfile(userId, req.body);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req, res, next) {
    try {
      const userId = req.user._id;
      const result = await userService.deleteUserAccount(userId);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicProfile(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await userService.getUserStats(userId);

      // Return only public information
      res.json({
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user: {
            _id: result.user._id,
            username: result.user.username,
            createdAt: result.user.createdAt
          },
          stats: {
            totalIssues: result.stats.totalIssues,
            resolvedIssues: result.stats.resolvedIssues
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

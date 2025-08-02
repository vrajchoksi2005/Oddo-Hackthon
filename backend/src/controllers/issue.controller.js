const issueService = require('../services/issue.service');
const { deleteLocalFile } = require('../utils/fileUtils');

class IssueController {
  async createIssue(req, res, next) {
    try {
      const issueData = req.body;
      const files = req.files;
      const userId = req.user ? req.user._id : null;

      // Validate that coordinates are provided as array
      if (typeof issueData.coordinates === 'string') {
        issueData.coordinates = JSON.parse(issueData.coordinates);
      }

      const issue = await issueService.createIssue(issueData, files, userId);

      res.status(201).json({
        success: true,
        message: 'Issue reported successfully',
        data: { issue }
      });
    } catch (error) {
      // Clean up uploaded files on error
      if (req.files) {
        req.files.forEach(file => deleteLocalFile(file.path));
      }
      next(error);
    }
  }

  async getIssues(req, res, next) {
    try {
      const filters = {
        lat: req.query.lat,
        lng: req.query.lng,
        distance: req.query.distance,
        category: req.query.category,
        status: req.query.status,
        search: req.query.search,
        userId: req.query.userId
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await issueService.getIssues(filters, pagination);

      res.json({
        success: true,
        message: 'Issues retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getIssueById(req, res, next) {
    try {
      const { id } = req.params;
      const issue = await issueService.getIssueById(id);

      res.json({
        success: true,
        message: 'Issue retrieved successfully',
        data: { issue }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateIssueStatus(req, res, next) {
    try {
      const { id } = req.params;
      const statusData = req.body;
      const adminId = req.user._id;

      const issue = await issueService.updateIssueStatus(id, statusData, adminId);

      res.json({
        success: true,
        message: 'Issue status updated successfully',
        data: { issue }
      });
    } catch (error) {
      next(error);
    }
  }

  async reportSpam(req, res, next) {
    try {
      const { id } = req.params;
      const reportData = req.body;
      const userId = req.user._id;

      const result = await issueService.reportSpam(id, reportData, userId);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async upvoteIssue(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const result = await issueService.upvoteIssue(id, userId);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async getIssueActivity(req, res, next) {
    try {
      const { id } = req.params;
      const activities = await issueService.getIssueActivity(id);

      res.json({
        success: true,
        message: 'Issue activity retrieved successfully',
        data: { activities }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteIssue(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const isAdmin = req.user.role === 'admin';

      const result = await issueService.deleteIssue(id, userId, isAdmin);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async getNearbyIssues(req, res, next) {
    try {
      const { lat, lng } = req.query;
      const distance = req.query.distance || 5000; // Default 5km

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const filters = { lat, lng, distance, isVisible: true };
      const result = await issueService.getIssues(filters);

      res.json({
        success: true,
        message: 'Nearby issues retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IssueController();

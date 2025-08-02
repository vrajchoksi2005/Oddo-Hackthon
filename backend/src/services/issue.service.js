const Issue = require('../models/Issue');
const ActivityLog = require('../models/ActivityLog');
const SpamReport = require('../models/SpamReport');
const User = require('../models/User');
const { buildGeoQuery, buildGeoAggregation, reverseGeocode } = require('../utils/geoUtils');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { deleteLocalFile, extractPublicId } = require('../utils/fileUtils');
const { PAGINATION, SPAM_THRESHOLD } = require('../config/constants');

class IssueService {
  async createIssue(issueData, files, userId) {
    const { title, description, category, coordinates, address, isAnonymous } = issueData;

    // Upload images to Cloudinary
    let imageUrls = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const imageUrl = await uploadToCloudinary(file.path, 'civictrack/issues');
          imageUrls.push(imageUrl);
          deleteLocalFile(file.path); // Clean up local file
        } catch (error) {
          // Clean up any uploaded images on failure
          for (const url of imageUrls) {
            const publicId = extractPublicId(url);
            if (publicId) await deleteFromCloudinary(publicId);
          }
          throw new Error(`Image upload failed: ${error.message}`);
        }
      }
    }

    // Create issue
    const issue = new Issue({
      title,
      description,
      category,
      location: {
        type: 'Point',
        coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])]
      },
      address: address || await reverseGeocode(coordinates[1], coordinates[0]),
      images: imageUrls,
      isAnonymous: isAnonymous || false,
      user: isAnonymous ? null : userId
    });

    await issue.save();

    // Update user's issue count
    if (!isAnonymous && userId) {
      await User.findByIdAndUpdate(userId, { $inc: { issuesReported: 1 } });
    }

    // Log initial activity
    await new ActivityLog({
      issueId: issue._id,
      status: 'Reported',
      updatedBy: isAnonymous ? null : userId,
      note: 'Issue reported'
    }).save();

    return await this.getIssueById(issue._id);
  }

  async getIssues(filters = {}, pagination = {}) {
    const {
      lat,
      lng,
      distance,
      category,
      status,
      search,
      userId,
      isVisible = true
    } = filters;

    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT
    } = pagination;

    const skip = (page - 1) * limit;

    // If location-based filtering is required, use aggregation pipeline
    if (lat && lng) {
      const pipeline = buildGeoAggregation(lat, lng, distance);
      
      // Add match stage for other filters
      const matchStage = { isVisible };
      if (category) matchStage.category = category;
      if (status) matchStage.status = status;
      if (userId) matchStage.user = userId;
      if (search) {
        matchStage.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } }
        ];
      }
      
      pipeline.push({ $match: matchStage });
      pipeline.push({ $sort: { createdAt: -1 } });
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: parseInt(limit) });
      
      // Add lookup for user data
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { username: 1 } }]
        }
      });
      
      pipeline.push({
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      });

      const issues = await Issue.aggregate(pipeline);
      
      // Get total count for pagination
      const countPipeline = buildGeoAggregation(lat, lng, distance);
      countPipeline.push({ $match: matchStage });
      countPipeline.push({ $count: "total" });
      const countResult = await Issue.aggregate(countPipeline);
      const totalIssues = countResult.length > 0 ? countResult[0].total : 0;

      return {
        issues,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalIssues / limit),
          totalIssues,
          hasNextPage: page < Math.ceil(totalIssues / limit),
          hasPrevPage: page > 1
        }
      };
    } else {
      // Regular query without geo filtering
      let query = { isVisible };

      // Category filter
      if (category) {
        query.category = category;
      }

      // Status filter
      if (status) {
        query.status = status;
      }

      // User filter
      if (userId) {
        query.user = userId;
      }

      // Text search
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { address: { $regex: search, $options: 'i' } }
        ];
      }

      const totalIssues = await Issue.countDocuments(query);

      const issues = await Issue.find(query)
        .populate('user', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      return {
        issues,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalIssues / limit),
          totalIssues,
          hasNextPage: page < Math.ceil(totalIssues / limit),
          hasPrevPage: page > 1
        }
      };
    }
  }

  async getIssueById(issueId) {
    const issue = await Issue.findById(issueId)
      .populate('user', 'username email')
      .populate('upvotedBy', 'username');

    if (!issue) {
      throw new Error('Issue not found');
    }

    // Increment view count
    await Issue.findByIdAndUpdate(issueId, { $inc: { views: 1 } });

    return issue;
  }

  async updateIssueStatus(issueId, statusData, adminId) {
    const { status, note, priority, estimatedResolutionTime, adminNotes } = statusData;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      throw new Error('Issue not found');
    }

    // Validate status transition
    const validTransitions = {
      'Reported': ['In Progress', 'Resolved'],
      'In Progress': ['Resolved'],
      'Resolved': []
    };

    if (!validTransitions[issue.status].includes(status)) {
      throw new Error(`Invalid status transition from ${issue.status} to ${status}`);
    }

    const previousStatus = issue.status;
    
    // Update issue
    const updateData = { 
      status,
      lastStatusUpdate: new Date()
    };

    if (priority) updateData.priority = priority;
    if (estimatedResolutionTime) updateData.estimatedResolutionTime = estimatedResolutionTime;
    if (adminNotes) updateData.adminNotes = adminNotes;

    const updatedIssue = await Issue.findByIdAndUpdate(
      issueId,
      updateData,
      { new: true }
    ).populate('user', 'username email');

    // Log activity
    await new ActivityLog({
      issueId,
      status,
      previousStatus,
      note,
      updatedBy: adminId,
      metadata: {
        priority,
        estimatedResolutionTime,
        adminNotes
      }
    }).save();

    return updatedIssue;
  }

  async reportSpam(issueId, reportData, userId) {
    const { reason, description } = reportData;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      throw new Error('Issue not found');
    }

    // Check if user already reported this issue
    const existingReport = await SpamReport.findOne({
      issueId,
      reportedBy: userId
    });

    if (existingReport) {
      throw new Error('You have already reported this issue');
    }

    // Create spam report
    await new SpamReport({
      issueId,
      reportedBy: userId,
      reason,
      description
    }).save();

    // Update issue spam count and check if it should be hidden
    const updatedIssue = await Issue.findByIdAndUpdate(
      issueId,
      { 
        $inc: { spamVotes: 1 },
        $addToSet: { spamVotedBy: userId }
      },
      { new: true }
    );

    // Auto-hide if spam threshold reached
    if (updatedIssue.spamVotes >= SPAM_THRESHOLD) {
      await Issue.findByIdAndUpdate(issueId, { isVisible: false });
      
      // Update reporter's spam count
      if (updatedIssue.user) {
        await User.findByIdAndUpdate(updatedIssue.user, { $inc: { spamReports: 1 } });
      }
    }

    return { message: 'Issue reported for spam' };
  }

  async upvoteIssue(issueId, userId) {
    const issue = await Issue.findById(issueId);
    if (!issue) {
      throw new Error('Issue not found');
    }

    const hasUpvoted = issue.upvotedBy.includes(userId);

    if (hasUpvoted) {
      // Remove upvote
      await Issue.findByIdAndUpdate(
        issueId,
        {
          $pull: { upvotedBy: userId },
          $inc: { upvotes: -1 }
        }
      );
      return { message: 'Upvote removed' };
    } else {
      // Add upvote
      await Issue.findByIdAndUpdate(
        issueId,
        {
          $addToSet: { upvotedBy: userId },
          $inc: { upvotes: 1 }
        }
      );
      return { message: 'Issue upvoted' };
    }
  }

  async getIssueActivity(issueId) {
    const activities = await ActivityLog.find({ issueId })
      .populate('updatedBy', 'username')
      .sort({ timestamp: 1 });

    return activities;
  }

  async deleteIssue(issueId, userId, isAdmin = false) {
    const issue = await Issue.findById(issueId);
    if (!issue) {
      throw new Error('Issue not found');
    }

    // Check permissions
    if (!isAdmin && (!issue.user || issue.user.toString() !== userId)) {
      throw new Error('Not authorized to delete this issue');
    }

    // Delete images from Cloudinary
    for (const imageUrl of issue.images) {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    // Delete related data
    await ActivityLog.deleteMany({ issueId });
    await SpamReport.deleteMany({ issueId });
    await Issue.findByIdAndDelete(issueId);

    // Update user's issue count
    if (issue.user) {
      await User.findByIdAndUpdate(issue.user, { $inc: { issuesReported: -1 } });
    }

    return { message: 'Issue deleted successfully' };
  }
}

module.exports = new IssueService();

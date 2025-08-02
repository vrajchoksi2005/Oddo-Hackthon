// Application Constants
const ISSUE_CATEGORIES = ['Road', 'Water', 'Cleanliness', 'Lighting', 'Safety'];
const ISSUE_STATUSES = ['Reported', 'In Progress', 'Resolved'];
const USER_ROLES = ['user', 'admin'];

const SPAM_THRESHOLD = 3;
const MAX_IMAGES_PER_ISSUE = 5;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const DEFAULT_SEARCH_RADIUS = 5000; // 5km in meters
const MAX_SEARCH_RADIUS = 50000; // 50km in meters

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100
};

module.exports = {
  ISSUE_CATEGORIES,
  ISSUE_STATUSES,
  USER_ROLES,
  SPAM_THRESHOLD,
  MAX_IMAGES_PER_ISSUE,
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES,
  DEFAULT_SEARCH_RADIUS,
  MAX_SEARCH_RADIUS,
  PAGINATION,
  RATE_LIMIT
};

const multer = require('multer');
const path = require('path');
const { MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, MAX_IMAGES_PER_ISSUE } = require('../config/constants');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and JPG are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: MAX_IMAGES_PER_ISSUE
  },
  fileFilter: fileFilter
});

// Validate file type
const isValidImageType = (mimetype) => {
  return ALLOWED_IMAGE_TYPES.includes(mimetype);
};

// Get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

// Generate unique filename
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName);
  return `${timestamp}-${random}${extension}`;
};

// Delete file from local storage
const deleteLocalFile = (filePath) => {
  const fs = require('fs');
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting local file:', error);
  }
};

// Extract public ID from Cloudinary URL
const extractPublicId = (cloudinaryUrl) => {
  const matches = cloudinaryUrl.match(/\/([^\/]+)\.[^.]+$/);
  return matches ? matches[1] : null;
};

module.exports = {
  upload,
  isValidImageType,
  getFileExtension,
  generateUniqueFilename,
  deleteLocalFile,
  extractPublicId
};

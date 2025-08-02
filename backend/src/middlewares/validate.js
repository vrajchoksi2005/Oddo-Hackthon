const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: errorMessage
      });
    }
    
    next();
  };
};

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'
    }),
  phone: Joi.string()
    .pattern(/^\d{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be exactly 10 digits'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .required()
});

const issueCreateSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(100)
    .required(),
  description: Joi.string()
    .min(10)
    .max(1000)
    .required(),
  category: Joi.string()
    .valid('Road', 'Water', 'Cleanliness', 'Lighting', 'Safety')
    .required(),
  coordinates: Joi.array()
    .items(Joi.number())
    .length(2)
    .required(),
  address: Joi.string()
    .max(200)
    .optional(),
  isAnonymous: Joi.boolean()
    .default(false)
});

const issueUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('Reported', 'In Progress', 'Resolved')
    .required(),
  note: Joi.string()
    .max(500)
    .optional(),
  priority: Joi.string()
    .valid('Low', 'Medium', 'High', 'Critical')
    .optional(),
  estimatedResolutionTime: Joi.date()
    .optional(),
  adminNotes: Joi.string()
    .max(500)
    .optional()
});

const spamReportSchema = Joi.object({
  reason: Joi.string()
    .valid('Inappropriate Content', 'Fake Report', 'Duplicate', 'Spam', 'Other')
    .required(),
  description: Joi.string()
    .max(200)
    .optional()
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  issueCreateSchema,
  issueUpdateSchema,
  spamReportSchema
};

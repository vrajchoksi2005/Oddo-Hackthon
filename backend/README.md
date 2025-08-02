# CivicTrack Backend

A comprehensive civic issue reporting platform backend built with Node.js, Express.js, and MongoDB.

## 🚀 Features

- **🔐 Authentication**: JWT-based email/password authentication
- **📍 Location-based Filtering**: Find issues within 1-5 km radius using MongoDB geo-queries
- **📷 Image Upload**: Support for 3-5 images per issue via Cloudinary
- **🔁 Anonymous & Verified Reporting**: Flexible reporting options
- **📊 Admin Dashboard**: Complete analytics and moderation tools
- **🛑 Spam Prevention**: Community-based spam flagging and auto-hiding
- **🗺️ Geo-indexing**: Optimized for map-based displays
- **📝 Timeline Tracking**: Complete audit trail of status updates
- **🔒 Security**: Rate limiting, input validation, and security headers

## 🛠️ Tech Stack

- **Server**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **File Storage**: Cloudinary
- **Validation**: Joi
- **Security**: Helmet, CORS, express-rate-limit

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd civictrack-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/civictrack
   JWT_SECRET=your_super_secret_jwt_key_here
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

5. **Seed sample data** (Optional)
   ```bash
   npm run seed
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "aryanpatel",
  "email": "aryan@gmail.com",
  "phone": "9876543210",
  "password": "Secure@123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "aryan@gmail.com",
  "password": "Secure@123"
}
```

### Issue Endpoints

#### Create Issue
```http
POST /api/issues
Authorization: Bearer <token> (optional for anonymous)
Content-Type: multipart/form-data

{
  "title": "Pothole on main road",
  "description": "Huge pothole near IT bridge",
  "category": "Road",
  "coordinates": [72.5714, 23.0225],
  "isAnonymous": false,
  "images": [File, File, ...] // Max 5 images
}
```

#### Get Nearby Issues
```http
GET /api/issues/nearby?lat=23.0&lng=72.5&distance=5000&category=Road&status=Reported
```

#### Update Issue Status (Admin only)
```http
PATCH /api/issues/:id/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "In Progress",
  "note": "Work has started",
  "priority": "High",
  "estimatedResolutionTime": "2025-08-15T00:00:00Z"
}
```

#### Report Spam
```http
POST /api/issues/:id/spam
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Fake Report",
  "description": "This appears to be a fake issue"
}
```

### Admin Endpoints

#### Get Dashboard Stats
```http
GET /api/admin/dashboard
Authorization: Bearer <admin-token>
```

#### Ban User
```http
PATCH /api/admin/users/:userId/ban
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Repeated spam reports"
}
```

#### Get Analytics
```http
GET /api/admin/analytics
Authorization: Bearer <admin-token>
```

## 🗂️ Project Structure

```
civictrack-backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # Database connection
│   │   ├── cloudinary.js         # Cloudinary configuration
│   │   └── constants.js          # Application constants
│   ├── controllers/
│   │   ├── auth.controller.js    # Authentication logic
│   │   ├── issue.controller.js   # Issue management
│   │   ├── admin.controller.js   # Admin operations
│   │   └── user.controller.js    # User operations
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Issue.js             # Issue schema
│   │   ├── ActivityLog.js       # Activity tracking
│   │   └── SpamReport.js        # Spam reports
│   ├── routes/
│   │   ├── auth.routes.js       # Auth routes
│   │   ├── issue.routes.js      # Issue routes
│   │   ├── user.routes.js       # User routes
│   │   └── admin.routes.js      # Admin routes
│   ├── services/
│   │   ├── auth.service.js      # Auth business logic
│   │   ├── issue.service.js     # Issue business logic
│   │   └── user.service.js      # User business logic
│   ├── middlewares/
│   │   ├── auth.js              # JWT authentication
│   │   ├── role.js              # Role authorization
│   │   ├── validate.js          # Request validation
│   │   └── errorHandler.js      # Global error handling
│   ├── utils/
│   │   ├── geoUtils.js          # Geospatial utilities
│   │   ├── tokenUtils.js        # JWT utilities
│   │   ├── fileUtils.js         # File handling
│   │   └── seed.js              # Database seeding
│   ├── uploads/                 # Temporary file storage
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── .env.example                 # Environment template
├── package.json                 # Dependencies
└── README.md                    # This file
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Token payload structure:
```javascript
{
  userId: "64a7b8c9d1e2f3g4h5i6j7k8",
  role: "user", // or "admin"
  email: "user@example.com"
}
```

## 🗃️ Database Schema

### User Model
```javascript
{
  username: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: "user" | "admin",
  isBanned: Boolean,
  issuesReported: Number,
  spamReports: Number,
  createdAt: Date
}
```

### Issue Model
```javascript
{
  title: String,
  description: String,
  category: "Road" | "Water" | "Cleanliness" | "Lighting" | "Safety",
  status: "Reported" | "In Progress" | "Resolved",
  user: ObjectId (ref: User),
  isAnonymous: Boolean,
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  address: String,
  images: [String], // Cloudinary URLs
  spamVotes: Number,
  isVisible: Boolean,
  priority: "Low" | "Medium" | "High" | "Critical",
  views: Number,
  upvotes: Number,
  createdAt: Date
}
```

## 🌍 Geospatial Features

### Location-based Queries
The system uses MongoDB's geospatial features for location-based filtering:

```javascript
// Find issues within 5km radius
Issue.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [longitude, latitude]
      },
      $maxDistance: 5000 // meters
    }
  }
})
```

### Supported Query Parameters
- `lat`: Latitude coordinate
- `lng`: Longitude coordinate  
- `distance`: Search radius in meters (default: 5000m, max: 50000m)
- `category`: Filter by issue category
- `status`: Filter by issue status

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Joi validation for all inputs
- **Password Security**: bcrypt with salt rounds
- **CORS Protection**: Configurable origin whitelist
- **Security Headers**: Helmet.js security headers
- **File Upload Security**: File type and size validation
- **NoSQL Injection Prevention**: Mongoose schema validation

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/civictrack
JWT_SECRET=super_secure_production_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=https://your-frontend-domain.com
```

### Deployment Platforms
- **Render**: Easy Node.js deployment
- **Railway**: Modern app deployment
- **Vercel**: Serverless functions
- **Heroku**: Traditional PaaS

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Test accounts (after running seed):
- **Admin**: admin@civictrack.com / Admin@123
- **Users**: user1@example.com to user5@example.com / User@123

## 📊 API Response Format

### Success Response
```javascript
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```javascript
{
  "success": false,
  "message": "Error description",
  "error": {
    // Error details (development only)
  }
}
```

## 🔧 Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm run seed`: Populate database with sample data
- `npm test`: Run test suite

## 📈 Analytics & Reporting

The admin dashboard provides:
- **Issue Statistics**: Total, pending, resolved counts
- **Category Breakdown**: Issues by category
- **Geographic Distribution**: Issue density by location
- **User Activity**: Top reporters and user engagement
- **Resolution Metrics**: Average resolution times
- **Spam Reports**: Community moderation insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support or questions:
- Create an issue on GitHub
- Email: support@civictrack.com
- Documentation: [API Docs](http://localhost:5000/api/docs)

---

**CivicTrack** - Empowering communities through technology 🏙️✨

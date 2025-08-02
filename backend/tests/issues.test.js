const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Issue = require('../src/models/Issue');

describe('Issue Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civictrack_test');
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Issue.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Issue.deleteMany({});

    // Create and login a test user
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test@123',
      phone: '9876543210'
    });
    await user.save();
    userId = user._id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test@123'
      });

    authToken = loginResponse.body.data.token;
  });

  describe('POST /api/issues', () => {
    it('should create issue successfully', async () => {
      const issueData = {
        title: 'Test pothole issue',
        description: 'There is a large pothole on main road',
        category: 'Road',
        coordinates: [72.5714, 23.0225],
        isAnonymous: false
      };

      const response = await request(app)
        .post('/api/issues')
        .set('Authorization', `Bearer ${authToken}`)
        .send(issueData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.issue.title).toBe(issueData.title);
    });

    it('should create anonymous issue', async () => {
      const issueData = {
        title: 'Anonymous issue',
        description: 'This is an anonymous report',
        category: 'Safety',
        coordinates: [72.5714, 23.0225],
        isAnonymous: true
      };

      const response = await request(app)
        .post('/api/issues')
        .send(issueData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.issue.isAnonymous).toBe(true);
    });
  });

  describe('GET /api/issues/nearby', () => {
    beforeEach(async () => {
      // Create a test issue
      const issue = new Issue({
        title: 'Test Issue',
        description: 'Test description',
        category: 'Road',
        user: userId,
        location: {
          type: 'Point',
          coordinates: [72.5714, 23.0225]
        },
        address: 'Test Address'
      });
      await issue.save();
    });

    it('should fetch issues near 3 km radius', async () => {
      const response = await request(app)
        .get('/api/issues/nearby')
        .query({
          lat: 23.0225,
          lng: 72.5714,
          distance: 3000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.issues.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/issues/:id/spam', () => {
    let issueId;

    beforeEach(async () => {
      const issue = new Issue({
        title: 'Test Issue',
        description: 'Test description',
        category: 'Road',
        user: userId,
        location: {
          type: 'Point',
          coordinates: [72.5714, 23.0225]
        },
        address: 'Test Address'
      });
      await issue.save();
      issueId = issue._id;
    });

    it('should report issue as spam', async () => {
      const response = await request(app)
        .post(`/api/issues/${issueId}/spam`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reason: 'Fake Report',
          description: 'This seems fake'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Authorization Tests', () => {
    it('should block unauth user from reporting issue', async () => {
      const issueData = {
        title: 'Unauthorized issue',
        description: 'This should fail',
        category: 'Road',
        coordinates: [72.5714, 23.0225],
        isAnonymous: false
      };

      const response = await request(app)
        .post('/api/issues')
        .send(issueData)
        .expect(201); // This should pass as anonymous

      // But if we try to access protected routes without auth
      const protectedResponse = await request(app)
        .post(`/api/issues/${response.body.data.issue._id}/spam`)
        .send({
          reason: 'Spam',
          description: 'Test'
        })
        .expect(401);

      expect(protectedResponse.body.success).toBe(false);
    });
  });
});

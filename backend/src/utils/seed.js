require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Issue = require('../models/Issue');
const { ISSUE_CATEGORIES } = require('../config/constants');

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Issue.deleteMany({});
    console.log('Cleared existing data...');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@civictrack.com',
      password: 'Admin@123',
      phone: '9999999999',
      role: 'admin'
    });
    await adminUser.save();
    console.log('Admin user created...');

    // Create regular users
    const users = [];
    for (let i = 1; i <= 5; i++) {
      const user = new User({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: 'User@123',
        phone: `987654321${i}`,
        role: 'user'
      });
      await user.save();
      users.push(user);
    }
    console.log('Regular users created...');

    // Sample coordinates for different cities in India
    const locations = [
      { coordinates: [72.5714, 23.0225], address: 'Ahmedabad, Gujarat' },
      { coordinates: [77.2090, 28.6139], address: 'New Delhi, Delhi' },
      { coordinates: [72.8777, 19.0760], address: 'Mumbai, Maharashtra' },
      { coordinates: [77.5946, 12.9716], address: 'Bangalore, Karnataka' },
      { coordinates: [80.2707, 13.0827], address: 'Chennai, Tamil Nadu' },
    ];

    // Sample issues
    const issueTemplates = [
      {
        title: 'Large pothole on main road',
        description: 'There is a huge pothole on the main road causing traffic issues and vehicle damage.',
        category: 'Road'
      },
      {
        title: 'Broken streetlight',
        description: 'The streetlight has been broken for weeks, making the area unsafe at night.',
        category: 'Lighting'
      },
      {
        title: 'Garbage not collected',
        description: 'Garbage has been piling up for several days and needs immediate attention.',
        category: 'Cleanliness'
      },
      {
        title: 'Water pipe leakage',
        description: 'There is a major water pipe leakage causing water wastage and road damage.',
        category: 'Water'
      },
      {
        title: 'Unsafe pedestrian crossing',
        description: 'The pedestrian crossing lacks proper signals and is very dangerous.',
        category: 'Safety'
      }
    ];

    // Create issues
    for (let i = 0; i < 20; i++) {
      const template = issueTemplates[i % issueTemplates.length];
      const location = locations[i % locations.length];
      const user = users[i % users.length];
      
      // Add some random variation to coordinates
      const coordinates = [
        location.coordinates[0] + (Math.random() - 0.5) * 0.01,
        location.coordinates[1] + (Math.random() - 0.5) * 0.01
      ];

      const issue = new Issue({
        title: `${template.title} - Issue #${i + 1}`,
        description: template.description,
        category: template.category,
        user: Math.random() > 0.2 ? user._id : null, // 20% anonymous
        isAnonymous: Math.random() > 0.2 ? false : true,
        location: {
          type: 'Point',
          coordinates: coordinates
        },
        address: location.address,
        status: ['Reported', 'In Progress', 'Resolved'][Math.floor(Math.random() * 3)],
        priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        spamVotes: Math.floor(Math.random() * 3),
        upvotes: Math.floor(Math.random() * 10),
        views: Math.floor(Math.random() * 50),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      });

      await issue.save();
    }

    console.log('Sample issues created...');
    console.log(`
🌱 Seed data created successfully!

👤 Admin Account:
   Email: admin@civictrack.com
   Password: Admin@123

👥 Test Users:
   Email: user1@example.com to user5@example.com
   Password: User@123

📍 Created 20 sample issues across 5 Indian cities
🗃️  All data is ready for testing!
    `);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

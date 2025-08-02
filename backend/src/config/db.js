const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create geo index for issues
    const db = conn.connection.db;
    try {
      await db.collection('issues').createIndex({ location: '2dsphere' });
      console.log('Geo index created for issues collection');
    } catch (error) {
      console.log('Geo index already exists or error creating:', error.message);
    }

  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;

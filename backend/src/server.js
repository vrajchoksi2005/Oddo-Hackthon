require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 CivicTrack Server is running!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Port: ${PORT}
🔗 URL: http://localhost:${PORT}
// 📚 API Documentation: http://localhost:${PORT}/api/docs
// 🏥 Health Check: http://localhost:${PORT}/health
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// // Handle uncaught exceptions // process.on('uncaughtException', (err) => { //   console.error('Uncaught Exception:', err.message); //   process.exit(1); // }); // // Graceful shutdown // process.on('SIGTERM', () => { //   console.log('SIGTERM received. Shutting down gracefully...'); //   server.close(() => { //     console.log('Process terminated'); //   }); // }); // process.on('SIGINT', () => { //   console.log('SIGINT received. Shutting down gracefully...'); //   server.close(() => { //     console.log('Process terminated'); //   }); // });

module.exports = server;

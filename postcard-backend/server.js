const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3002;

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cmvinayak04:rhEpD4YY0WcEnXDC@cluster0.060pymq.mongodb.net/postcard-app?retryWrites=true&w=majority&ssl=true&tls=true';

// MongoDB client
let dbClient;
let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    dbClient = new MongoClient(MONGODB_URI, {
      ssl: true,
      tls: true,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    await dbClient.connect();
    db = dbClient.db('postcard-app');
    console.log('✅ Connected to MongoDB Atlas successfully');
    
    // Create collections if they don't exist
    await db.createCollection('users');
    await db.createCollection('postcards');
    console.log('✅ Database collections ready');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('🔍 Check if your IP is whitelisted in MongoDB Atlas Network Access');
  }
}

// Enable CORS for frontend
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Note: Puppeteer removed - using html2canvas on frontend instead

// Note: Postcard generation moved to frontend using html2canvas

// Satori postcard generation endpoint
app.post('/api/generate-postcard-satori', require('./api/generate-postcard-satori'));

// Email limit check endpoint
app.post('/api/check-email-limit', require('./api/check-email-limit'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Postcard backend is running' });
});

// Database test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    // Test database connection by listing collections
    const collections = await db.listCollections().toArray();
    res.json({ 
      status: 'OK', 
      message: 'Database connection successful',
      collections: collections.map(col => col.name),
      database: 'postcard-app'
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({ error: 'Database test failed', details: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Postcard backend server running on port ${PORT}`);
  console.log(`🔧 Using MongoDB URI: ${MONGODB_URI ? 'Environment variable set' : 'Using fallback'}`);
  await connectToMongoDB();
  console.log('✅ Backend ready - postcard generation handled by frontend');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (dbClient) {
    await dbClient.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  if (dbClient) {
    await dbClient.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

const { MongoClient } = require('mongodb');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cmvinayak04:rhEpD4YY0WcEnXDC@cluster0.060pymq.mongodb.net/postcard-app?retryWrites=true&w=majority&ssl=true&tls=true';

// Creator emails (unlimited access)
const CREATOR_EMAILS = [
  'cmvinayak04@gmail.com',
  'cmvigneshone@gmail.com'
];

// MongoDB client
let dbClient;
let db;

// Connect to MongoDB
async function connectToMongoDB() {
  if (db) return db;
  
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
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if it's a creator email
    if (CREATOR_EMAILS.includes(email)) {
      return res.json({ 
        allowed: true, 
        remaining: 'unlimited',
        isCreator: true 
      });
    }
    
    // Check daily limit for regular users
    const db = await connectToMongoDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const count = await db.collection('postcards').countDocuments({
      senderEmail: email,
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    const remaining = Math.max(0, 3 - count);
    
    res.json({ 
      allowed: remaining > 0, 
      remaining,
      isCreator: false 
    });
    
  } catch (error) {
    console.error('❌ Error checking email limit:', error);
    res.status(500).json({ 
      error: 'Failed to check email limit',
      details: error.message 
    });
  }
};

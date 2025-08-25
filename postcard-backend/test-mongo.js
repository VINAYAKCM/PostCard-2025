const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://cmvinayak04:rhEpD4YY0WcEnXDC@cluster0.060pymq.mongodb.net/postcard-app?retryWrites=true&w=majority&ssl=true&tls=true';

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...');
  console.log('📡 Connection string:', MONGODB_URI);
  
  try {
    const client = new MongoClient(MONGODB_URI, {
      ssl: true,
      tls: true,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000
    });
    
    console.log('🔄 Attempting to connect...');
    await client.connect();
    console.log('✅ MongoDB connection successful!');
    
    const db = client.db('postcard-app');
    const collections = await db.listCollections().toArray();
    console.log('📚 Collections found:', collections.map(col => col.name));
    
    await client.close();
    console.log('🔌 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('🔍 Error details:', error);
  }
}

testConnection();

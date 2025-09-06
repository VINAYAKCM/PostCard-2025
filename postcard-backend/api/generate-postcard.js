const puppeteer = require('puppeteer');
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
    console.log('✅ Connected to MongoDB Atlas successfully');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Check email limit
async function checkEmailLimit(email) {
  if (CREATOR_EMAILS.includes(email)) {
    return { allowed: true, remaining: 'unlimited' };
  }

  try {
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
    return { allowed: remaining > 0, remaining };
  } catch (error) {
    console.error('Error checking email limit:', error);
    return { allowed: false, remaining: 0 };
  }
}

// Record postcard creation
async function recordPostcard(email) {
  if (CREATOR_EMAILS.includes(email)) return;
  
  try {
    const db = await connectToMongoDB();
    await db.collection('postcards').insertOne({
      senderEmail: email,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Error recording postcard:', error);
  }
}

// Generate postcard image using Puppeteer
async function generatePostcardImage(htmlContent, width = 1024, height = 1388) {
  let browser;
  
  try {
    console.log('🚀 Launching Puppeteer browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    
    // Set the HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Wait for any images to load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: width,
        height: height
      }
    });
    
    console.log('✅ Postcard image generated successfully');
    return screenshot;
    
  } catch (error) {
    console.error('❌ Error generating postcard image:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
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
    const { htmlContent, width = 1024, height = 1388, senderEmail } = req.body;
    
    if (!htmlContent) {
      return res.status(400).json({ error: 'HTML content is required' });
    }
    
    // Check email limit
    if (senderEmail) {
      const limitCheck = await checkEmailLimit(senderEmail);
      if (!limitCheck.allowed) {
        return res.status(429).json({ 
          error: 'Daily email limit reached', 
          remaining: limitCheck.remaining 
        });
      }
    }
    
    // Generate the postcard image
    const imageBuffer = await generatePostcardImage(htmlContent, width, height);
    
    // Record the postcard creation
    if (senderEmail) {
      await recordPostcard(senderEmail);
    }
    
    // Set response headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send the image
    res.status(200).send(imageBuffer);
    
  } catch (error) {
    console.error('❌ Error in generate-postcard:', error);
    res.status(500).json({ 
      error: 'Failed to generate postcard image',
      details: error.message 
    });
  }
};

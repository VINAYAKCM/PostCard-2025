const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3002;

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://cmvinayak04:rhEpD4YY0WcEnXDC@cluster0.060pymq.mongodb.net/postcard-app?retryWrites=true&w=majority';
const DB_NAME = 'postcard-app';

// Creator emails (unlimited access)
const CREATOR_EMAILS = [
  'cmvinayak04@gmail.com',    // You - the creator
  'cmvigneshone@gmail.com'    // Your brother - family access
];

// MongoDB client
let dbClient;
let db;

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    dbClient = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    await dbClient.connect();
    console.log('✅ Connected to MongoDB Atlas successfully');
    
    db = dbClient.db(DB_NAME);
    
    // Ensure collections exist
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

// Store browser instance
let browser;

// Initialize browser
async function initBrowser() {
  try {
    console.log('🔄 Initializing Puppeteer browser...');
    
    // Kill any existing browser processes
    try {
      await require('child_process').exec('pkill -f chromium');
      await require('child_process').exec('pkill -f chrome');
    } catch (e) {
      // Ignore errors if no processes to kill
    }
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection',
        '--single-process'
      ],
      timeout: 30000
    });
    
    console.log('✅ Browser initialized successfully');
    return browser;
  } catch (error) {
    console.error('❌ Error initializing browser:', error);
    console.log('⚠️ Browser initialization failed, but server will continue running');
    browser = null;
    return null;
  }
}

// Generate postcard image endpoint
app.post('/api/generate-postcard', async (req, res) => {
  try {
    console.log('🎯 Generating postcard image...');
    
    const { htmlContent, width = 1024, height = 1388, format = 'png', quality = 100, fromEmail, toName, message } = req.body;
    
    if (!htmlContent) {
      return res.status(400).json({ error: 'HTML content is required' });
    }
    
    // Check email limit before generating
    if (fromEmail) {
      // Check if email is a creator (unlimited access)
      const isCreator = CREATOR_EMAILS.includes(fromEmail.toLowerCase());
      
      if (!isCreator) {
        const existingPostcard = await db.collection('postcards').findOne({ 
          from_email: fromEmail.toLowerCase() 
        });
        
        if (existingPostcard) {
          return res.status(403).json({ 
            error: 'Email limit reached', 
            message: 'You have already sent a postcard from this email address',
            limitReached: true
          });
        }
      }
    }
    
    // Ensure browser is initialized
    if (!browser) {
      console.log('🔄 Browser not initialized, attempting to initialize...');
      await initBrowser();
      
      if (!browser) {
        console.log('🔄 First attempt failed, trying alternative method...');
        // Try alternative launch method
        try {
          browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          console.log('✅ Browser initialized with alternative method');
        } catch (altError) {
          console.error('❌ Alternative browser initialization also failed:', altError);
          return res.status(500).json({ error: 'Browser initialization failed completely' });
        }
      }
    }
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set viewport to match desired dimensions
    await page.setViewport({
      width: width,
      height: height,
      deviceScaleFactor: 2 // For high quality
    });
    
    // Set content and wait for it to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Wait a bit more for any dynamic content (using setTimeout instead of waitForTimeout)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot
    const screenshot = await page.screenshot({
      type: format === 'png' ? 'png' : 'jpeg',
      quality: format === 'jpeg' ? quality : undefined,
      fullPage: false,
      omitBackground: false
    });
    
    // Close the page
    await page.close();
    
    // Store postcard data in MongoDB if email provided
    if (fromEmail && db) {
      try {
        await db.collection('postcards').insertOne({
          from_email: fromEmail.toLowerCase(),
          to_name: toName || 'Unknown',
          message: message || '',
          sentAt: new Date(),
          image_generated: true
        });
        console.log('✅ Postcard data stored in MongoDB');
      } catch (dbError) {
        console.error('⚠️ Failed to store postcard data:', dbError);
        // Don't fail the request if DB storage fails
      }
    }
    
    // Set response headers
    res.set({
      'Content-Type': format === 'png' ? 'image/png' : 'image/jpeg',
      'Content-Length': screenshot.length,
      'Cache-Control': 'no-cache'
    });
    
    // Send the image
    res.send(screenshot);
    
    console.log('✅ Postcard generated successfully');
    
  } catch (error) {
    console.error('❌ Error generating postcard:', error);
    res.status(500).json({ error: 'Failed to generate postcard', details: error.message });
  }
});

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
      database: DB_NAME
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({ error: 'Database test failed', details: error.message });
  }
});

// Check email limit endpoint
app.post('/api/check-email-limit', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    // Check if email is a creator (unlimited access)
    const isCreator = CREATOR_EMAILS.includes(email.toLowerCase());
    
    if (isCreator) {
      return res.json({ 
        limitReached: false, 
        message: 'Creator access - unlimited postcards available!',
        isCreator: true
      });
    }
    
    // Check if email has already sent a postcard
    const existingPostcard = await db.collection('postcards').findOne({ 
      from_email: email.toLowerCase() 
    });
    
    if (existingPostcard) {
      res.json({ 
        limitReached: true, 
        message: 'You have already sent a postcard from this email address',
        isCreator: false,
        postcardData: {
          id: existingPostcard._id,
          sentAt: existingPostcard.sentAt,
          toName: existingPostcard.to_name,
          message: existingPostcard.message
        }
      });
    } else {
      res.json({ 
        limitReached: false, 
        message: 'Email address available for postcard sending',
        isCreator: false
      });
    }
    
  } catch (error) {
    console.error('❌ Email limit check error:', error);
    res.status(500).json({ error: 'Failed to check email limit', details: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Postcard backend server running on port ${PORT}`);
  await connectToMongoDB();
  
  // Initialize browser in background (don't wait for it)
  initBrowser().catch(err => {
    console.log('⚠️ Browser will be initialized when needed');
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (browser) {
    await browser.close();
  }
  if (dbClient) {
    await dbClient.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  if (browser) {
    await browser.close();
  }
  if (dbClient) {
    await dbClient.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

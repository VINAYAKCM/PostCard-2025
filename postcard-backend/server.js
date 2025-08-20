const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3002;

// Enable CORS for frontend
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Store browser instance
let browser;

// Initialize browser
async function initBrowser() {
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    console.log('✅ Browser initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing browser:', error);
  }
}

// Generate postcard image endpoint
app.post('/api/generate-postcard', async (req, res) => {
  try {
    console.log('🎯 Generating postcard image...');
    
    const { htmlContent, width = 1024, height = 1388, format = 'png', quality = 100 } = req.body;
    
    if (!htmlContent) {
      return res.status(400).json({ error: 'HTML content is required' });
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

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Postcard backend server running on port ${PORT}`);
  await initBrowser();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  if (browser) {
    await browser.close();
  }
  process.exit(0);
});

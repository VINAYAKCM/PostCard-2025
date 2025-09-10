const satori = require('satori').default;
const sharp = require('sharp');
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

// Load Inter font for Satori
async function loadInterFont() {
  try {
    const response = await fetch('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    const css = await response.text();
    
    // Extract font URLs from CSS
    const fontUrls = css.match(/url\([^)]+\)/g);
    if (!fontUrls || fontUrls.length === 0) {
      throw new Error('No font URLs found');
    }
    
    // Load the first font (Inter Regular)
    const fontUrl = fontUrls[0].replace(/url\(|\)/g, '');
    const fontResponse = await fetch(fontUrl);
    return await fontResponse.arrayBuffer();
  } catch (error) {
    console.error('Error loading Inter font:', error);
    // Return a fallback font or empty buffer
    return null;
  }
}

// Generate postcard using Satori
async function generatePostcardWithSatori(postcardData) {
  try {
    console.log('🚀 Generating postcard with Satori...');
    
    // Load Inter font
    const interFont = await loadInterFont();
    
    // Ultra-simple JSX for Satori - working version
    const postcardJSX = {
      type: 'div',
      props: {
        style: {
          width: '512px',
          height: '694px',
          backgroundColor: postcardData.backgroundColor || '#f8ffee',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Arial, sans-serif'
        },
        children: [
          // Front side
          {
            type: 'div',
            props: {
              style: {
                width: '512px',
                height: '347px',
                backgroundColor: postcardData.backgroundColor || '#f8ffee',
                display: 'flex',
                padding: '20px',
                position: 'relative'
              },
              children: [
                // Vertical line in center
                {
                  type: 'div',
                  props: {
                    style: {
                      position: 'absolute',
                      left: '256px',
                      top: '20px',
                      bottom: '20px',
                      width: '2px',
                      backgroundColor: 'rgba(170, 170, 170, 0.16)'
                    }
                  }
                },
                // Left content
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '236px',
                      display: 'flex',
                      flexDirection: 'column',
                      paddingRight: '20px'
                    },
                    children: [
                      // Greeting
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: '#1a1a1a',
                            marginBottom: '10px'
                          },
                          children: `Hey ${postcardData.recipientName || ''},`
                        }
                      },
                      // Message
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '14px',
                            color: '#333333',
                            letterSpacing: '0.02em',
                            lineHeight: '20px',
                            marginBottom: '20px'
                          },
                          children: postcardData.message || ''
                        }
                      },
                      // Closing
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '14px',
                            color: '#666666',
                            marginTop: 'auto',
                            marginBottom: '25px'
                          },
                          children: `Sincerely, @${postcardData.handle || ''}`
                        }
                      }
                    ]
                  }
                },
                // Right content (stamp)
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '236px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      paddingLeft: '20px',
                      paddingTop: '25px',
                      paddingRight: '25px'
                    },
                    children: [
                      {
                        type: 'img',
                        props: {
                          src: postcardData.profileImage || '',
                          style: {
                            width: '80px',
                            height: '80px',
                            borderRadius: '8px'
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          },
          // Back side
          {
            type: 'div',
            props: {
              style: {
                width: '512px',
                height: '347px',
                backgroundColor: postcardData.backgroundColor || '#f8ffee',
                display: 'flex'
              },
              children: [
                // Photo
                {
                  type: 'img',
                  props: {
                    src: postcardData.photo || '',
                    style: {
                      width: '512px',
                      height: '347px'
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    };
    
    // Generate SVG with Satori
    const svg = await satori(postcardJSX, {
      width: 512,
      height: 694,
      fonts: interFont ? [
        {
          name: 'SF Pro Display',
          data: interFont,
          style: 'normal',
          weight: 400
        }
      ] : []
    });
    
    // Convert SVG to PNG using Sharp
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    
    console.log('✅ Postcard generated successfully with Satori');
    return pngBuffer;
    
  } catch (error) {
    console.error('❌ Error generating postcard with Satori:', error);
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
    const { 
      recipientName, 
      handle, 
      message, 
      photo, 
      signature, 
      profileImage, 
      backgroundColor = '#FFFFFF',
      senderEmail 
    } = req.body;
    
    if (!recipientName || !handle || !message || !photo || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
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
    const imageBuffer = await generatePostcardWithSatori({
      recipientName,
      handle,
      message,
      photo,
      signature,
      profileImage,
      backgroundColor
    });
    
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
    console.error('❌ Error in generate-postcard-satori:', error);
    res.status(500).json({ 
      error: 'Failed to generate postcard image',
      details: error.message 
    });
  }
};

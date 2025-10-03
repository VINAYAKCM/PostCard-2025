const { chromium } = require('playwright');

// Utility function to determine if a background color is light or dark
const isLightBackground = (hexColor) => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance using the standard formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if light (luminance > 0.5), false if dark
  return luminance > 0.5;
};

const generatePostcard = async (req, res) => {
  try {
    console.log('🎭 [PLAYWRIGHT] Starting postcard generation...');
    
    const {
      recipientName,
      handle,
      senderEmail,
      message,
      photo,
      signature,
      postcardBackgroundColor,
      userData,
      isMobile = false
    } = req.body;

    console.log('📝 [PLAYWRIGHT] Data received:', {
      recipientName: recipientName ? '✓' : '✗',
      handle: handle ? '✓' : '✗',
      senderEmail: senderEmail ? '✓' : '✗',
      message: message ? '✓' : '✗',
      photo: photo ? '✓' : '✗',
      signature: signature ? '✓' : '✗',
      backgroundColor: postcardBackgroundColor || '#FFFFFF'
    });

    // Calculate text and separator colors based on background
    const backgroundColor = postcardBackgroundColor || '#FFFFFF';
    const isLight = isLightBackground(backgroundColor);
    const textColor = isLight ? '#000000' : '#FFFFFF';
    const separatorColor = isLight ? 'rgba(156, 156, 156, 0.6)' : 'rgba(255, 255, 255, 0.3)';
    
    console.log('🎨 [BACKEND] Color calculation:', {
      backgroundColor,
      isLight,
      textColor,
      separatorColor,
      signatureFilter: isLight ? 'none' : 'brightness(0) invert(1)',
      isMobile
    });

    // Launch browser
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set viewport to maximum resolution for ultra-crisp quality
    await page.setViewportSize({ width: 4096, height: 5552, deviceScaleFactor: 3 });

    // Generate HTML template
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Postcard Generation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'SF Pro Display', 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f0f0;
            padding: 20px;
        }
        
        .postcard-container {
            width: 2048px;
            height: 2776px;
            display: flex;
            flex-direction: column;
            margin: 0 auto;
            background: white;
            border-radius: 0;
            overflow: hidden;
            box-shadow: 0 16px 80px rgba(0, 0, 0, 0.08);
        }
        
        .postcard-frame {
            background: white;
            border-radius: 0;
            box-shadow: 0 16px 80px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            position: relative;
            width: 2048px;
            height: 2776px;
            margin: 0;
            padding: 0;
        }
        
        .front-side {
            height: 1388px;
            margin: 0;
            padding: 0;
            position: relative;
            top: 0;
            border-radius: 0;
            background: ${postcardBackgroundColor || '#f8ffee'};
        }
        
        .back-side {
            height: 1388px;
            margin: 0;
            padding: 0;
            position: relative;
            top: 0;
            margin-top: 0;
            border-radius: 0;
            background: ${postcardBackgroundColor || '#f8ffee'};
        }
        
        .postcard-content {
            height: 100%;
            padding: 60px 80px 80px 80px;
            position: relative;
            display: flex;
            margin: 0;
            border: none;
            outline: none;
        }
        
        .separator-line {
            position: absolute;
            left: 50%;
            top: ${isMobile ? '50%' : '39%'};
            transform: translate(-50%, -50%);
            height: ${isMobile ? '1100px' : '500px'};
            width: 2px;
            z-index: 1;
        }
        
        .left-content {
            flex: 0 0 50%;
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding-right: 20px;
            overflow: hidden;
            max-width: 50%;
        }
        
        .greeting {
            font-size: 64px;
            font-weight: 700;
            color: ${textColor};
            margin-top: 120px;
            margin-left: 100px;
            font-family: 'SF Pro Display', 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .message {
            flex: 1;
            font-size: 4rem;
            line-height: 1.6;
            color: ${textColor};
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 80%;
            overflow: hidden;
            white-space: pre-wrap;
            width: 80%;
            box-sizing: border-box;
            margin-top: 60px;
            margin-left: 100px;
            font-family: 'SF Pro Display', 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .closing {
            font-size: 4rem;
            color: ${textColor};
            position: absolute;
            bottom: 120px;
            left: 100px;
            margin: 0;
            font-family: 'SF Pro Display', 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .closing-profile-image {
            width: 68px;
            height: 68px;
            border-radius: 50%;
            object-fit: cover;
            margin: 0 10px;
            vertical-align: middle;
        }
        
        .user-icon {
            margin: 0 10px;
        }
        
        .right-content {
            flex: 0 0 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            padding-top: 20px;
            padding-left: 20px;
            position: relative;
            height: 100%;
        }
        
        .stamp-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 40px;
            position: absolute;
            top: 120px;
            right: 100px;
            width: 320px;
            height: 320px;
            transform: rotate(5.44deg);
        }
        
        .stamp-label {
            font-size: 3.2rem;
            color: #666;
            font-weight: 600;
        }
        
        .stamp-preview {
            width: 320px;
            height: 400px;
            border-radius: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            outline: none;
            box-shadow: none;
            overflow: hidden;
            position: relative;
        }
        
        .stamp-preview img {
            width: 320px;
            height: 400px;
            border-radius: 32px;
            object-fit: cover;
        }
        
        .stamp-image {
            width: 320px;
            height: 400px;
            border-radius: 32px;
            object-fit: cover;
            object-position: center;
        }
        
        .stamp-placeholder-text {
            font-size: 2.8rem;
            color: #999;
            text-align: center;
            line-height: 1.2;
        }
        
        .signature-display {
            position: absolute !important;
            bottom: 80px !important;
            left: calc(50% + 60px) !important;
            font-family: 'SF Pro Display', 'SF Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex !important;
            align-items: center !important;
            gap: 20px !important;
            z-index: 2 !important;
            width: 800px !important;
            height: 400px !important;
        }
        
        .signature-display {
            filter: ${isLight ? 'none' : 'brightness(0) invert(1)'} !important;
        }
        
        .signature-image {
            width: 800px !important;
            height: 400px !important;
            max-width: none !important;
            max-height: none !important;
            object-fit: contain !important;
        }
        
        .back-side .photo-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .postcard-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .photo-placeholder {
            color: #999;
            font-size: 4rem;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="postcard-container">
        <!-- Front Side -->
        <div class="front-side">
            <div class="left-content">
                <div class="greeting">Hey ${recipientName ? `${recipientName},` : ','}</div>
                <div class="message">${message || ''}</div>
                <div class="closing">
                    Sincerely, 
                    ${userData?.profileImage ? 
                        `<img src="${userData.profileImage}" alt="Profile" class="closing-profile-image" />` : 
                        '<span class="user-icon">👤</span>'
                    }
                    @${handle || 'handle'}
                </div>
            </div>
            <div class="right-content">
            </div>
            <div class="stamp-placeholder">
                <div class="stamp-preview">
                    ${photo ? 
                        `<img src="${photo}" alt="Stamp" class="stamp-image" />` : 
                        '<div class="stamp-placeholder-text">Add a picture</div>'
                    }
                </div>
            </div>
            <!-- Dynamic separator line -->
            <div class="separator-line" style="background-color: ${separatorColor};"></div>
            ${signature ? 
                `<div class="signature-display">
                    <img src="${signature}" alt="Signature" class="signature-image" />
                </div>` : 
                ''
            }
        </div>
        
        <!-- Back Side -->
        <div class="back-side">
            <div class="photo-container">
                ${photo ? 
                    `<img src="${photo}" alt="Postcard Photo" class="postcard-photo" />` : 
                    '<div class="photo-placeholder"><span>Your photo will appear here</span></div>'
                }
            </div>
        </div>
    </div>
</body>
</html>`;

    // Set HTML content
    await page.setContent(htmlTemplate);
    
    // Wait for images to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of the postcard container
    const postcardElement = await page.$('.postcard-container');
    const screenshot = await postcardElement.screenshot({
      type: 'png'
    });

    // Close browser
    await browser.close();

    // Convert to base64
    const base64Image = screenshot.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    console.log('✅ [PLAYWRIGHT] Postcard generated successfully');
    
    res.json({ 
      success: true, 
      postcardImage: dataUrl,
      message: 'Postcard generated successfully' 
    });

  } catch (error) {
    console.error('❌ [PLAYWRIGHT] Error generating postcard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate postcard',
      details: error.message 
    });
  }
};

module.exports = generatePostcard;
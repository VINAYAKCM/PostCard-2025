import React, { useState, useRef, useContext } from 'react';
import SignatureCanvas from './SignatureCanvas';
import { UserContext } from '../context/UserContext';
import emailjs from '@emailjs/browser';
import { emailConfig } from '../config/emailConfig';
import { cloudinaryConfig } from '../config/cloudinaryConfig';
// REMOVED: dom-to-image import - now using Canvas API with Figma specs

import './PostCardPage.css';

const PostCardPage: React.FC = () => {
  const userContext = useContext(UserContext);
  const userData = userContext?.userData;
  const [recipientName, setRecipientName] = useState('');
  const [handle, setHandle] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData);
  };

  const clearSignature = () => {
    setSignature(null);
  };

  const handleSend = async () => {
    if (!recipientName.trim() || !handle.trim() || !senderEmail.trim() || !message.trim() || !photo || !signature) {
      alert('Please fill in all fields including recipient name, photo and signature');
      return;
    }

    setIsSending(true);
    
    try {
      // Generate email-friendly postcard image (smaller file size)
      console.log('Starting email-friendly postcard image generation...');
      const postcardImage = await generateEmailFriendlyImage();
      console.log('Email-friendly postcard image generated successfully!');
      console.log('Image data length:', postcardImage.length);
      console.log('Image data preview:', postcardImage.substring(0, 100) + '...');
      
      // Send email with postcard attachment
      await sendPostcardEmail(postcardImage);
      
      alert('Postcard sent successfully! Check your email.');
      
      // Reset form
      setRecipientName('');
      setHandle('');
      setSenderEmail('');
      setMessage('');
      setPhoto(null);
      setSignature(null);
    } catch (error) {
      console.error('Error sending postcard:', error);
      alert('Failed to send postcard. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // BACKEND API SOLUTION: Perfect quality via Puppeteer backend
  const generatePostcardImage = async (): Promise<string> => {
    console.log('🚀 [DOWNLOAD] Generating postcard via backend API...');
    
    try {
      // Step 1: Create perfect HTML for the postcard
      const postcardHTML = createPerfectPostcardHTML();
      
      // Step 2: Send to backend for perfect rendering
      const response = await fetch('http://localhost:3002/api/generate-postcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: postcardHTML,
          width: 1024, // 2x resolution
          height: 1388, // 2x resolution
          format: 'png',
          quality: 100
        })
      });
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      
      // Step 3: Convert response to data URL
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      console.log('✅ [DOWNLOAD] Perfect postcard generated via backend API');
      return imageUrl;
      
    } catch (error) {
      console.error('❌ [DOWNLOAD] Error generating postcard:', error);
      throw error;
    }
  };

  const generateEmailFriendlyImage = async (): Promise<string> => {
    console.log('🚀 [EMAIL] Generating email postcard via backend API...');
    
    try {
      // Step 1: Create perfect HTML for the postcard
      const postcardHTML = createPerfectPostcardHTML();
      
      // Step 2: Send to backend for perfect rendering
      const response = await fetch('http://localhost:3002/api/generate-postcard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: postcardHTML,
          width: 768, // 1.5x resolution for email
          height: 1041, // 1.5x resolution for email
          format: 'jpeg',
          quality: 95
        })
      });
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      
      // Step 3: Convert response to data URL
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      console.log('✅ [EMAIL] Perfect postcard generated via backend API');
      return imageUrl;
      
    } catch (error) {
      console.error('❌ [EMAIL] Error generating postcard:', error);
      throw error;
    }
  };

  // Create perfect HTML for the postcard
  const createPerfectPostcardHTML = (): string => {
    // Get all the CSS from your stylesheet
    const allStyles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');
    
    // Get the actual content from your postcard preview
    const frontSideElement = document.querySelector('.front-side');
    const backSideElement = document.querySelector('.back-side');
    
    if (!frontSideElement || !backSideElement) {
      throw new Error('Postcard preview elements not found');
    }
    
    // Clone the elements to get their current state
    const frontSideClone = frontSideElement.cloneNode(true) as HTMLElement;
    const backSideClone = backSideElement.cloneNode(true) as HTMLElement;
    
    // Ensure all images are loaded
    const frontImages = Array.from(frontSideClone.querySelectorAll('img'));
    const backImages = Array.from(backSideClone.querySelectorAll('img'));
    const allImages = [...frontImages, ...backImages];
    allImages.forEach(img => {
      if (img.src && !img.src.startsWith('data:')) {
        img.src = img.src; // Force reload
      }
    });
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PostCard</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', sans-serif;
              background: #f0f0f0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            
            .postcard-container {
              width: 512px;
              height: 694px;
              background: linear-gradient(to bottom, #FFFFFF 0%, #FFEBD4 100%);
              border-radius: 20px;
              box-shadow: 4px 4px 18px rgba(0, 0, 0, 0.25);
              overflow: hidden;
              position: relative;
            }
            
            .front-side {
              width: 100%;
              height: 347px;
              position: relative;
              background: transparent;
            }
            
            .back-side {
              width: 100%;
              height: 347px;
              position: relative;
              background: #FFFFFF;
            }
            
            /* All your CSS styles */
            ${allStyles}
          </style>
        </head>
        <body>
          <div class="postcard-container">
            <div class="front-side">
              ${frontSideClone.outerHTML}
            </div>
            <div class="back-side">
              ${backSideClone.outerHTML}
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // REMOVED: All Canvas drawing functions - now using Browserless.io for perfect screenshots

  // REMOVED: All unused helper functions - now using direct capture approach

  // REMOVED: Unused function - dom-to-image handles optimization automatically

  // REMOVED: Old Canvas drawing functions - now using direct HTML screenshot

  // REMOVED: All remaining Canvas drawing functions - now using direct HTML screenshot

  const sendPostcardEmail = async (postcardImage: string): Promise<void> => {
    try {
      // Check if Cloudinary is configured
      if (cloudinaryConfig.cloudName === 'YOUR_CLOUDINARY_CLOUD_NAME') {
        alert('Please configure Cloudinary first. Check the cloudinaryConfig.ts file for setup instructions.');
        return;
      }

      setIsUploading(true);
      
      let blob: Blob;
      
      // Check if the image is a blob URL (from backend) or base64 data URL
      if (postcardImage.startsWith('blob:')) {
        // It's a blob URL from the backend - fetch the blob
        console.log('Processing blob URL from backend...');
        const response = await fetch(postcardImage);
        blob = await response.blob();
      } else if (postcardImage.startsWith('data:')) {
        // It's a base64 data URL - convert to blob
        console.log('Processing base64 data URL...');
        const base64Data = postcardImage.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'image/jpeg' });
      } else {
        throw new Error('Invalid image format received');
      }
      
      console.log('Image blob size:', blob.size, 'bytes');
      
      // Upload high-quality postcard to Cloudinary
      const formData = new FormData();
      formData.append('file', blob, 'postcard.jpg');
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Cloudinary upload failed:', uploadResponse.status, errorText);
        throw new Error(`Failed to upload image to Cloudinary: ${uploadResponse.status}`);
      }
      
      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.secure_url;
      
      console.log('Postcard uploaded to Cloudinary:', imageUrl);
      
      // Now send email with the download link
      await sendSimpleEmail(imageUrl);
      
      setIsUploading(false);
      
    } catch (error) {
      console.error('Error uploading postcard:', error);
      setIsUploading(false);
      throw new Error('Failed to upload postcard');
    }
  };

  const sendSimpleEmail = async (imageUrl: string): Promise<void> => {
    try {
      // Ensure name and handle are available from context
      if (!userData?.name || !userData?.handle) {
        alert('Sender name or handle is missing. Please complete setup.');
        return;
      }

      // Match the template variables from emailConfig.ts
      const templateParams = {
        to_email: senderEmail, // Add recipient email
        to_name: recipientName,
        from_handle: userData.handle,
        message: message,
        postcard_image: imageUrl, // Cloudinary URL
        subject: `Digital Postcard from @${userData.handle}`
      };

      console.log('🔍 DEBUG: Template parameters being sent to EmailJS:');
      console.log('  - to_email:', templateParams.to_email);
      console.log('  - to_name:', templateParams.to_name);
      console.log('  - from_handle:', templateParams.from_handle);
      console.log('  - message:', templateParams.message);
      console.log('  - postcard_image:', templateParams.postcard_image);
      console.log('  - subject:', templateParams.subject);
      console.log('🔍 Full templateParams object:', templateParams);

      const result = await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        templateParams,
        emailConfig.publicKey
      );

      console.log('EmailJS result:', result);
      alert('Postcard sent successfully! Check your email.');
      console.log('Email sent with Cloudinary link:', imageUrl);
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      alert('Failed to send email. Please check console for details.');
    }
  };

  const isFormValid = recipientName.trim() && handle.trim() && senderEmail.trim() && message.trim() && photo && signature;

  return (
    <div className="postcard-page">
      <div className="postcard-container">
        {/* Left Column - Input Form */}
        <div className="input-column">
          <div className="header">
            <h1>Send a letter</h1>
            <p>It's like a digital guestbook.</p>
          </div>

          <div className="input-form">
            <div className="form-group">
              <label htmlFor="recipient-name">Recipient Name</label>
              <input
                type="text"
                id="recipient-name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="form-input"
                placeholder="Who are you sending this to?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="handle">Handle (e.g. @handle)</label>
              <input
                type="text"
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="form-input"
                placeholder="Enter your handle"
              />
            </div>

            <div className="form-group">
              <label htmlFor="sender-email">Email</label>
              <input
                type="email"
                id="sender-email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-textarea"
                placeholder="Write your message here..."
                rows={4}
                maxLength={200}
              />
              <small className="char-count">{message.length}/200</small>
            </div>

            <div className="form-group">
              <label htmlFor="photo">Photo</label>
              <div className="photo-upload-area" onClick={() => fileInputRef.current?.click()}>
                {photo ? (
                  <img src={photo} alt="Uploaded" className="photo-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>Click to upload photo</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                id="photo"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="signature">Signature</label>
              <SignatureCanvas onSave={handleSignatureSave} />
              {signature && (
                <button onClick={clearSignature} className="clear-signature">
                  Clear signature
                </button>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={!isFormValid || isSending || isUploading}
              className={`send-button ${isFormValid ? 'active' : 'disabled'}`}
            >
              {isUploading ? 'Uploading...' : isSending ? 'Sending...' : 'Send'}
            </button>

            {/* Download Button for Testing */}
            {isFormValid && (
              <button
                onClick={async () => {
                  try {
                    // Use high-quality version for download testing
                    const postcardImage = await generatePostcardImage();
                    const downloadLink = document.createElement('a');
                    downloadLink.href = postcardImage;
                    downloadLink.download = `postcard_hq_test_${handle}.png`;
                    downloadLink.click();
                    console.log('High-quality test postcard downloaded');
                  } catch (error) {
                    console.error('Error generating test postcard:', error);
                    alert('Failed to generate test postcard');
                  }
                }}
                className="download-button"
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📥 Download High-Quality Test Postcard
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Postcard Preview */}
        <div className="preview-column">
          {/* Front Side Postcard */}
          <div className="postcard-frame front-side">
            <div className="postcard-content">
              <div className="left-content">
                <div className="greeting">Dear {recipientName ? `${recipientName},` : ','}</div>
                <div className="message">{message || ''}</div>
                <div className="closing">
                  Sincerely, 
                  {userData?.profileImage ? (
                    <img 
                      src={userData.profileImage} 
                      alt="Profile" 
                      className="closing-profile-image"
                    />
                  ) : (
                    <span className="user-icon">👤</span>
                  )}
                  @{handle || 'handle'}
                </div>
              </div>
              <div className="right-content">
                <div className="stamp-placeholder">
                  <div className="stamp-preview">
                    {userData?.profileImage ? (
                      <img src={userData.profileImage} alt="Profile" className="stamp-image" />
                    ) : (
                      <div className="stamp-placeholder-text">Profile Image</div>
                    )}
                  </div>
                </div>
              </div>
              {signature && (
                <div className="signature-display">
                  <img src={signature} alt="Signature" className="signature-image" />
                </div>
              )}
            </div>
          </div>

          {/* Back Side Postcard */}
          <div className="postcard-frame back-side">
            <div className="photo-container">
              {photo ? (
                <img src={photo} alt="Postcard" className="postcard-photo" />
              ) : (
                <div className="photo-placeholder">
                  <span>Your photo will appear here</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCardPage;
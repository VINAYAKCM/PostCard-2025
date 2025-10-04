import React, { useState, useRef, useContext, useEffect } from 'react';
import SignatureCanvas from './SignatureCanvas';
import { UserContext } from '../context/UserContext';
import emailjs from '@emailjs/browser';
import { emailConfig } from '../config/emailConfig';
import { cloudinaryConfig } from '../config/cloudinaryConfig';
import { getApiUrl } from '../config/apiConfig';

import './PostCardPage.css';

// Utility function to determine if a background color is light or dark
const isLightBackground = (hexColor: string): boolean => {
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

const PostCardPage: React.FC = () => {
  const userContext = useContext(UserContext);
  const userData = userContext?.userData;
  const [recipientName, setRecipientName] = useState('');
  const [handle, setHandle] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [postcardBackgroundColor, setPostcardBackgroundColor] = useState('#FFFFFF');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [textColor, setTextColor] = useState('#000000'); // Dynamic text color based on background
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Update text color based on background color
  useEffect(() => {
    const isLight = isLightBackground(postcardBackgroundColor);
    setTextColor(isLight ? '#000000' : '#FFFFFF');
  }, [postcardBackgroundColor]);

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

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const lines = value.split('\n');
    
    // Different limits for mobile and desktop
    if (isMobile) {
      // Mobile: 3 lines AND 185 characters
      if (lines.length > 3 || value.length > 185) {
      return;
      }
    } else {
      // Desktop: 3 lines AND 185 characters (decreased line limit)
      if (lines.length > 3 || value.length > 185) {
        return;
      }
    }
    
    setMessage(value);
  };

  const clearSignature = () => {
    setSignature(null);
  };

  const handleDownload = async () => {
    if (!recipientName.trim() || !handle.trim() || !message.trim() || !photo || !signature) {
      alert('Please fill in all fields including recipient name, photo and signature');
      return;
    }

    try {
      // Use backend Playwright generation for both mobile and desktop
      console.log(`🎭 [${isMobile ? 'MOBILE' : 'DESKTOP'}] Using backend Playwright generation...`);
      const response = await fetch(getApiUrl('/api/generate-postcard'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            recipientName,
            handle,
            senderEmail,
            message,
            photo,
            signature,
            postcardBackgroundColor,
            userData,
            isMobile: isMobile
        })
      });
      
      if (!response.ok) {
          throw new Error('Failed to generate postcard with Playwright');
        }
        
        const result = await response.json();
        const postcardImage = result.postcardImage;
        console.log(`✅ [${isMobile ? 'MOBILE' : 'DESKTOP'}] Postcard generated with Playwright`);
      
      // Create download link
      const link = document.createElement('a');
      link.href = postcardImage;
      link.download = `postcard-${recipientName}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Postcard downloaded successfully!');
    } catch (error) {
      console.error('Error generating postcard:', error);
      alert('Failed to generate postcard. Please try again.');
    }
  };

  const handleSend = async () => {
    if (!recipientName.trim() || !handle.trim() || !senderEmail.trim() || !message.trim() || !photo || !signature) {
      alert('Please fill in all fields including recipient name, photo and signature');
      return;
    }

    setIsSending(true);
    
    try {
      // Use backend Playwright generation for both mobile and desktop
      console.log(`🎭 [${isMobile ? 'MOBILE' : 'DESKTOP'}] Using backend Playwright generation for email...`);
      const response = await fetch(getApiUrl('/api/generate-postcard'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            recipientName,
            handle,
            senderEmail,
            message,
            photo,
            signature,
            postcardBackgroundColor,
            userData,
            isMobile: isMobile
        })
      });
      
      if (!response.ok) {
          throw new Error('Failed to generate postcard with Playwright');
        }
        
        const result = await response.json();
        const postcardImage = result.postcardImage;
        console.log(`✅ [${isMobile ? 'MOBILE' : 'DESKTOP'}] Postcard generated with Playwright for email`);
      
      
      // Send email with postcard attachment
      await sendPostcardEmail(postcardImage);
      
      // Show success state
      setIsSent(true);
      
      // Don't reset form - let user keep the postcard and download it
    } catch (error) {
      console.error('Error sending postcard:', error);
      alert('Failed to send postcard. Please try again.');
    } finally {
      setIsSending(false);
    }
  };




  const sendPostcardEmail = async (postcardImage: string): Promise<void> => {
    try {
      console.log('🔍 [EMAIL] Starting email send process...');
      console.log('🔍 [EMAIL] Cloudinary config:', cloudinaryConfig);
      
      // Check if Cloudinary is configured
      if (cloudinaryConfig.cloudName === 'YOUR_CLOUDINARY_CLOUD_NAME') {
        console.error('❌ [EMAIL] Cloudinary not configured!');
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
      
      console.log('🔍 [EMAIL] Uploading to Cloudinary...');
      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      
      console.log('🔍 [EMAIL] Cloudinary response status:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ [EMAIL] Cloudinary upload failed:', uploadResponse.status, errorText);
        throw new Error(`Failed to upload image to Cloudinary: ${uploadResponse.status} - ${errorText}`);
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
      console.log('🔍 [EMAIL] Starting EmailJS send...');
      console.log('🔍 [EMAIL] Image URL:', imageUrl);
      console.log('🔍 [EMAIL] User data:', userData);
      
      // Ensure name and handle are available from context
      if (!userData?.name || !userData?.handle) {
        console.error('❌ [EMAIL] Missing user data:', userData);
        alert('Sender name or handle is missing. Please complete setup.');
        return;
      }

      // Match the template variables from emailConfig.ts
      const templateParams = {
        to_email: senderEmail, // Add recipient email
        to_name: recipientName,
        from_email: userData.email, // Add sender's email
        from_handle: userData.handle,
        message: message,
        postcard_image: imageUrl, // Cloudinary URL
        subject: `Digital Postcard from @${userData.handle}`
      };


      await emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        templateParams,
        emailConfig.publicKey
      );

    } catch (error) {
      console.error('Failed to send email:', error);
      
      
      alert('Failed to send email. Please check console for details.');
    }
  };

  const isFormValid = recipientName.trim() && handle.trim() && senderEmail.trim() && message.trim() && photo && signature;

  return (
    <div className="postcard-page">
      {isMobile ? (
        // Mobile Layout
        <div className="mobile-layout">
          {/* Download button in top right corner */}
          <button
            onClick={handleDownload}
            disabled={!isFormValid || !isSent}
            className="download-icon-button mobile"
            title="Download Preview"
          >
            <img src="/download-icon.svg" alt="Download" />
          </button>
          
          {/* Title */}
          <div className="mobile-header">
            <h1>Send a postcard to someone special.</h1>
          </div>
          
          {/* Break line */}
          <div className="mobile-break-line-top"></div>
          
          {/* Postcard Preview */}
          <div className="mobile-postcard-preview">
            {/* Front Side Postcard */}
            <div className="postcard-frame front-side" style={{ backgroundColor: postcardBackgroundColor }}>
              <div className="postcard-content">
                <div className="left-content">
                  <div className="greeting" style={{ color: textColor }}>Hey {recipientName ? `${recipientName},` : ','}</div>
                  <div className="message" style={{ color: textColor }}>{message || ''}</div>
                  <div className="closing" style={{ color: textColor }}>
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
                  <div className="signature-display" style={{ filter: textColor === '#000000' ? 'none' : 'brightness(0) invert(1)' }}>
                    <img src={signature} alt="Signature" className="signature-image" />
                  </div>
                )}
              </div>
              {/* Dynamic separator line */}
              <div 
                className="separator-line" 
                style={{ 
                  backgroundColor: textColor === '#000000' ? 'rgba(170, 170, 170, 0.16)' : 'rgba(255, 255, 255, 0.3)'
                }}
              ></div>
            </div>

            {/* Back Side Postcard */}
            <div className="postcard-frame back-side" style={{ backgroundColor: postcardBackgroundColor }}>
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
          
          {/* Form Title */}
          <div className="mobile-form-title">
            {/* <h2>Create your postcard here.</h2> */}
          </div>
          
          {/* Break line */}
          <div className="mobile-break-line"></div>
          
          
          {/* Form Input */}
          <div className="mobile-form">
            {/* Name and Handle Row */}
            <div className="name-handle-row">
              <div className="form-group">
                <label htmlFor="recipient-name">Who's getting this postcard?</label>
                <input
                  type="text"
                  id="recipient-name"
                  className="form-input"
                  placeholder="Name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="handle">Got your handle? (eg: cmv01)</label>
                <input
                  type="text"
                  id="handle"
                  className="form-input"
                  placeholder="Handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="sender-email">Where should I drop it off?</label>
              <input
                type="email"
                id="sender-email"
                className="form-input"
                placeholder="Email address"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            <div className="form-group">
              <label htmlFor="message">What do you wanna tell them?</label>
              <textarea
                id="message"
                className="form-textarea"
                placeholder="Message"
                value={message}
                onChange={handleMessageChange}
                maxLength={185}
                required
              />
              <div className="char-count">{message.length}/185</div>
            </div>

            {/* Photo and Signature Row */}
            <div className="photo-signature-row">
              <div className="form-group">
                <label htmlFor="photo">Photo</label>
                <div 
                  className="photo-upload-area"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photo ? (
                    <img src={photo} alt="Selected photo" className="photo-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <span>Add a picture</span>
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
                <label htmlFor="signature">Sign here</label>
                <div className="signature-canvas">
                  <SignatureCanvas onSave={handleSignatureSave} />
                  {!signature && (
                    <div className="signature-placeholder">
                      <span>Signature</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="clear-signature"
                    onClick={() => {
                      clearSignature();
                      const signatureCanvas = document.querySelector('.signature-canvas');
                      if (signatureCanvas) {
                        const canvasClearButton = signatureCanvas.querySelector('button');
                        if (canvasClearButton) {
                          canvasClearButton.click();
                        }
                      }
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Color Picker Row */}
            <div className="form-group">
              <label htmlFor="postcard-color">Choose your postcard color:</label>
              <div className="color-picker-container">
                <input
                  type="color"
                  id="postcard-color"
                  value={postcardBackgroundColor}
                  onChange={(e) => setPostcardBackgroundColor(e.target.value)}
                  className="color-picker"
                />
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={!isFormValid || isSending || isUploading || isSent}
              className={`send-button ${isFormValid ? 'active' : 'disabled'}`}
            >
              {isSent ? 'Postcard Sent!' : isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      ) : (
        // Desktop Layout
        <div className="desktop-layout">
          {/* Download button in top right corner */}
          <button
            onClick={handleDownload}
            disabled={!isFormValid || !isSent}
            className="download-icon-button"
            title="Download Preview"
          >
            <img src="/download-icon.svg" alt="Download" />
          </button>
          
      <div className="postcard-container">
        {/* Left Column - Input Form */}
        <div className="input-column">
          <div className="header">
            <h1>Send a postcard to someone special.</h1>
          </div>
          
          <div className="input-form">
            {/* Name and Handle Row */}
            <div className="name-handle-row">
              <div className="form-group">
                <label htmlFor="recipient-name">Who's getting this postcard?</label>
                <input
                  type="text"
                  id="recipient-name"
                  className="form-input"
                  placeholder="Name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="handle">Got your handle? (eg: cmv01)</label>
                <input
                  type="text"
                  id="handle"
                  className="form-input"
                  placeholder="Handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="sender-email">Where should I drop it off?</label>
              <input
                type="email"
                id="sender-email"
                className="form-input"
                placeholder="Email address"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            <div className="form-group">
              <label htmlFor="message">What do you wanna tell them?</label>
              <textarea
                id="message"
                className="form-textarea"
                placeholder="Message"
                value={message}
                onChange={handleMessageChange}
                maxLength={185}
                required
              />
              <div className="char-count">{message.length}/185</div>
            </div>

            {/* Photo and Signature Row */}
            <div className="photo-signature-row">
              <div className="form-group">
                <label htmlFor="photo">Photo</label>
                <div 
                  className="photo-upload-area"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photo ? (
                    <img src={photo} alt="Selected photo" className="photo-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <span>Add a picture</span>
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
                <label htmlFor="signature">Sign here</label>
                <div className="signature-canvas">
                  <SignatureCanvas onSave={handleSignatureSave} />
                  {!signature && (
                    <div className="signature-placeholder">
                      <span>Signature</span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="clear-signature"
                    onClick={() => {
                      // Clear our signature data for the preview
                      clearSignature();
                      
                      // Find and click the SignatureCanvas clear button to clear the input field
                      const signatureCanvas = document.querySelector('.signature-canvas');
                      if (signatureCanvas) {
                        const canvasClearButton = signatureCanvas.querySelector('button');
                        if (canvasClearButton) {
                          canvasClearButton.click();
                        }
                      }
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Color Picker Row */}
            <div className="form-group">
              <label htmlFor="postcard-color">Choose your postcard color:</label>
              <div className="color-picker-container">
                <input
                  type="color"
                  id="postcard-color"
                  value={postcardBackgroundColor}
                  onChange={(e) => setPostcardBackgroundColor(e.target.value)}
                  className="color-picker"
                />
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={!isFormValid || isSending || isUploading || isSent}
              className={`send-button ${isFormValid ? 'active' : 'disabled'}`}
            >
              {isSent ? 'Postcard Sent!' : isSending ? 'Sending...' : 'Send'}
            </button>


          </div>
        </div>

        {/* Right Column - Postcard Preview */}
        <div className="preview-column">
          {/* Front Side Postcard */}
          <div className="postcard-frame front-side" style={{ backgroundColor: postcardBackgroundColor }}>
            <div className="postcard-content">
              <div className="left-content">
                  <div className="greeting" style={{ color: textColor }}>Hey {recipientName ? `${recipientName},` : ','}</div>
                  <div className="message" style={{ color: textColor }}>{message || ''}</div>
                  <div className="closing" style={{ color: textColor }}>
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
              {/* Dynamic separator line */}
              <div 
                className="separator-line" 
                style={{ 
                  backgroundColor: textColor === '#000000' ? 'rgba(170, 170, 170, 0.16)' : 'rgba(255, 255, 255, 0.3)'
                }}
              ></div>
              {signature && (
                <div className="signature-display" style={{ filter: textColor === '#000000' ? 'none' : 'brightness(0) invert(1)' }}>
                  <img src={signature} alt="Signature" className="signature-image" />
                </div>
              )}
            </div>
          </div>

          {/* Back Side Postcard */}
          <div className="postcard-frame back-side" style={{ backgroundColor: postcardBackgroundColor }}>
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
      )}
    </div>
  );
};

export default PostCardPage;
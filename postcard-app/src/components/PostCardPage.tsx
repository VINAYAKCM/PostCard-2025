import React, { useState, useRef, useContext } from 'react';
import SignatureCanvas from './SignatureCanvas';
import { UserContext } from '../context/UserContext';
import emailjs from '@emailjs/browser';
import { emailConfig } from '../config/emailConfig';
import { cloudinaryConfig } from '../config/cloudinaryConfig';

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
  const [postcardBackgroundColor, setPostcardBackgroundColor] = useState('#FFFFFF');
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

  const handleDownload = async () => {
    if (!recipientName.trim() || !handle.trim() || !message.trim() || !photo || !signature) {
      alert('Please fill in all fields including recipient name, photo and signature');
      return;
    }

    try {
      // Generate high-quality postcard image for download
      console.log('Generating postcard for download...');
      const postcardImage = await generatePostcardImage();
      console.log('Postcard generated successfully!');
      
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
      setPostcardBackgroundColor('#FFFFFF'); // Reset to default color
    } catch (error) {
      console.error('Error sending postcard:', error);
      alert('Failed to send postcard. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // PIXEL PERFECT SOLUTION: Capture preview elements directly
  const generatePostcardImage = async (): Promise<string> => {
    console.log('🚀 [DOWNLOAD] Generating pixel-perfect postcard...');
    
    try {
      // Get the preview elements
      const frontSide = document.querySelector('.front-side') as HTMLElement;
      const backSide = document.querySelector('.back-side') as HTMLElement;
      
      if (!frontSide || !backSide) {
        throw new Error('Preview elements not found');
      }

      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 512px;
        height: 694px;
        background: ${postcardBackgroundColor};
        border-radius: 0px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      `;
      
      // Clone the elements
      const frontClone = frontSide.cloneNode(true) as HTMLElement;
      const backClone = backSide.cloneNode(true) as HTMLElement;
      
      // Style the clones
      frontClone.style.cssText = `
        width: 100%;
        height: 347px;
        background: ${postcardBackgroundColor};
        border-radius: 20px 20px 0 0;
        margin: 0;
        padding: 0;
        position: relative;
      `;
      
      backClone.style.cssText = `
        width: 100%;
        height: 347px;
        background: ${postcardBackgroundColor};
        border-radius: 0px;
        margin: 0;
        padding: 0;
        position: relative;
      `;
      
      // Ensure images have proper object-fit styling (now supported by fixed version)
      const backImage = backClone.querySelector('.postcard-photo') as HTMLImageElement;
      if (backImage) {
        backImage.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        `;
      }
      
      // Ensure stamp image has proper object-fit styling
      const stampImage = frontClone.querySelector('.stamp-preview img') as HTMLImageElement;
      if (stampImage) {
        stampImage.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          border-radius: 8px;
        `;
      }
      
      // Append to temp container
      tempContainer.appendChild(frontClone);
      tempContainer.appendChild(backClone);
      document.body.appendChild(tempContainer);
      
      // Wait for images to load
      const images = tempContainer.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(img);
          } else {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img);
          }
        });
      });
      
      await Promise.all(imagePromises);
      
      // Capture with html2canvas (object-fit fix version)
      const html2canvas = require('html2canvas-objectfit-fix');
        const canvas = await html2canvas(tempContainer, {
          width: 512,
          height: 694,
          scale: 6, // Increased for higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: postcardBackgroundColor,
          logging: false
        });
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      console.log('✅ [DOWNLOAD] Pixel-perfect postcard generated');
      return dataUrl;
      
    } catch (error) {
      console.error('❌ [DOWNLOAD] Error generating postcard:', error);
      throw error;
    }
  };

  // Helper function to get text width
  const getTextWidth = (text: string, fontSize: number) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    
    context.font = `${fontSize}px SF Pro Display, -apple-system, BlinkMacSystemFont, Arial, sans-serif`;
    return context.measureText(text).width;
  };

  const generateEmailFriendlyImage = async (): Promise<string> => {
    console.log('🚀 [EMAIL] Generating pixel-perfect email postcard...');
    
    try {
      // Get the preview elements
      const frontSide = document.querySelector('.front-side') as HTMLElement;
      const backSide = document.querySelector('.back-side') as HTMLElement;
      
      if (!frontSide || !backSide) {
        throw new Error('Preview elements not found');
      }

      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 512px;
        height: 694px;
        background: ${postcardBackgroundColor};
        border-radius: 0px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      `;
      
      // Clone the elements
      const frontClone = frontSide.cloneNode(true) as HTMLElement;
      const backClone = backSide.cloneNode(true) as HTMLElement;
      
      // Style the clones
      frontClone.style.cssText = `
        width: 100%;
        height: 347px;
        background: ${postcardBackgroundColor};
        border-radius: 20px 20px 0 0;
        margin: 0;
        padding: 0;
        position: relative;
      `;
      
      backClone.style.cssText = `
        width: 100%;
        height: 347px;
        background: ${postcardBackgroundColor};
        border-radius: 0px;
        margin: 0;
        padding: 0;
        position: relative;
      `;
      
      // Ensure images have proper object-fit styling (now supported by fixed version)
      const backImage = backClone.querySelector('.postcard-photo') as HTMLImageElement;
      if (backImage) {
        backImage.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        `;
      }
      
      // Ensure stamp image has proper object-fit styling
      const stampImage = frontClone.querySelector('.stamp-preview img') as HTMLImageElement;
      if (stampImage) {
        stampImage.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          border-radius: 8px;
        `;
      }
      
      // Append to temp container
      tempContainer.appendChild(frontClone);
      tempContainer.appendChild(backClone);
      document.body.appendChild(tempContainer);
      
      // Wait for images to load
      const images = tempContainer.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(img);
          } else {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img);
          }
        });
      });
      
      await Promise.all(imagePromises);
      
      // Capture with html2canvas (object-fit fix version)
      const html2canvas = require('html2canvas-objectfit-fix');
        const canvas = await html2canvas(tempContainer, {
          width: 512,
          height: 694,
          scale: 4, // Increased for higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: postcardBackgroundColor,
          logging: false
        });
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      console.log('✅ [EMAIL] Pixel-perfect email postcard generated');
      return dataUrl;
      
    } catch (error) {
      console.error('❌ [EMAIL] Error generating email postcard:', error);
      throw error;
    }
  };

  // HTML2Canvas captures the exact preview - perfect quality guaranteed!

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
        from_email: userData.email, // Add sender's email
        from_handle: userData.handle,
        message: message,
        postcard_image: imageUrl, // Cloudinary URL
        subject: `Digital Postcard from @${userData.handle}`
      };

      console.log('🔍 DEBUG: Template parameters being sent to EmailJS:');
      console.log('  - to_email:', templateParams.to_email);
      console.log('  - to_name:', templateParams.to_name);
      console.log('  - from_email:', templateParams.from_email);
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
      {/* Download button in top right corner */}
      <button
        onClick={handleDownload}
        disabled={!isFormValid}
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
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                required
              />
              <div className="char-count">{message.length}/200</div>
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
                <label htmlFor="signature">How do you want to sign it?</label>
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
              disabled={!isFormValid || isSending || isUploading}
              className={`send-button ${isFormValid ? 'active' : 'disabled'}`}
            >
              {isUploading ? 'Uploading...' : isSending ? 'Sending...' : 'Send'}
            </button>


          </div>
        </div>

        {/* Right Column - Postcard Preview */}
        <div className="preview-column">
          {/* Front Side Postcard */}
          <div className="postcard-frame front-side" style={{ backgroundColor: postcardBackgroundColor }}>
            <div className="postcard-content">
              <div className="left-content">
                <div className="greeting">Hey {recipientName ? `${recipientName},` : ','}</div>
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
  );
};

export default PostCardPage;
import React, { useState, useRef, useContext } from 'react';
import SignatureCanvas from './SignatureCanvas';
import { UserContext } from '../context/UserContext';
import { cloudinaryConfig } from '../config/cloudinaryConfig';
import emailjs from '@emailjs/browser';
import { emailConfig } from '../config/emailConfig';
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

  const generatePostcardImage = async (): Promise<string> => {
    // Create a high-quality combined postcard image (front + back sides)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Generate at 3x resolution for crisp quality
    const scale = 3;
    canvas.width = 1024 * scale; // Front + back side by side (512 * 2)
    canvas.height = 347 * scale;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Set high DPI for crisp text
    ctx.scale(scale, scale);

    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

    // Generate Front Side (Left side - Message)
    await generateFrontSide(ctx, 0, 0, 1);

    // Generate Back Side (Right side - Photo)
    await generateBackSide(ctx, 512, 0, 1);

    // Return high-quality PNG
    return canvas.toDataURL('image/png', 1.0);
  };

  const generateFrontSide = async (ctx: CanvasRenderingContext2D, xOffset: number, yOffset: number, scale: number): Promise<void> => {
    const width = 573 * scale;
    const height = 405 * scale;
    
    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(xOffset, yOffset, width, height);

    // Add border with rounded corners effect
    ctx.strokeStyle = '#e1e5e9';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(xOffset + scale, yOffset + scale, width - 2 * scale, height - 2 * scale);

    // Set text properties for crisp rendering
    ctx.font = `700 ${16 * scale}px 'Inter', Arial, sans-serif`; // Changed to 16px as specified
    ctx.fillStyle = '#000'; // Black color as shown
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    
    // Enable text anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Add greeting with exact positioning from Figma
    ctx.fillText(`Dear ${recipientName ? `${recipientName},` : ','}`, xOffset + 10 * scale, yOffset + 20 * scale); // Changed to 10px from left

    // Add message with word wrapping (only if message exists)
    if (message && message.trim()) {
      ctx.font = `${16 * scale}px 'Inter', Arial, sans-serif`;
      ctx.fillStyle = '#555';
      ctx.textBaseline = 'top';
      
      const maxWidth = 300 * scale;
      const lineHeight = 22 * scale;
      const words = message.split(' ');
      let line = '';
      let y = yOffset + 60 * scale; // Positioned below greeting
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, xOffset + 10 * scale, y); // Changed to 10px to match CSS
          line = words[i] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, xOffset + 10 * scale, y); // Changed to 10px to match CSS
    }

    // Add closing with exact positioning from Figma
    ctx.font = `${18 * scale}px 'Inter', Arial, sans-serif`;
    ctx.fillStyle = '#000'; // Black color as shown
    ctx.fillText('Sincerely,', xOffset + 10 * scale, yOffset + 327 * scale); // Changed to 10px to match CSS
    
    // Add profile image or fallback icon
    if (userData?.profileImage) {
      // Draw profile image as 17x17 circle
      const profileImg = new Image();
      profileImg.onload = () => {
        ctx.save();
        ctx.beginPath();
        const profileX = xOffset + 10 * scale + ctx.measureText('Sincerely, ').width + 5 * scale; // Changed to 10px
        const profileY = yOffset + 327 * scale - 17 * scale; // Align with text baseline
        const radius = 8.5 * scale; // 17/2 = 8.5
        
        ctx.arc(profileX + radius, profileY + radius, radius, 0, 2 * Math.PI);
        ctx.clip();
        
        // Calculate dimensions to maintain aspect ratio
        const profileAspectRatio = profileImg.width / profileImg.height;
        let profileWidth, profileHeight;
        
        if (profileAspectRatio > 1) {
          profileWidth = 17 * scale;
          profileHeight = (17 * scale) / profileAspectRatio;
        } else {
          profileHeight = 17 * scale;
          profileWidth = (17 * scale) * profileAspectRatio;
        }
        
        const profileDrawX = profileX + (17 * scale - profileWidth) / 2;
        const profileDrawY = profileY + (17 * scale - profileHeight) / 2;
        
        ctx.drawImage(profileImg, profileDrawX, profileDrawY, profileWidth, profileHeight);
        ctx.restore();
        
        // Add handle text after profile image
        ctx.fillText(`@${handle}`, profileX + 17 * scale + 5 * scale, yOffset + 327 * scale);
      };
      profileImg.src = userData.profileImage;
    } else {
      // Fallback to icon and handle
      ctx.fillText(`👤 @${handle}`, xOffset + 10 * scale, yOffset + 347 * scale); // Changed to 10px
    }

    // Add AI Stamp in the right column area (matching preview layout)
    const stampSize = 80 * scale; // Updated dimensions: 80x80
    const stampX = xOffset + 400 * scale; // Positioned for right column visibility (was 433, too far right)
    const stampY = yOffset + 12 * scale; // Changed from 17px to 12px from top

    // Draw stamp as a square profile image with rotation (no background)
    ctx.save();
    ctx.translate(stampX + stampSize / 2, stampY + stampSize / 2);
    ctx.rotate(5.44 * Math.PI / 180); // 5.44° rotation to the right
    
    // Add profile image to stamp with rounded square clipping (no background)
    if (userData?.profileImage) {
      const profileImg = new Image();
      profileImg.onload = () => {
        ctx.save();
        ctx.beginPath();
        
        // Create rounded square clip path for stamp - 8px rounded corners
        const halfSize = stampSize / 2;
        const radius = 8 * scale; // Changed from 4px to 8px rounded corners
        
        // Draw rounded rectangle path
        ctx.moveTo(-halfSize + radius, -halfSize);
        ctx.lineTo(halfSize - radius, -halfSize);
        ctx.quadraticCurveTo(halfSize, -halfSize, halfSize, -halfSize + radius);
        ctx.lineTo(halfSize, halfSize - radius);
        ctx.quadraticCurveTo(halfSize, halfSize, halfSize - radius, halfSize);
        ctx.lineTo(-halfSize + radius, halfSize);
        ctx.quadraticCurveTo(-halfSize, halfSize, -halfSize, halfSize - radius);
        ctx.lineTo(-halfSize, -halfSize + radius);
        ctx.quadraticCurveTo(-halfSize, -halfSize, -halfSize + radius, -halfSize);
        ctx.closePath();
        ctx.clip();
        
        // Draw the profile image to fill the entire rounded square stamp area
        ctx.drawImage(profileImg, -halfSize, -halfSize, stampSize, stampSize);
        ctx.restore();
      };
      profileImg.src = userData.profileImage;
    }
    
    ctx.restore();

    // Add signature exactly 33px from vertical line
    if (signature) {
      const signatureImg = new Image();
      signatureImg.onload = () => {
        // Position signature exactly 33px from vertical line in right column
        const signatureX = xOffset + 256 + 33 * scale; // 50% of 512px is 256px, plus 33px
        const signatureY = yOffset + 327 * scale; // Aligned with "Sincerely," line
        ctx.drawImage(signatureImg, signatureX, signatureY, 180 * scale, 90 * scale); // Updated to 180x90 to match preview
      };
      signatureImg.src = signature;
    }
  };

  const generateBackSide = async (ctx: CanvasRenderingContext2D, xOffset: number, yOffset: number, scale: number): Promise<void> => {
    const width = 512 * scale;
    const height = 347 * scale;
    
    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(xOffset, yOffset, width, height);

    // Add border with rounded corners effect
    ctx.strokeStyle = '#e1e5e9';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(xOffset + scale, yOffset + scale, width - 2 * scale, height - 2 * scale);

    // Draw vertical line separator (matching CSS preview)
    ctx.strokeStyle = 'rgba(170, 170, 170, 0.16)'; // #AAAAAA with 16% opacity
    ctx.lineWidth = 2 * scale; // 2px weight
    const lineX = xOffset + (width / 2); // Center of postcard (50%)
    const lineTop = yOffset + 23.5 * scale; // Top position for 300px line height
    const lineBottom = yOffset + (height - 23.5 * scale); // Bottom position for 300px line height
    ctx.beginPath();
    ctx.moveTo(lineX, lineTop);
    ctx.lineTo(lineX, lineBottom);
    ctx.stroke();

    if (photo) {
      // Draw the uploaded photo on the back side
      const photoImg = new Image();
      return new Promise((resolve) => {
        photoImg.onload = () => {
          // Fill the entire postcard frame with the photo while maintaining aspect ratio
          const padding = 0; // No padding - fill entire frame
          const maxPhotoWidth = width - (padding * 2);
          const maxPhotoHeight = height - (padding * 2);
          
          // Calculate aspect ratios
          const photoAspectRatio = photoImg.width / photoImg.height;
          const frameAspectRatio = maxPhotoWidth / maxPhotoHeight;
          
          let photoWidth, photoHeight;
          
          if (photoAspectRatio > frameAspectRatio) {
            // Photo is wider than frame - fit to height and crop sides
            photoHeight = maxPhotoHeight;
            photoWidth = maxPhotoHeight * photoAspectRatio;
          } else {
            // Photo is taller than frame - fit to width and crop top/bottom
            photoWidth = maxPhotoWidth;
            photoHeight = maxPhotoWidth / photoAspectRatio;
          }
          
          // Center the photo and crop to fill the entire frame
          const photoX = xOffset + padding - (photoWidth - maxPhotoWidth) / 2;
          const photoY = yOffset + padding - (photoHeight - maxPhotoHeight) / 2;
          
          ctx.drawImage(photoImg, photoX, photoY, photoWidth, photoHeight);
          resolve();
        };
        photoImg.src = photo;
      });
    } else {
      // If no photo, add placeholder text
      ctx.fillStyle = '#999';
      ctx.font = `${16 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('Photo will appear here', xOffset + width / 2, yOffset + height / 2);
      ctx.textAlign = 'left';
    }
  };

  const generateEmailFriendlyImage = async (): Promise<string> => {
    // Create a smaller version specifically for email that fits within EmailJS limits
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Use 2x scale for email - high quality but reasonable file size
    const scale = 2;
    canvas.width = 1024 * scale; // Front + back side by side (512 * 2)
    canvas.height = 347 * scale;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Set high DPI for crisp text
    ctx.scale(scale, scale);

    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

    // Generate Front Side (Left side - Message)
    await generateFrontSide(ctx, 0, 0, 1);

    // Generate Back Side (Right side - Photo)
    await generateBackSide(ctx, 512, 0, 1);

    // Return as high-quality JPEG to reduce file size while maintaining quality
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const sendPostcardEmail = async (postcardImage: string): Promise<void> => {
    try {
      // Check if Cloudinary is configured
      if (cloudinaryConfig.cloudName === 'YOUR_CLOUDINARY_CLOUD_NAME') {
        alert('Please configure Cloudinary first. Check the cloudinaryConfig.ts file for setup instructions.');
        return;
      }

      setIsUploading(true);
      
      // Convert base64 data URL to Blob for Cloudinary upload
      const base64Data = postcardImage.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
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

      console.log('Sending email with params:', templateParams);

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
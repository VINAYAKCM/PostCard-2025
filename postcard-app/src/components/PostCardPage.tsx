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
    canvas.width = 1146 * scale; // Front + back side by side
    canvas.height = 405 * scale;

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
    await generateBackSide(ctx, 573, 0, 1);

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
    ctx.font = `bold ${24 * scale}px 'Segoe UI', Arial, sans-serif`;
    ctx.fillStyle = '#333';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    
    // Enable text anti-aliasing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Add greeting
    ctx.fillText(`Dear ${recipientName},`, xOffset + 30 * scale, yOffset + 50 * scale);

    // Add message with word wrapping
    ctx.font = `${16 * scale}px 'Segoe UI', Arial, sans-serif`;
    ctx.fillStyle = '#555';
    ctx.textBaseline = 'top';
    
    const maxWidth = 300 * scale;
    const lineHeight = 22 * scale;
    const words = message.split(' ');
    let line = '';
    let y = yOffset + 100 * scale;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, xOffset + 30 * scale, y);
        line = words[i] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, xOffset + 30 * scale, y);

    // Add closing
    ctx.font = `${18 * scale}px 'Segoe UI', Arial, sans-serif`;
    ctx.fillStyle = '#333';
    ctx.fillText('Sincerely,', xOffset + 30 * scale, yOffset + 280 * scale);
    ctx.fillText(`👤 @${handle}`, xOffset + 30 * scale, yOffset + 310 * scale);

    // Add AI Stamp in the right column area (matching preview layout)
    const stampSize = 80 * scale;
    const stampX = xOffset + 400 * scale; // Position in right column
    const stampY = yOffset + 50 * scale;
    
    // Draw profile image in stamp (circular, no border or text)
    if (userData?.profileImage) {
      const profileImg = new Image();
      return new Promise((resolve) => {
        profileImg.onload = () => {
          // Draw profile image in stamp (circular, maintaining aspect ratio)
          ctx.save();
          ctx.beginPath();
          const centerX = stampX + stampSize / 2;
          const centerY = stampY + stampSize / 2;
          const radius = (stampSize - 10 * scale) / 2; // Slightly smaller for clean look
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.clip();
          
          // Calculate dimensions to maintain aspect ratio
          const profileAspectRatio = profileImg.width / profileImg.height;
          const stampAspectRatio = (radius * 2) / (radius * 2);
          
          let profileWidth, profileHeight;
          
          if (profileAspectRatio > stampAspectRatio) {
            // Profile is wider - fit to width
            profileWidth = radius * 2;
            profileHeight = (radius * 2) / profileAspectRatio;
          } else {
            // Profile is taller - fit to height
            profileHeight = radius * 2;
            profileWidth = (radius * 2) * profileAspectRatio;
          }
          
          // Center the profile image within the stamp
          const profileX = centerX - profileWidth / 2;
          const profileY = centerY - profileHeight / 2;
          
          ctx.drawImage(profileImg, profileX, profileY, profileWidth, profileHeight);
          ctx.restore();
          
          // Add signature below the stamp (matching preview layout)
          if (signature) {
            const signatureImg = new Image();
            signatureImg.onload = () => {
              // Position signature below the stamp, maintaining aspect ratio
              const signatureAspectRatio = signatureImg.width / signatureImg.height;
              const maxSignatureWidth = 120 * scale;
              const maxSignatureHeight = 60 * scale;
              
              let signatureWidth, signatureHeight;
              
              if (signatureAspectRatio > maxSignatureWidth / maxSignatureHeight) {
                // Signature is wider - fit to width
                signatureWidth = maxSignatureWidth;
                signatureHeight = maxSignatureWidth / signatureAspectRatio;
              } else {
                // Signature is taller - fit to height
                signatureHeight = maxSignatureHeight;
                signatureWidth = maxSignatureHeight * signatureAspectRatio;
              }
              
              // Center the signature below the stamp
              const signatureX = stampX + (maxSignatureWidth - signatureWidth) / 2;
              const signatureY = stampY + stampSize + 30 * scale + (maxSignatureHeight - signatureHeight) / 2;
              
              ctx.drawImage(signatureImg, signatureX, signatureY, signatureWidth, signatureHeight);
              resolve();
            };
            signatureImg.src = signature;
          } else {
            resolve();
          }
        };
        profileImg.src = userData.profileImage!;
      });
    } else {
      // Add signature if available (without profile image)
      if (signature) {
        const signatureImg = new Image();
        return new Promise((resolve) => {
          signatureImg.onload = () => {
            // Position signature below the stamp, maintaining aspect ratio
            const signatureAspectRatio = signatureImg.width / signatureImg.height;
            const maxSignatureWidth = 120 * scale;
            const maxSignatureHeight = 60 * scale;
            
            let signatureWidth, signatureHeight;
            
            if (signatureAspectRatio > maxSignatureWidth / maxSignatureHeight) {
              // Signature is wider - fit to width
              signatureWidth = maxSignatureWidth;
              signatureHeight = maxSignatureWidth / signatureAspectRatio;
            } else {
              // Signature is taller - fit to height
              signatureHeight = maxSignatureHeight;
              signatureWidth = maxSignatureHeight * signatureAspectRatio;
            }
            
            // Center the signature below the stamp
            const signatureX = stampX + (maxSignatureWidth - signatureWidth) / 2;
            const signatureY = stampY + stampSize + 30 * scale + (maxSignatureHeight - signatureHeight) / 2;
            
            ctx.drawImage(signatureImg, signatureX, signatureY, signatureWidth, signatureHeight);
            resolve();
          };
          signatureImg.src = signature;
        });
      }
      // If no profile image and no signature, return resolved promise
      return Promise.resolve();
    }
  };

  const generateBackSide = async (ctx: CanvasRenderingContext2D, xOffset: number, yOffset: number, scale: number): Promise<void> => {
    const width = 573 * scale;
    const height = 405 * scale;
    
    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(xOffset, yOffset, width, height);

    // Add border with rounded corners effect
    ctx.strokeStyle = '#e1e5e9';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(xOffset + scale, yOffset + scale, width - 2 * scale, height - 2 * scale);

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
    canvas.width = 1146 * scale;
    canvas.height = 405 * scale;

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
    await generateBackSide(ctx, 573, 0, 1);

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
                <div className="greeting">Dear {recipientName || 'Recipient'},</div>
                <div className="message">{message || 'Your message will appear here...'}</div>
                <div className="closing">
                  Sincerely, <span className="user-icon">👤</span> @{handle || 'handle'}
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
                {signature && (
                  <div className="signature-display">
                    <img src={signature} alt="Signature" className="signature-image" />
                  </div>
                )}
              </div>
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
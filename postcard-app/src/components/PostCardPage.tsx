import React, { useState, useRef, useContext } from 'react';
import SignatureCanvas from './SignatureCanvas';
import { UserContext } from '../context/UserContext';
import emailjs from '@emailjs/browser';
import { emailConfig } from '../config/emailConfig';
import { cloudinaryConfig } from '../config/cloudinaryConfig';
import html2canvas from 'html2canvas';
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
    console.log('🔍 Capturing front and back postcards separately...');
    
    // Capture front side postcard
    const frontSide = document.querySelector('.front-side') as HTMLElement;
    if (!frontSide) {
      throw new Error('Front side not found');
    }
    
    // Capture back side postcard
    const backSide = document.querySelector('.back-side') as HTMLElement;
    if (!backSide) {
      throw new Error('Back side not found');
    }
    
    // Create a temporary container for the combined postcard
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.background = 'white';
    tempContainer.style.display = 'flex';
    tempContainer.style.flexDirection = 'column';
    tempContainer.style.gap = '0';
    
    // Clone front side and maintain exact original dimensions
    const frontClone = frontSide.cloneNode(true) as HTMLElement;
    // Keep original dimensions - don't override them
    frontClone.style.borderRadius = '20px 20px 0 0'; // Top corners only
    frontClone.style.margin = '0';
    frontClone.style.padding = '0';
    // Ensure all child elements maintain their original sizing
    const frontContent = frontClone.querySelector('.postcard-content') as HTMLElement;
    if (frontContent) {
      frontContent.style.width = '100%';
      frontContent.style.height = '100%';
    }
    tempContainer.appendChild(frontClone);
    
    // Clone back side and maintain exact original dimensions
    const backClone = backSide.cloneNode(true) as HTMLElement;
    // Keep original dimensions - don't override them
    backClone.style.borderRadius = '0 0 20px 20px'; // Bottom corners only
    backClone.style.margin = '0';
    backClone.style.padding = '0';
    // Ensure photo maintains original dimensions
    const photoContainer = backClone.querySelector('.photo-container') as HTMLElement;
    if (photoContainer) {
      photoContainer.style.width = '100%';
      photoContainer.style.height = '100%';
    }
    const postcardPhoto = backClone.querySelector('.postcard-photo') as HTMLElement;
    if (postcardPhoto) {
      postcardPhoto.style.width = '100%';
      postcardPhoto.style.height = '100%';
      postcardPhoto.style.objectFit = 'cover';
    }
    tempContainer.appendChild(backClone);
    
    // Add to DOM temporarily
    document.body.appendChild(tempContainer);
    
    try {
      // Capture with html2canvas using natural dimensions
      const canvas = await html2canvas(tempContainer, {
        scale: 3, // High quality
        backgroundColor: 'white',
        useCORS: true,
        allowTaint: true,
        logging: true,
        width: undefined, // Let html2canvas determine natural width
        height: undefined // Let html2canvas determine natural height
      });
      
      console.log('🔍 Front and back postcards captured and stacked successfully');
      return canvas.toDataURL('image/png', 1.0);
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
    }
  };

  const generateEmailFriendlyImage = async (): Promise<string> => {
    console.log('🔍 Capturing front and back postcards separately for email...');
    
    // Capture front side postcard
    const frontSide = document.querySelector('.front-side') as HTMLElement;
    if (!frontSide) {
      throw new Error('Front side not found');
    }
    
    // Capture back side postcard
    const backSide = document.querySelector('.back-side') as HTMLElement;
    if (!backSide) {
      throw new Error('Back side not found');
    }
    
    // Create a temporary container for the combined postcard
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.background = 'white';
    tempContainer.style.display = 'flex';
    tempContainer.style.flexDirection = 'column';
    tempContainer.style.gap = '0';
    
    // Clone front side and maintain exact original dimensions
    const frontClone = frontSide.cloneNode(true) as HTMLElement;
    // Keep original dimensions - don't override them
    frontClone.style.borderRadius = '20px 20px 0 0'; // Top corners only
    frontClone.style.margin = '0';
    frontClone.style.padding = '0';
    // Ensure all child elements maintain their original sizing
    const frontContent = frontClone.querySelector('.postcard-content') as HTMLElement;
    if (frontContent) {
      frontContent.style.width = '100%';
      frontContent.style.height = '100%';
    }
    tempContainer.appendChild(frontClone);
    
    // Clone back side and maintain exact original dimensions
    const backClone = backSide.cloneNode(true) as HTMLElement;
    // Keep original dimensions - don't override them
    backClone.style.borderRadius = '0 0 20px 20px'; // Bottom corners only
    backClone.style.margin = '0';
    backClone.style.padding = '0';
    // Ensure photo maintains original dimensions
    const photoContainer = backClone.querySelector('.photo-container') as HTMLElement;
    if (photoContainer) {
      photoContainer.style.width = '100%';
      photoContainer.style.height = '100%';
    }
    const postcardPhoto = backClone.querySelector('.postcard-photo') as HTMLElement;
    if (postcardPhoto) {
      postcardPhoto.style.width = '100%';
      postcardPhoto.style.height = '100%';
      postcardPhoto.style.objectFit = 'cover';
    }
    tempContainer.appendChild(backClone);
    
    // Add to DOM temporarily
    document.body.appendChild(tempContainer);
    
    try {
      // Capture with html2canvas using natural dimensions
      const canvas = await html2canvas(tempContainer, {
        scale: 2, // Good quality for email
        backgroundColor: 'white',
        useCORS: true,
        allowTaint: true,
        logging: true,
        width: undefined, // Let html2canvas determine natural width
        height: undefined // Let html2canvas determine natural height
      });
      
      console.log('🔍 Front and back postcards captured and stacked successfully for email');
      return canvas.toDataURL('image/jpeg', 0.95);
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
    }
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
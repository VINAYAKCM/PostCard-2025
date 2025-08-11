import React, { useState, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import SignatureCanvas from './SignatureCanvas';
import './PostCardPage.css';

const PostCardPage: React.FC = () => {
  const { userData } = useUser();
  const [handle, setHandle] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
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

  const handleSignatureSave = useCallback((signatureData: string) => {
    setSignature(signatureData);
  }, []);

  const clearSignature = () => {
    setSignature(null);
  };

  const handleSend = async () => {
    if (!handle.trim() || !senderEmail.trim() || !message.trim() || !photo || !signature) {
      alert('Please fill in all fields including photo and signature');
      return;
    }

    setIsSending(true);
    
    try {
      // For prototype, we'll simulate email sending
      // In production, this would integrate with an email service
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      alert('Postcard sent successfully! Check your email.');
      
      // Reset form
      setHandle('');
      setSenderEmail('');
      setMessage('');
      setPhoto(null);
      setSignature(null);
    } catch (error) {
      alert('Failed to send postcard. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const isFormValid = handle.trim() && senderEmail.trim() && message.trim() && photo && signature;

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
                  <img src={photo} alt="Uploaded photo" className="photo-preview" />
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
              disabled={!isFormValid || isSending}
              className={`send-button ${isFormValid ? 'active' : 'disabled'}`}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Right Column - Postcard Preview */}
        <div className="preview-column">
          {/* Front Side Postcard */}
          <div className="postcard-frame front-side">
            <div className="postcard-content">
              <div className="left-content">
                <div className="greeting">Dear Website,</div>
                <div className="message">{message || 'Your message will appear here...'}</div>
                <div className="closing">
                  Sincerely, <span className="user-icon">👤</span> @{handle || 'handle'}
                </div>
              </div>
              <div className="right-content">
                <div className="stamp-placeholder">
                  <div className="stamp-label">AI Stamp</div>
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
                <img src={photo} alt="Postcard photo" className="postcard-photo" />
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

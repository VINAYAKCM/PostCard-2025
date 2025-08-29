import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import UnlockIcon from '../assets/Unlock.svg';
import './SetupPage.css';

const SetupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailLimitMessage, setEmailLimitMessage] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setUserData } = useUser();
  const navigate = useNavigate();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImage(result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const checkEmailLimit = async (email: string) => {
    if (!email.trim()) return;
    
    setIsCheckingEmail(true);
    setEmailLimitMessage('');
    
    try {
      const response = await fetch('http://localhost:3002/api/check-email-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      });
      
      const data = await response.json();
      
      if (data.isCreator) {
        setEmailLimitMessage('Executive access granted');
        setIsCreator(true);
      } else if (data.limitReached) {
        setEmailLimitMessage('You have already reached your limit.');
        setIsCreator(false);
      } else {
        setEmailLimitMessage('One postcard trial available');
        setIsCreator(false);
      }
    } catch (error) {
      setEmailLimitMessage('Could not check email limit');
      setIsCreator(false);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSetup = () => {
    if (name.trim() && fromEmail.trim() && profileImage) {
      // Check if user is creator or has available postcard
      if (isCreator || emailLimitMessage.includes('One postcard trial available')) {
        setUserData({
          name: name.trim(),
          email: fromEmail.trim(),
          handle: name.trim().toLowerCase().replace(/\s+/g, ''), // Generate handle from name
          profileImage
        });
        navigate('/postcard');
      } else {
        setEmailLimitMessage('Cannot proceed - email limit reached');
      }
    }
  };

  const isFormValid = name.trim() && fromEmail.trim() && profileImage && !emailLimitMessage.includes('You have already reached your limit.');

  return (
    <div className="setup-page">
      <div className="setup-container">
        <h1>Postcards, but reimagined.</h1>
        <p className="subtitle">"Sending love, not just messages."</p>
        
        <div className="separator-line"></div>
        
        <div className="setup-form">
          <div className="form-group">
            <label htmlFor="name">Who's signing this postcard?</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="setup-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="from-email">Where should we send this from?</label>
            <input
              type="email"
              id="from-email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              onBlur={(e) => checkEmailLimit(e.target.value)}
              placeholder="Your email address"
              className="setup-input"
            />
            {emailLimitMessage && (
              <div className={`email-limit-message ${isCreator ? 'vip' : emailLimitMessage.includes('❌') ? 'error' : 'normal'}`}>
                {isCreator && <img src={UnlockIcon} alt="Unlock" className="unlock-icon" />}
                <span className="message-text">{emailLimitMessage}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="profile-image">Choose a photo — we'll turn it into your stamp</label>
            <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
              {imagePreview ? (
                <img src={imagePreview} alt="Profile preview" className="profile-preview" />
              ) : (
                <div className="upload-placeholder">
                  <span>Add a picture</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              id="profile-image"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>

          <button
            onClick={handleSetup}
            disabled={!isFormValid}
            className={`setup-button ${isFormValid ? 'active' : 'disabled'}`}
          >
            Setup
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;

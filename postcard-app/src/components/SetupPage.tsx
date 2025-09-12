import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getApiUrl } from '../config/apiConfig';
import './SetupPage.css';

const SetupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setUserData, emailCheckResult, setEmailCheckResult } = useUser();
  const navigate = useNavigate();

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check email status when email changes
  const checkEmailStatus = async (email: string) => {
    // Clear previous errors
    setEmailError(null);
    
    if (!email) {
      setEmailCheckResult(null);
      return;
    }

    // Check email format first
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      setEmailCheckResult(null);
      return;
    }

    setIsCheckingEmail(true);
    try {
      const response = await fetch(getApiUrl('/api/check-email-limit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const result = await response.json();
        setEmailCheckResult(result);
        setEmailError(null);
      } else {
        console.error('Failed to check email status');
        setEmailError('Could not check email');
        setEmailCheckResult(null);
      }
    } catch (error) {
      console.error('Error checking email status:', error);
      setEmailError('Could not check email');
      setEmailCheckResult(null);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Debounced email check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (fromEmail.trim()) {
        checkEmailStatus(fromEmail.trim());
      } else {
        setEmailCheckResult(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [fromEmail]);

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

  const handleSetup = () => {
    if (name.trim() && fromEmail.trim() && profileImage && emailCheckResult?.allowed) {
      setUserData({
        name: name.trim(),
        email: fromEmail.trim(),
        handle: name.trim().toLowerCase().replace(/\s+/g, ''), // Generate handle from name
        profileImage
      });
      navigate('/postcard');
    }
  };

  const isFormValid = name.trim() && fromEmail.trim() && profileImage && emailCheckResult?.allowed && !emailError;

  return (
    <div className="setup-page">
      <div className="setup-container">
        <h1>Personal messages, beautifully<br/> delivered.</h1>
        <p className="subtitle">Made for meaningful connections.</p>
        
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
            <label htmlFor="from-email">Where should we say this is from?</label>
            <input
              type="email"
              id="from-email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="Your email address"
              className="setup-input"
            />
            {emailCheckResult && (
              <div className={`email-status-message ${
                emailCheckResult.isCreator ? 'vip' : 
                emailCheckResult.hasUsedPostcard ? 'error' : 'normal'
              }`}>
                {emailCheckResult.isCreator && (
                  <img 
                    src="/unlock-icon.svg" 
                    alt="Lock icon" 
                    className="icon"
                  />
                )}
                <span className="text">{emailCheckResult.message}</span>
              </div>
            )}
            {isCheckingEmail && (
              <div className="email-status-message normal">
                <span className="text">Checking email...</span>
              </div>
            )}
            {emailError && (
              <div className="email-status-message error">
                <span className="text">{emailError}</span>
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

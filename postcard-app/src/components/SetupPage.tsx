import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './SetupPage.css';

const SetupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  const handleSetup = () => {
    if (name.trim() && fromEmail.trim() && profileImage) {
      setUserData({
        name: name.trim(),
        email: fromEmail.trim(),
        handle: name.trim().toLowerCase().replace(/\s+/g, ''), // Generate handle from name
        profileImage
      });
      navigate('/postcard');
    }
  };

  const isFormValid = name.trim() && fromEmail.trim() && profileImage;

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

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './SetupPage.css';

const SetupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
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
    if (name.trim() && handle.trim() && profileImage) {
      setUserData({
        name: name.trim(),
        handle: handle.trim(),
        profileImage
      });
      navigate('/postcard');
    }
  };

  const isFormValid = name.trim() && handle.trim() && profileImage;

  return (
    <div className="setup-page">
      <div className="setup-container">
        <h1>Welcome to PostCard</h1>
        <p className="subtitle">Let's get you set up to send beautiful digital postcards</p>
        
        <div className="setup-form">
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="setup-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="handle">User Handle</label>
            <input
              type="text"
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@username"
              className="setup-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-image">Profile Picture</label>
            <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
              {imagePreview ? (
                <img src={imagePreview} alt="Profile preview" className="profile-preview" />
              ) : (
                <div className="upload-placeholder">
                  <span>Click to upload image</span>
                  <small>This will be used to create your custom stamp</small>
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

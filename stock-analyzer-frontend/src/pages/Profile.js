import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, refreshUserData } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    username: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [initialData, setInitialData] = useState({});

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      console.log('👤 Setting form data from user:', user);
      const userData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        username: user.username || ''
      };
      setFormData(userData);
      setInitialData(userData);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Check if data has changed
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);
    setIsDirty(hasChanges);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isDirty) {
      toast.info('No changes to save');
      return;
    }

    // Validation
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        toast.success('Profile updated successfully!');
        setInitialData(formData);
        setIsDirty(false);
        await refreshUserData(); // Refresh user data from server
      }
    } catch (error) {
      toast.error(error.message || 'Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate character count for bio
  const bioCharCount = formData.bio.length;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile Settings</h1>
        <p>Manage your account information</p>
      </div>

      {/* User Stats */}
      {user?.stats && (
        <div className="user-stats">
          <div className="stat-item">
            <span className="stat-value">{user.stats.watchlistCount || 0}</span>
            <span className="stat-label">Watchlist Items</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{user.stats.portfolioCount || 0}</span>
            <span className="stat-label">Portfolio Holdings</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{user.stats.alertsCount || 0}</span>
            <span className="stat-label">Active Alerts</span>
          </div>
        </div>
      )}

      <div className="user-badge">
        <div className="user-info">
          <span className="username">{user?.username || 'User'}</span>
          <span className="user-email">{user?.email || ''}</span>
        </div>
        <span className="plan-tag">{user?.plan || 'Premium'}</span>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="input-row">
            <div className="input-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
              />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Username"
                required
              />
              {!formData.username && (
                <span className="error-text">Username is required</span>
              )}
            </div>
            <div className="input-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              rows="3"
              maxLength="500"
            />
            <div className={`char-count ${bioCharCount > 450 ? 'warning' : ''}`}>
              {bioCharCount}/500
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Email Address</h3>
          <div className="input-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              required
            />
            {!formData.email && (
              <span className="error-text">Email is required</span>
            )}
            {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
              <span className="error-text">Please enter a valid email</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <div className="action-info">
            {isDirty && (
              <span className="unsaved-changes">⚠️ You have unsaved changes</span>
            )}
          </div>
          <button 
            type="submit" 
            className="save-btn"
            disabled={isLoading || !isDirty}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
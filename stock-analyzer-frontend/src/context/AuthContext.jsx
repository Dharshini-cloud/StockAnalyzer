import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../api/watchlistApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('user');
    if (token) {
      try {
        const userData = JSON.parse(token);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔑 Attempting login...');
      const response = await authAPI.login(email, password);
      
      if (response.data.success) {
        const userData = {
          ...response.data.data,
          access_token: response.data.data.access_token
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        console.log('✅ Login successful');
        return response.data;
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const register = async (username, email, password) => {
    try {
      console.log('👤 Attempting registration...');
      const response = await authAPI.register(username, email, password);
      
      if (response.data.success) {
        console.log('✅ Registration successful');
        return response.data;
      } else {
        throw new Error(response.data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      console.log('📝 updateProfile called with:', profileData);
      
      const response = await authAPI.updateProfile(profileData);
      console.log('📡 API Response:', response);
      
      if (response.data.success) {
        const updatedUser = {
          ...user,
          ...response.data.data,
          access_token: user.access_token // Preserve token
        };
        
        console.log('🔄 Updated user object:', updatedUser);
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        console.log('✅ Profile updated successfully');
        return { success: true, data: updatedUser };
      } else {
        console.log('❌ API returned failure:', response.data.error);
        throw new Error(response.data.error || 'Profile update failed');
      }
      
    } catch (error) {
      console.error('❌ Profile update error details:', error);
      
      if (error.response) {
        throw new Error(error.response.data.error || 'Profile update failed');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error(error.message || 'Failed to update profile. Please try again.');
      }
    }
  };

  const updatePreferences = async (preferences) => {
    try {
      console.log('⚙️ Updating preferences...', preferences);
      
      const response = await authAPI.updatePreferences({ preferences });
      console.log('📡 Preferences API Response:', response);
      
      if (response.data.success) {
        const updatedUser = {
          ...user,
          preferences: response.data.data
        };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Apply theme immediately if changed
        if (preferences.theme) {
          localStorage.setItem('app-theme', preferences.theme);
          document.documentElement.setAttribute('data-theme', preferences.theme);
          document.body.className = `${preferences.theme}-theme`;
        }
        
        console.log('✅ Preferences updated successfully');
        return { success: true, data: updatedUser };
      } else {
        throw new Error(response.data.error || 'Preferences update failed');
      }
      
    } catch (error) {
      console.error('❌ Preferences update error:', error);
      
      if (error.response) {
        throw new Error(error.response.data.error || 'Preferences update failed');
      } else if (error.request) {
        throw new Error('Network error. Please check your connection.');
      } else {
        throw new Error(error.message || 'Failed to update preferences. Please try again.');
      }
    }
  };

  const getUserPreferences = () => {
    const defaultPreferences = {
      emailNotifications: true,
      priceAlerts: true,
      analysisReports: false,
      newsletter: false,
      theme: 'light',
      defaultTimeframe: '1D',
      alertThreshold: 5,
      autoRefresh: true,
      refreshInterval: 30
    };
    
    return {
      ...defaultPreferences,
      ...user?.preferences
    };
  };

  const refreshUserData = async () => {
    try {
      if (user) {
        const response = await authAPI.getProfile();
        if (response.data.success) {
          const updatedUser = {
            ...user,
            ...response.data.data,
            access_token: user.access_token
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      updateProfile,
      updatePreferences,
      getUserPreferences,
      refreshUserData,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
import API from './axios';

export const watchlistAPI = {
  getWatchlist: () => API.get('/watchlist'),
  addToWatchlist: (symbol, name) => API.post('/watchlist', { symbol, name }),
  removeFromWatchlist: (symbol) => API.delete(`/watchlist/${symbol}`),
  checkWatchlist: (symbol) => API.get(`/watchlist/${symbol}/check`),
};

export const notificationAPI = {
  getNotifications: (unreadOnly = false) => 
    API.get(`/notifications?unread_only=${unreadOnly}`),
  markAsRead: (notificationId) => 
    API.put(`/notifications/${notificationId}/read`),
  getUnreadCount: () => API.get('/notifications/unread/count'),
  createAlert: (symbol, targetPrice, alertType = 'above') => 
    API.post('/alerts', { symbol, target_price: targetPrice, alert_type: alertType }),
  getAlerts: () => API.get('/alerts'),
};

export const authAPI = {
  login: (email, password) => API.post('/auth/login', { email, password }),
  register: (username, email, password) => 
    API.post('/auth/register', { username, email, password }),
  updateProfile: (profileData) => 
    API.put('/user/profile', profileData),
  updatePreferences: (preferences) => 
    API.put('/user/preferences', { preferences }),
  getProfile: () => API.get('/user/profile'),
  getPreferences: () => API.get('/user/preferences'),
};

// Stock data API functions
export const stockAPI = {
  getStock: (symbol) => API.get(`/stock/${symbol}`),
  getMultipleStocks: (symbols) => API.get(`/stocks?symbols=${symbols}`),
  getHistoricalData: (symbol, period = '1mo') => 
    API.get(`/stocks/${symbol}/history?period=${period}`),
  searchStocks: (query) => API.get(`/stocks/search?q=${query}`),
  getStockAnalysis: (symbol) => API.get(`/stocks/${symbol}/analysis`),
};

// Portfolio API functions
export const portfolioAPI = {
  getPortfolio: () => API.get('/portfolio'),
  addHolding: (holdingData) => API.post('/portfolio/holdings', holdingData),
  updateHolding: (holdingId, updates) => API.put(`/portfolio/holdings/${holdingId}`, updates),
  removeHolding: (holdingId) => API.delete(`/portfolio/holdings/${holdingId}`),
  getPortfolioPerformance: () => API.get('/portfolio/performance'),
};

export default API;
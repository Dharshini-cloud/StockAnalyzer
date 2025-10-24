import API from './axios';

export const portfolioAPI = {
  getPortfolio: () => API.get('/portfolio'),
  getPortfolioPerformance: () => API.get('/portfolio/performance'),
  addHolding: (data) => API.post('/portfolio/holdings', data),
  updateHolding: (holdingId, data) => API.put(`/portfolio/holdings/${holdingId}`, data),
  removeHolding: (holdingId) => API.delete(`/portfolio/holdings/${holdingId}`)
};

export default portfolioAPI;
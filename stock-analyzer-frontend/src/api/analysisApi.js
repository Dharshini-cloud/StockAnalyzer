import API from './axios';

export const analysisAPI = {
  analyzeStock: (symbol) => API.get(`/analyze/${symbol}`),
  analyzeMultipleStocks: (symbols) => API.get(`/analyze/bulk?symbols=${symbols}`),
  analyzeStockAdvanced: (symbol) => API.get(`/analyze/advanced/${symbol}`),
};

export default analysisAPI;
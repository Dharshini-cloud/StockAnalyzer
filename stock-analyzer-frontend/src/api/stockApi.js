import API from './axios';

export const stockAPI = {
  getStock: (symbol) => API.get(`/stock/${symbol}`),
  getMultipleStocks: (symbols) => API.get(`/stocks?symbols=${symbols}`),
  getStockHistory: (symbol, period = '3mo') => 
    API.get(`/stock/${symbol}/history?period=${period}`),
};

export default API;
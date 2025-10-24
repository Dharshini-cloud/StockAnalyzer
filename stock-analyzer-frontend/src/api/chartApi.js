import API from './axios';

export const chartAPI = {
  getDetailedHistory: (symbol, period = '6mo') => 
    API.get(`/stock/${symbol}/history/detailed?period=${period}`),
  
  getOHLCHistory: (symbol, period = '3mo') => 
    API.get(`/stock/${symbol}/history/ohlc?period=${period}`),
  
  getPriceHistory: (symbol, period = '6mo') => 
    API.get(`/stock/${symbol}/history?period=${period}`)
};

export default chartAPI;
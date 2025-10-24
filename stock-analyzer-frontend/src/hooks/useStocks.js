import { useState, useCallback } from 'react';
import { stockAPI } from '../api/stockApi';
import { toast } from 'react-toastify';

export const useStocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStocks = useCallback(async (symbols = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NFLX', 'NVDA']) => {
    try {
      setLoading(true);
      const response = await stockAPI.getMultipleStocks(symbols.join(','));
      
      if (response.data.success) {
        setStocks(response.data.data);
        setLastUpdated(new Date());
      } else {
        toast.error('Failed to fetch stocks');
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast.error('Error loading stock data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStocks = useCallback(async () => {
    if (stocks.length > 0) {
      const symbols = stocks.map(stock => stock.symbol);
      await fetchStocks(symbols);
    } else {
      await fetchStocks();
    }
  }, [stocks, fetchStocks]);

  const updateStockPrice = useCallback((symbol, newPrice) => {
    setStocks(prevStocks => 
      prevStocks.map(stock => 
        stock.symbol === symbol 
          ? { ...stock, price: newPrice, last_updated: new Date().toISOString() }
          : stock
      )
    );
  }, []);

  return {
    stocks,
    loading,
    lastUpdated,
    fetchStocks,
    refreshStocks,
    updateStockPrice
  };
};
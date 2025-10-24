import React, { useEffect, useRef } from 'react';
import { stockAPI } from '../api/stockApi';

const RealTimeUpdater = ({ stocks, onStockUpdate, interval = 30000 }) => {
  const intervalRef = useRef(null);
  const isMounted = useRef(true);
  const previousStocksRef = useRef([]);

  useEffect(() => {
    isMounted.current = true;
    
    const updatePrices = async () => {
      if (!isMounted.current) return;
      
      try {
        // Update only stocks that are real-time and actually changed
        const realTimeStocks = stocks.filter(stock => 
          stock.is_real_time && !stock.is_loading
        );
        
        // Skip if no real-time stocks or stocks haven't changed
        if (realTimeStocks.length === 0) return;
        
        for (const stock of realTimeStocks) {
          if (!isMounted.current) break;
          
          try {
            const response = await stockAPI.getStock(stock.symbol);
            if (isMounted.current && response.data.success) {
              const newPrice = response.data.data.price;
              // Only update if price actually changed
              if (newPrice !== stock.price) {
                onStockUpdate(stock.symbol, newPrice);
              }
            }
          } catch (error) {
            console.error(`Error updating ${stock.symbol}:`, error);
          }
          
          // Small delay between requests to avoid rate limiting
          if (isMounted.current) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.error('Error in real-time update:', error);
      }
    };

    // Initial update after a delay
    const initialTimer = setTimeout(() => {
      if (isMounted.current) {
        updatePrices();
      }
    }, 5000);

    // Set up interval for updates only if we have real-time stocks
    if (stocks.some(stock => stock.is_real_time)) {
      intervalRef.current = setInterval(updatePrices, interval);
    }

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      clearTimeout(initialTimer);
    };
  }, [stocks, onStockUpdate, interval]); // Proper dependencies

  return null; // This component doesn't render anything
};

export default RealTimeUpdater;
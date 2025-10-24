import React, { useState, useEffect, useRef } from 'react';
import { watchlistAPI } from '../api/watchlistApi';
import { toast } from 'react-toastify';

const StockCard = ({ stock, onSelect, onAnalyze, showWatchlistButton = true }) => {
  const [priceAnimation, setPriceAnimation] = useState('');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const isPositive = stock.change >= 0;
  const prevPriceRef = useRef(stock.price);
  
  // Check if stock is in watchlist
  useEffect(() => {
    if (showWatchlistButton) {
      checkWatchlistStatus();
    }
  }, [stock.symbol, showWatchlistButton]);

  const checkWatchlistStatus = async () => {
    try {
      const response = await watchlistAPI.checkWatchlist(stock.symbol);
      if (response.data.success) {
        setInWatchlist(response.data.in_watchlist);
      }
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  // Price animation effect
  useEffect(() => {
    // Only trigger animation if price actually changed and we have a valid price
    if (stock.price && stock.price !== prevPriceRef.current) {
      const animationClass = isPositive ? 'price-update' : 'price-update negative';
      setPriceAnimation(animationClass);
      
      const timer = setTimeout(() => setPriceAnimation(''), 1000);
      prevPriceRef.current = stock.price;
      
      return () => clearTimeout(timer);
    }
  }, [stock.price, isPositive]);

  const toggleWatchlist = async (e) => {
    e.stopPropagation(); // Prevent card click
    setWatchlistLoading(true);
    
    try {
      if (inWatchlist) {
        const response = await watchlistAPI.removeFromWatchlist(stock.symbol);
        if (response.data.success) {
          setInWatchlist(false);
          toast.success('Removed from watchlist');
        }
      } else {
        const response = await watchlistAPI.addToWatchlist(stock.symbol, stock.name);
        if (response.data.success) {
          setInWatchlist(true);
          toast.success('Added to watchlist');
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      toast.error('Failed to update watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleAnalysisClick = (e) => {
    e.stopPropagation(); // Prevent card click
    if (onAnalyze) {
      onAnalyze(stock);
    }
  };

  const formatMarketCap = (marketCap) => {
    if (!marketCap || marketCap === 0) return 'N/A';
    
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`;
    return `$${marketCap}`;
  };

  const formatVolume = (volume) => {
    if (!volume || volume === 0) return 'N/A';
    
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toLocaleString();
  };

  const handleCardClick = () => {
    if (onSelect && !stock.is_loading) {
      onSelect(stock);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 relative ${
        isPositive ? 'border-green-500' : 'border-red-500'
      } ${stock.is_loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
      onClick={handleCardClick}
    >
      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex space-x-1">
        {/* Analysis Button */}
        <button
          onClick={handleAnalysisClick}
          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors shadow-md"
          title="Technical Analysis"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>

        {/* Watchlist Button */}
        {showWatchlistButton && (
          <button
            onClick={toggleWatchlist}
            disabled={watchlistLoading}
            className={`p-2 rounded-full transition-colors ${
              inWatchlist 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            } ${watchlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {watchlistLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill={inWatchlist ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate">{stock.symbol}</h3>
          <p className="text-sm text-gray-600 truncate">
            {stock.name}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-1 ml-2">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
            {stock.exchange || 'N/A'}
          </span>
          <div className="flex space-x-1">
            {!stock.is_real_time && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded whitespace-nowrap">
                Delayed
              </span>
            )}
            {stock.is_loading && (
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded whitespace-nowrap">
                Loading...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className={`text-2xl font-bold text-gray-900 ${priceAnimation}`}>
            ${stock.price ? stock.price.toFixed(2) : 'N/A'}
          </span>
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span className="font-semibold">
              {isPositive && stock.change > 0 ? '+' : ''}{stock.change ? stock.change.toFixed(2) : '0.00'}
            </span>
            <span className="ml-1 text-sm">
              ({isPositive && stock.change_percent > 0 ? '+' : ''}{stock.change_percent ? stock.change_percent.toFixed(2) : '0.00'}%)
            </span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          Prev Close: ${stock.previous_close ? stock.previous_close.toFixed(2) : 'N/A'}
        </p>
      </div>

      {/* Stock Details */}
      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
        <div>
          <span className="font-medium text-xs uppercase tracking-wide">Day Range</span>
          <p className="text-xs mt-1">
            ${stock.day_low ? stock.day_low.toFixed(2) : 'N/A'} - ${stock.day_high ? stock.day_high.toFixed(2) : 'N/A'}
          </p>
        </div>
        <div>
          <span className="font-medium text-xs uppercase tracking-wide">Volume</span>
          <p className="text-xs mt-1">{formatVolume(stock.volume)}</p>
        </div>
        <div className="col-span-2">
          <span className="font-medium text-xs uppercase tracking-wide">Market Cap</span>
          <p className="text-xs mt-1">{formatMarketCap(stock.market_cap)}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center">
        <div className="flex-1">
          {stock.sector && stock.sector !== 'N/A' && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded truncate max-w-[120px] inline-block">
              {stock.sector}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
          {stock.last_updated ? new Date(stock.last_updated).toLocaleTimeString() : 'Just now'}
        </span>
      </div>
    </div>
  );
};

export default StockCard;
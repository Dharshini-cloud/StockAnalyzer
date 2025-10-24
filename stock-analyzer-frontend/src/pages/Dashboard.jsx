import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { stockAPI } from '../api/stockApi';
import { watchlistAPI } from '../api/watchlistApi';
import StockCard from '../components/StockCard';
import StockAnalysis from '../components/StockAnalysis';
import Loader from '../components/Loader';
import RealTimeUpdater from '../components/RealTimeUpdater';
import { useStocks } from '../hooks/useStocks';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [analysisStock, setAnalysisStock] = useState(null);
  
  const {
    stocks,
    loading,
    lastUpdated,
    fetchStocks,
    refreshStocks,
    updateStockPrice
  } = useStocks();

  // Check if selected stock is in watchlist
  useEffect(() => {
    if (selectedStock) {
      checkWatchlistStatus(selectedStock.symbol);
    }
  }, [selectedStock]);

  const checkWatchlistStatus = async (symbol) => {
    try {
      const response = await watchlistAPI.checkWatchlist(symbol);
      if (response.data.success) {
        setIsInWatchlist(response.data.in_watchlist);
      }
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const handleAnalysisRequest = (stock) => {
    setAnalysisStock(stock);
  };

  const handleCloseAnalysis = () => {
    setAnalysisStock(null);
  };

  const handleAddToWatchlist = async (stock) => {
    try {
      const response = await watchlistAPI.addToWatchlist(stock.symbol, stock.name);
      if (response.data.success) {
        toast.success(`${stock.symbol} added to watchlist!`);
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to add to watchlist');
      } else {
        toast.error('Failed to add to watchlist');
      }
    }
  };

  const handleRemoveFromWatchlist = async (symbol) => {
    try {
      const response = await watchlistAPI.removeFromWatchlist(symbol);
      if (response.data.success) {
        toast.success(`${symbol} removed from watchlist!`);
        setIsInWatchlist(false);
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchSymbol.trim()) return;

    try {
      setSearchLoading(true);
      const response = await stockAPI.getStock(searchSymbol.toUpperCase());
      
      if (response.data.success) {
        setSelectedStock(response.data.data);
        toast.success(`Found ${response.data.data.symbol}`);
      } else {
        toast.error(`Stock ${searchSymbol} not found`);
      }
    } catch (error) {
      console.error('Error searching stock:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to search stocks');
      } else if (error.response?.status === 404) {
        toast.error(`Stock ${searchSymbol} not found`);
      } else {
        toast.error('Error searching for stock');
      }
    } finally {
      setSearchLoading(false);
      setSearchSymbol('');
    }
  };

  const handleRefresh = useCallback(async () => {
    try {
      await refreshStocks();
      toast.success('Stocks updated successfully');
    } catch (error) {
      console.error('Error refreshing stocks:', error);
      toast.error('Failed to refresh stocks');
    }
  }, [refreshStocks]);

  const handleIndianStocks = useCallback(async () => {
    try {
      await fetchStocks(['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS']);
      toast.success('Indian stocks loaded');
    } catch (error) {
      console.error('Error loading Indian stocks:', error);
      toast.error('Failed to load Indian stocks');
    }
  }, [fetchStocks]);

  // Auto-refresh toggle effect
  useEffect(() => {
    let intervalId;
    
    if (autoRefresh && stocks.length > 0) {
      intervalId = setInterval(handleRefresh, 60000); // Refresh every minute
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, handleRefresh, stocks.length]);

  // Load default stocks on component mount
  useEffect(() => {
    if (user && stocks.length === 0) {
      fetchStocks();
    }
  }, [user, fetchStocks, stocks.length]);

  if (loading && stocks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4">
          <Loader size="large" text="Loading market data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Real-time Updater Component */}
      {autoRefresh && stocks.length > 0 && (
        <RealTimeUpdater 
          stocks={stocks} 
          onStockUpdate={updateStockPrice}
          interval={30000} // 30 seconds
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.username || 'User'}!
              </h1>
              <p className="text-gray-600">
                Real-time stock market data and analysis
              </p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="mr-2 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="auto-refresh" className="text-sm text-gray-600">
                  Auto-refresh
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
            <input
              type="text"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              placeholder="Search stock symbol (e.g., AAPL, TSLA, RELIANCE.NS...)"
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Refreshing...' : 'Refresh Now'}
            </button>
            <button
              type="button"
              onClick={handleIndianStocks}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Indian Stocks
            </button>
          </form>
        </div>

        {/* Selected Stock Detail */}
        {selectedStock && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-purple-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedStock.symbol} - {selectedStock.name}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {selectedStock.exchange} • {selectedStock.sector}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {isInWatchlist ? (
                  <button
                    onClick={() => handleRemoveFromWatchlist(selectedStock.symbol)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    Remove from Watchlist
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddToWatchlist(selectedStock)}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                  >
                    Add to Watchlist
                  </button>
                )}
                <button
                  onClick={() => setSelectedStock(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl p-1"
                >
                  ✕
                </button>
              </div>
            </div>
            <StockCard stock={selectedStock} onSelect={() => {}} onAnalyze={handleAnalysisRequest} />
          </div>
        )}

        {/* Market Overview Header */}
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Market Overview</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Real-time</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Delayed</span>
            </div>
            <span className="text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        {/* Stocks Grid */}
        {stocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {stocks.map((stock) => (
              <StockCard 
                key={stock.symbol} 
                stock={stock} 
                onSelect={setSelectedStock}
                onAnalyze={handleAnalysisRequest}
                showWatchlistButton={true}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📈</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No stocks to display
            </h3>
            <p className="text-gray-500 mb-4">
              Use the search bar above to find stocks or load Indian stocks
            </p>
            <button
              onClick={handleIndianStocks}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Load Sample Stocks
            </button>
          </div>
        )}

        {/* Data Status */}
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <p className="text-gray-600">
            {stocks.some(stock => !stock.is_real_time) 
              ? 'Some data may be delayed. Real-time data updates every 30 seconds.'
              : 'All data is real-time. Auto-updating every 30 seconds.'
            }
          </p>
        </div>
      </div>

      {/* Analysis Modal - Add this at the bottom */}
      {analysisStock && (
        <StockAnalysis 
          symbol={analysisStock.symbol} 
          onClose={handleCloseAnalysis} 
        />
      )}
    </div>
  );
};

export default Dashboard;
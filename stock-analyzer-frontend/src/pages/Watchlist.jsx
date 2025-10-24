import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { watchlistAPI, notificationAPI } from '../api/watchlistApi';
import { stockAPI } from '../api/stockApi';
import StockCard from '../components/StockCard';
import Loader from '../components/Loader';
import { toast } from 'react-toastify';

const Watchlist = () => {
  const { user } = useContext(AuthContext);
  const [watchlist, setWatchlist] = useState([]);
  const [stocksData, setStocksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [alertModal, setAlertModal] = useState({ open: false, stock: null });
  const [technicalModal, setTechnicalModal] = useState({ open: false, stock: null });
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'horizontal'
  const [expandedStock, setExpandedStock] = useState(null); // For horizontal view expanded state

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await watchlistAPI.getWatchlist();
      
      if (response.data.success) {
        const stocks = response.data.data;
        setWatchlist(stocks);
        
        // Fetch current data for watchlist stocks
        if (stocks.length > 0) {
          const symbols = stocks.map(stock => stock.symbol).join(',');
          const stockResponse = await stockAPI.getMultipleStocks(symbols);
          
          if (stockResponse.data.success) {
            setStocksData(stockResponse.data.data);
          } else {
            toast.error('Failed to load stock data');
          }
        } else {
          setStocksData([]);
        }
      } else {
        toast.error(response.data.message || 'Failed to load watchlist');
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to view your watchlist');
      } else if (error.response?.status === 404) {
        // Watchlist not found is normal for new users
        setWatchlist([]);
        setStocksData([]);
      } else {
        toast.error('Failed to load watchlist');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshWatchlist = async () => {
    try {
      setRefreshing(true);
      await fetchWatchlist();
      toast.success('Watchlist updated');
    } catch (error) {
      console.error('Error refreshing watchlist:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const removeFromWatchlist = async (symbol) => {
    try {
      const response = await watchlistAPI.removeFromWatchlist(symbol);
      if (response.data.success) {
        toast.success(`${symbol} removed from watchlist`);
        setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
        setStocksData(prev => prev.filter(stock => stock.symbol !== symbol));
        // Also close expanded view if it's the same stock
        if (expandedStock?.symbol === symbol) {
          setExpandedStock(null);
        }
      } else {
        toast.error(response.data.message || 'Failed to remove stock');
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to modify watchlist');
      } else {
        toast.error('Failed to remove stock from watchlist');
      }
    }
  };

  const createPriceAlert = async (symbol, targetPrice, alertType) => {
    try {
      const response = await notificationAPI.createAlert(symbol, targetPrice, alertType);
      if (response.data.success) {
        toast.success(`Price alert created for ${symbol}!`);
        setAlertModal({ open: false, stock: null });
      } else {
        toast.error(response.data.message || 'Failed to create alert');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to create alerts');
      } else {
        toast.error('Failed to create price alert');
      }
    }
  };

  const openTechnicalAnalysis = (stock) => {
    setTechnicalModal({ open: true, stock });
  };

  const toggleStockExpansion = (stock) => {
    if (expandedStock?.symbol === stock.symbol) {
      setExpandedStock(null);
    } else {
      setExpandedStock(stock);
    }
  };

  const AlertModal = () => {
    const [targetPrice, setTargetPrice] = useState('');
    const [alertType, setAlertType] = useState('above');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!targetPrice || isNaN(targetPrice)) {
        toast.error('Please enter a valid price');
        return;
      }
      createPriceAlert(alertModal.stock.symbol, parseFloat(targetPrice), alertType);
    };

    if (!alertModal.open) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h3 className="text-xl font-bold mb-4">Create Price Alert</h3>
          <p className="text-gray-600 mb-4">
            Set an alert for {alertModal.stock.name} ({alertModal.stock.symbol})
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Alert when price is:</label>
              <select 
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Target Price ($):</label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter target price"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setAlertModal({ open: false, stock: null })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Alert
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const TechnicalAnalysisModal = () => {
    if (!technicalModal.open) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-2xl font-bold">Technical Analysis - {technicalModal.stock.symbol}</h3>
            <button
              onClick={() => setTechnicalModal({ open: false, stock: null })}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Technical Indicators */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold border-b pb-2">Key Indicators</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">RSI (14)</div>
                  <div className="text-lg font-bold">52.3</div>
                  <div className="text-xs text-green-600">Neutral</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">MACD</div>
                  <div className="text-lg font-bold">1.23</div>
                  <div className="text-xs text-green-600">Bullish</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">50-Day MA</div>
                  <div className="text-lg font-bold">${(technicalModal.stock.price * 0.95).toFixed(2)}</div>
                  <div className="text-xs text-green-600">Above</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">200-Day MA</div>
                  <div className="text-lg font-bold">${(technicalModal.stock.price * 0.85).toFixed(2)}</div>
                  <div className="text-xs text-green-600">Above</div>
                </div>
              </div>
            </div>

            {/* Support & Resistance */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold border-b pb-2">Support & Resistance</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-red-600 font-medium">Resistance 1</span>
                  <span>${(technicalModal.stock.price * 1.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600 font-medium">Resistance 2</span>
                  <span>${(technicalModal.stock.price * 1.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-600 font-medium">Support 1</span>
                  <span>${(technicalModal.stock.price * 0.95).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-600 font-medium">Support 2</span>
                  <span>${(technicalModal.stock.price * 0.9).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Trading Signals */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="text-lg font-semibold border-b pb-2">Trading Signals</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="font-semibold text-green-800">Overall Signal</div>
                  <div className="text-2xl font-bold text-green-600 mt-2">BUY</div>
                  <div className="text-sm text-green-600 mt-1">Strong Bullish Trend</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="font-semibold text-blue-800">Volatility</div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">MEDIUM</div>
                  <div className="text-sm text-blue-600 mt-1">Normal Market Conditions</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <div className="font-semibold text-orange-800">Risk Level</div>
                  <div className="text-2xl font-bold text-orange-600 mt-2">LOW</div>
                  <div className="text-sm text-orange-600 mt-1">Stable Performance</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setTechnicalModal({ open: false, stock: null })}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4">
          <Loader size="large" text="Loading your watchlist..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Watchlist
              </h1>
              <p className="text-gray-600">
                Track your favorite stocks and set price alerts
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex bg-white rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="Grid View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('horizontal')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'horizontal' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="Horizontal View"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <button
                onClick={refreshWatchlist}
                disabled={refreshing}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Watchlist Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{watchlist.length}</div>
              <div className="text-gray-600">Total Stocks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stocksData.filter(stock => stock.change >= 0).length}
              </div>
              <div className="text-gray-600">Stocks Up</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stocksData.filter(stock => stock.change < 0).length}
              </div>
              <div className="text-gray-600">Stocks Down</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${stocksData.reduce((total, stock) => total + (stock.price || 0), 0).toFixed(2)}
              </div>
              <div className="text-gray-600">Total Value</div>
            </div>
          </div>
        </div>

        {/* Watchlist Stocks */}
        {watchlist.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Your watchlist is empty
            </h3>
            <p className="text-gray-500 mb-4">
              Add stocks to your watchlist from the Dashboard to track them here
            </p>
            <a 
              href="/"
              className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Browse Stocks
            </a>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {stocksData.map((stock) => (
                  <div key={stock.symbol} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <StockCard 
                      stock={stock} 
                      onSelect={setSelectedStock}
                      showWatchlistButton={false}
                    />
                    
                    {/* Action Buttons at Bottom */}
                    <div className="border-t border-gray-200 p-3 bg-gray-50">
                      <div className="flex justify-between space-x-2">
                        <button
                          onClick={() => setAlertModal({ open: true, stock })}
                          className="flex-1 bg-yellow-500 text-white py-2 px-3 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-1 text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.93 4.93l9.07 9.07-9.07 9.07L4.93 4.93z" />
                          </svg>
                          <span>Alert</span>
                        </button>
                        <button
                          onClick={() => openTechnicalAnalysis(stock)}
                          className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1 text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>Analysis</span>
                        </button>
                        <button
                          onClick={() => removeFromWatchlist(stock.symbol)}
                          className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-1 text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Horizontal View */}
            {viewMode === 'horizontal' && (
              <div className="space-y-4 mb-8">
                {stocksData.map((stock) => (
                  <div key={stock.symbol}>
                    {/* Compact Row View */}
                    <div 
                      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => toggleStockExpansion(stock)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {stock.symbol.substring(0, 3)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {stock.symbol}
                            </h3>
                            <p className="text-gray-600 text-sm truncate">{stock.name}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">
                              ${stock.price}
                            </div>
                            <div className={`text-sm font-medium ${
                              stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons for Horizontal View */}
                        <div className="flex items-center space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setAlertModal({ open: true, stock })}
                            className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-1 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.93 4.93l9.07 9.07-9.07 9.07L4.93 4.93z" />
                            </svg>
                            <span>Alert</span>
                          </button>
                          <button
                            onClick={() => openTechnicalAnalysis(stock)}
                            className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-1 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Analysis</span>
                          </button>
                          <button
                            onClick={() => removeFromWatchlist(stock.symbol)}
                            className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-1 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Detailed View */}
                    {expandedStock?.symbol === stock.symbol && (
                      <div className="bg-white rounded-lg shadow-lg mt-2 border-l-4 border-purple-500">
                        <div className="p-6">
                          {/* Header */}
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h2 className="text-2xl font-bold text-gray-900">
                                {stock.symbol} - {stock.name}
                              </h2>
                              <p className="text-gray-600">{stock.sector || 'Technology'}</p>
                            </div>
                            <button
                              onClick={() => setExpandedStock(null)}
                              className="text-gray-500 hover:text-gray-700 text-xl"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Price and Change */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <div className="text-3xl font-bold text-gray-900 mb-2">
                                ${stock.price}
                              </div>
                              <div className={`text-lg font-semibold ${
                                stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                              </div>
                              <div className="text-gray-600 text-sm mt-1">
                                Prev Close: ${(stock.price - stock.change).toFixed(2)}
                              </div>
                            </div>
                            
                            {/* Additional Details */}
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Day Range</span>
                                <span className="font-medium">
                                  ${(stock.price * 0.99).toFixed(2)} - ${(stock.price * 1.01).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Volume</span>
                                <span className="font-medium">
                                  {((stock.volume || 1000000) / 1000000).toFixed(2)}M
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Market Cap</span>
                                <span className="font-medium">
                                  ${((stock.price * (stock.shares || 1000000000)) / 1000000000).toFixed(2)}B
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Additional Action Buttons */}
                          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => setAlertModal({ open: true, stock })}
                              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.93 4.93l9.07 9.07-9.07 9.07L4.93 4.93z" />
                              </svg>
                              <span>Set Price Alert</span>
                            </button>
                            <button
                              onClick={() => openTechnicalAnalysis(stock)}
                              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span>Technical Analysis</span>
                            </button>
                            <button
                              onClick={() => removeFromWatchlist(stock.symbol)}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span>Remove from Watchlist</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Selected Stock Detail */}
        {selectedStock && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-purple-500">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedStock.symbol} - {selectedStock.name}
              </h2>
              <button
                onClick={() => setSelectedStock(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            <StockCard stock={selectedStock} onSelect={() => {}} />
          </div>
        )}

        {/* Alert Modal */}
        <AlertModal />

        {/* Technical Analysis Modal */}
        <TechnicalAnalysisModal />
      </div>
    </div>
  );
};

export default Watchlist;
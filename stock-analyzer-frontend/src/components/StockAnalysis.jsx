import React, { useState, useEffect } from 'react';
import { analysisAPI } from '../api/analysisApi';
import { chartAPI } from '../api/chartApi';
import PriceChart from './PriceChart';
import CandlestickChart from './CandlestickChart';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart
} from 'recharts';
import Loader from './Loader';
import { toast } from 'react-toastify';

const StockAnalysis = ({ symbol, onClose }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analysis');
  const [detailedHistory, setDetailedHistory] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  useEffect(() => {
    fetchAnalysis();
    fetchDetailedHistory();
  }, [symbol]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await analysisAPI.analyzeStock(symbol);
      
      if (response.data.success) {
        setAnalysis(response.data.data);
      } else {
        toast.error('Failed to analyze stock');
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast.error('Error analyzing stock');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedHistory = async () => {
    try {
      setChartLoading(true);
      const response = await chartAPI.getDetailedHistory(symbol, '3mo');
      
      if (response.data.success) {
        setDetailedHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching detailed history:', error);
    } finally {
      setChartLoading(false);
    }
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'STRONG BUY':
      case 'BUY':
        return 'text-green-600';
      case 'STRONG SELL':
      case 'SELL':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getConfidenceBadge = (confidence) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
      neutral: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[confidence]}`}>
        {confidence.toUpperCase()} CONFIDENCE
      </span>
    );
  };

  const getScoreColor = (score) => {
    if (score >= 5) return 'text-green-600';
    if (score >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const TechnicalIndicatorChart = () => {
    if (chartLoading || detailedHistory.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <Loader text="Loading technical data..." />
        </div>
      );
    }

    // Get last 30 days for better visualization
    const recentData = detailedHistory.slice(-30);

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={recentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'RSI') return [value.toFixed(1), name];
                if (name === 'MACD' || name === 'MACD Signal') return [value.toFixed(3), name];
                return [value, name];
              }}
              labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="rsi" 
              stroke="#ff7300" 
              strokeWidth={2}
              dot={false}
              name="RSI"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="macd" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={false}
              name="MACD"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="macd_signal" 
              stroke="#82ca9d" 
              strokeWidth={2}
              dot={false}
              name="MACD Signal"
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="rsi" 
              stroke="none" 
              fill="#ff7300" 
              fillOpacity={0.1}
              name="RSI Range"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const VolumeAnalysisChart = () => {
    if (chartLoading || detailedHistory.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center">
          <Loader text="Loading volume data..." />
        </div>
      );
    }

    const recentData = detailedHistory.slice(-30);

    return (
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value;
              }}
            />
            <Tooltip 
              formatter={(value) => [value.toLocaleString(), 'Volume']}
              labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            />
            <Bar 
              dataKey="volume" 
              fill="#8884d8" 
              fillOpacity={0.7}
              name="Volume"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader text="Analyzing stock..." />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Technical Analysis: {analysis.symbol}
              </h2>
              <p className="text-purple-100">
                Advanced technical indicators and interactive charts
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 text-xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 px-6 pt-4">
            {[
              { id: 'analysis', label: 'Analysis' },
              { id: 'price', label: 'Price Chart' },
              { id: 'candlestick', label: 'Candlestick' },
              { id: 'technical', label: 'Technical' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white border-t border-l border-r border-gray-300 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Recommendation Card */}
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-center md:text-left">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">RECOMMENDATION</h3>
                    <div className={`text-3xl font-bold ${getRecommendationColor(analysis.recommendation)}`}>
                      {analysis.recommendation}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">SCORE</h3>
                    <div className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
                      {analysis.score}/10
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">CONFIDENCE</h3>
                    {getConfidenceBadge(analysis.confidence)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Price Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Price:</span>
                      <span className="font-semibold">${analysis.current_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">1D Change:</span>
                      <span className={analysis.price_changes['1d'] >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {analysis.price_changes['1d'] >= 0 ? '+' : ''}{analysis.price_changes['1d']}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">1W Change:</span>
                      <span className={analysis.price_changes['1w'] >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {analysis.price_changes['1w'] >= 0 ? '+' : ''}{analysis.price_changes['1w']}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Indicators */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Technical Indicators</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">MA20:</span>
                      <span className="font-semibold">${analysis.indicators.ma20}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">MA50:</span>
                      <span className="font-semibold">${analysis.indicators.ma50}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RSI:</span>
                      <span className={`font-semibold ${
                        analysis.indicators.rsi < 30 ? 'text-green-600' : 
                        analysis.indicators.rsi > 70 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {analysis.indicators.rsi}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">MACD:</span>
                      <span className={`font-semibold ${
                        analysis.indicators.macd > analysis.indicators.macd_signal ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analysis.indicators.macd.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Trend</h3>
                  <PriceChart symbol={symbol} height={250} showVolume={false} />
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Volume Analysis</h3>
                  <VolumeAnalysisChart />
                </div>
              </div>

              {/* Technical Indicators Chart */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Technical Indicators</h3>
                <TechnicalIndicatorChart />
                <div className="mt-2 text-xs text-gray-500 text-center">
                  RSI (Orange) | MACD (Purple) | MACD Signal (Green)
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Reasoning</h3>
                <div className="space-y-2">
                  {analysis.reasoning.map((reason, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Price Chart Tab */}
          {activeTab === 'price' && (
            <div className="bg-white rounded-lg">
              <PriceChart symbol={symbol} height={500} showVolume={true} />
            </div>
          )}

          {/* Candlestick Chart Tab */}
          {activeTab === 'candlestick' && (
            <div className="bg-white rounded-lg">
              <CandlestickChart symbol={symbol} height={500} />
            </div>
          )}

          {/* Technical Indicators Tab */}
          {activeTab === 'technical' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">RSI & MACD Analysis</h3>
                <TechnicalIndicatorChart />
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">RSI Interpretation:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <span className="text-green-600">RSI &lt; 30</span>: Oversold (Potential Buy)</li>
                      <li>• <span className="text-yellow-600">RSI 30-70</span>: Neutral</li>
                      <li>• <span className="text-red-600">RSI &gt; 70</span>: Overbought (Potential Sell)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">MACD Interpretation:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <span className="text-green-600">MACD &gt; Signal</span>: Bullish</li>
                      <li>• <span className="text-red-600">MACD &lt; Signal</span>: Bearish</li>
                      <li>• Crossover indicates trend changes</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Volume Analysis</h3>
                <VolumeAnalysisChart />
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="mt-4 text-center text-gray-500 text-sm">
            Last updated: {new Date(analysis.last_updated).toLocaleString()}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={() => {
                fetchAnalysis();
                fetchDetailedHistory();
              }}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Refresh Analysis
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAnalysis;
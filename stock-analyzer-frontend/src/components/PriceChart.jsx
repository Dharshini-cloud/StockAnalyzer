import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { chartAPI } from '../api/chartApi';
import Loader from './Loader';
import { toast } from 'react-toastify';

const PriceChart = ({ symbol, height = 300, showVolume = true }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('3mo');
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    fetchChartData();
  }, [symbol, period]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await chartAPI.getPriceHistory(symbol, period);
      
      if (response.data.success) {
        setChartData(response.data.data);
      } else {
        toast.error('Failed to load chart data');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast.error('Error loading chart data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (period === '1mo') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (period === '3mo') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{formatDate(label)}</p>
          <p className="text-sm text-gray-600">
            Price: <span className="font-semibold">${payload[0].value?.toFixed(2)}</span>
          </p>
          {payload[1] && (
            <p className="text-sm text-gray-600">
              Volume: <span className="font-semibold">
                {payload[1].value?.toLocaleString()}
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Loader text="Loading chart..." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Chart Controls */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="flex space-x-2">
          {['1mo', '3mo', '6mo', '1y'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                period === p
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div className="flex space-x-2">
          {['line', 'area'].map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                chartType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Price Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#8884d8', strokeWidth: 2 }}
                name="Price"
              />
              {chartData[0]?.sma_20 && (
                <Line 
                  type="monotone" 
                  dataKey="sma_20" 
                  stroke="#ff7300" 
                  strokeWidth={1}
                  dot={false}
                  name="MA20"
                />
              )}
              {chartData[0]?.sma_50 && (
                <Line 
                  type="monotone" 
                  dataKey="sma_50" 
                  stroke="#00ff00" 
                  strokeWidth={1}
                  dot={false}
                  name="MA50"
                />
              )}
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke="#8884d8" 
                fill="#8884d8"
                fillOpacity={0.3}
                strokeWidth={2}
                name="Price"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      {showVolume && chartData.length > 0 && (
        <div style={{ height: 80 }} className="mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value;
                }}
              />
              <Tooltip />
              <Bar 
                dataKey="volume" 
                fill="#8884d8" 
                fillOpacity={0.6}
                name="Volume"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PriceChart;
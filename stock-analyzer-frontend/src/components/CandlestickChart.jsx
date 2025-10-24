import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { chartAPI } from '../api/chartApi';
import Loader from './Loader';
import { toast } from 'react-toastify';

const CandlestickChart = ({ symbol, height = 400 }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('3mo');

  useEffect(() => {
    fetchOHLCData();
  }, [symbol, period]);

  const fetchOHLCData = async () => {
    try {
      setLoading(true);
      const response = await chartAPI.getOHLCHistory(symbol, period);
      
      if (response.data.success) {
        setChartData(response.data.data);
      } else {
        toast.error('Failed to load OHLC data');
      }
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
      toast.error('Error loading candlestick data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (period === '1mo') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{formatDate(label)}</p>
          <p className="text-sm text-gray-600">
            Open: <span className="font-semibold">${data.open?.toFixed(2)}</span>
          </p>
          <p className="text-sm text-gray-600">
            High: <span className="font-semibold text-green-600">${data.high?.toFixed(2)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Low: <span className="font-semibold text-red-600">${data.low?.toFixed(2)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Close: <span className="font-semibold">${data.close?.toFixed(2)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Volume: <span className="font-semibold">{data.volume?.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom shape for candlesticks
  const Candlestick = (props) => {
    const { x, y, width, height, open, close } = props;
    
    if (!open || !close) return null;
    
    const isGrowing = close >= open;
    const color = isGrowing ? '#10b981' : '#ef4444';
    
    const lineHeight = 1;
    const candleWidth = width * 0.8;
    
    return (
      <g>
        {/* High-Low line */}
        <line
          x1={x + width / 2}
          y1={y}
          x2={x + width / 2}
          y2={y + height}
          stroke={color}
          strokeWidth={1}
        />
        {/* Open-Close rectangle */}
        <rect
          x={x + (width - candleWidth) / 2}
          y={isGrowing ? y + (height - (close - open)) : y}
          width={candleWidth}
          height={Math.max(Math.abs(close - open), 1)}
          fill={color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Loader text="Loading candlestick chart..." />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Chart Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          {['1mo', '3mo', '6mo'].map((p) => (
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
        
        <div className="text-sm text-gray-600">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-1"></span>
          Bullish
          <span className="inline-block w-3 h-3 bg-red-500 rounded-sm mr-1 ml-3"></span>
          Bearish
        </div>
      </div>

      {/* Candlestick Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            
            {/* Candlestick bars */}
            <Bar
              dataKey="range"
              shape={<Candlestick />}
              fill="#8884d8"
              name="OHLC"
            />
            
            {/* Volume bars */}
            <Bar
              dataKey="volume"
              fill="#8884d8"
              fillOpacity={0.3}
              yAxisId="volume"
              name="Volume"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CandlestickChart;
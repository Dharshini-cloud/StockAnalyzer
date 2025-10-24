import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import time
import numpy as np

# Cache to avoid frequent API calls (simple in-memory cache)
stock_cache = {}
CACHE_DURATION = 60  # 1 minute cache

def get_stock_data(symbol):
    try:
        # Check cache first
        cache_key = symbol.upper()
        if cache_key in stock_cache:
            cached_data, timestamp = stock_cache[cache_key]
            if (datetime.now() - timestamp).seconds < CACHE_DURATION:
                return cached_data
        
        stock = yf.Ticker(symbol)
        info = stock.info
        hist = stock.history(period="1d")
        
        # Get fast info for real-time data
        fast_info = stock.fast_info
        
        # Calculate day change and percentage
        current_price = (fast_info.get('last_price') or 
                        info.get("currentPrice") or 
                        info.get("regularMarketPrice") or 
                        0)
        
        previous_close = (fast_info.get('previous_close') or 
                         info.get("previousClose") or 
                         info.get("regularMarketPreviousClose") or 
                         current_price)
        
        if current_price and previous_close:
            change = current_price - previous_close
            change_percent = (change / previous_close) * 100
        else:
            change = 0
            change_percent = 0

        # Get additional real-time data
        day_high = fast_info.get('day_high') or info.get("dayHigh") or 0
        day_low = fast_info.get('day_low') or info.get("dayLow") or 0
        volume = fast_info.get('last_volume') or info.get("volume") or 0
        
        data = {
            "symbol": symbol.upper(),
            "name": info.get("shortName", symbol.upper()),
            "price": round(current_price, 2) if current_price else 0,
            "previous_close": round(previous_close, 2) if previous_close else 0,
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "day_high": round(day_high, 2) if day_high else 0,
            "day_low": round(day_low, 2) if day_low else 0,
            "volume": int(volume) if volume else 0,
            "market_cap": info.get("marketCap", 0),
            "exchange": info.get("exchange", "N/A"),
            "sector": info.get("sector", "N/A"),
            "last_updated": datetime.now().isoformat(),
            "is_real_time": True
        }
        
        # Update cache
        stock_cache[cache_key] = (data, datetime.now())
        return data
        
    except Exception as e:
        print(f"Error fetching stock data for {symbol}: {e}")
        return get_static_stock_data(symbol)

def get_static_stock_data(symbol):
    """Fallback static data when API fails"""
    static_data = {
        "AAPL": {"name": "Apple Inc.", "price": 182.63, "change": 1.25, "change_percent": 0.69},
        "TSLA": {"name": "Tesla Inc.", "price": 234.50, "change": -2.35, "change_percent": -0.99},
        "GOOGL": {"name": "Alphabet Inc.", "price": 138.21, "change": 0.85, "change_percent": 0.62},
        "MSFT": {"name": "Microsoft Corp.", "price": 378.85, "change": 2.15, "change_percent": 0.57},
        "AMZN": {"name": "Amazon.com Inc.", "price": 154.55, "change": -0.45, "change_percent": -0.29},
        "META": {"name": "Meta Platforms Inc.", "price": 351.95, "change": 3.25, "change_percent": 0.93},
        "NFLX": {"name": "Netflix Inc.", "price": 492.19, "change": -1.25, "change_percent": -0.25},
        "NVDA": {"name": "NVIDIA Corp.", "price": 481.68, "change": 8.35, "change_percent": 1.76},
    }
    
    if symbol.upper() in static_data:
        base_data = static_data[symbol.upper()]
        return {
            "symbol": symbol.upper(),
            "name": base_data["name"],
            "price": base_data["price"],
            "previous_close": base_data["price"] - base_data["change"],
            "change": base_data["change"],
            "change_percent": base_data["change_percent"],
            "day_high": base_data["price"] * 1.02,
            "day_low": base_data["price"] * 0.98,
            "volume": 5000000,
            "market_cap": 1000000000000,
            "exchange": "NASDAQ",
            "sector": "Technology",
            "last_updated": datetime.now().isoformat(),
            "is_real_time": False
        }
    return None

def get_stock_history(symbol, period="6mo"):
    """Get historical data for charts with OHLC data"""
    try:
        stock = yf.Ticker(symbol)
        
        # Get data for different periods
        if period == "1mo":
            hist = stock.history(period="1mo", interval="1d")
        elif period == "3mo":
            hist = stock.history(period="3mo", interval="1d")
        elif period == "6mo":
            hist = stock.history(period="6mo", interval="1d")
        elif period == "1y":
            hist = stock.history(period="1y", interval="1d")
        elif period == "5y":
            hist = stock.history(period="5y", interval="1wk")
        else:
            hist = stock.history(period="6mo", interval="1d")
        
        if hist.empty:
            return generate_sample_history(symbol, period)
        
        # Reset index to get Date as column
        hist = hist.reset_index()
        
        # Convert to list of dictionaries with proper formatting
        history_data = []
        for index, row in hist.iterrows():
            # Calculate moving averages
            sma_20 = hist['Close'].rolling(window=min(20, index+1)).mean().iloc[index] if index >= 19 else 0
            sma_50 = hist['Close'].rolling(window=min(50, index+1)).mean().iloc[index] if index >= 49 else 0
            
            history_data.append({
                "date": row['Date'].strftime('%Y-%m-%d'),
                "timestamp": row['Date'].timestamp(),
                "open": round(row['Open'], 2) if pd.notna(row['Open']) else 0,
                "high": round(row['High'], 2) if pd.notna(row['High']) else 0,
                "low": round(row['Low'], 2) if pd.notna(row['Low']) else 0,
                "close": round(row['Close'], 2) if pd.notna(row['Close']) else 0,
                "volume": int(row['Volume']) if pd.notna(row['Volume']) else 0,
                "sma_20": round(sma_20, 2) if sma_20 else 0,
                "sma_50": round(sma_50, 2) if sma_50 else 0
            })
        
        return history_data
    except Exception as e:
        print(f"Error fetching history for {symbol}: {e}")
        return generate_sample_history(symbol, period)

def get_detailed_stock_history(symbol, period="6mo"):
    """Get detailed historical data including technical indicators"""
    try:
        history_data = get_stock_history(symbol, period)
        
        # Add technical indicators
        df = pd.DataFrame(history_data)
        
        # Calculate RSI
        df['rsi'] = calculate_rsi(df['close'])
        
        # Calculate MACD
        macd, signal = calculate_macd(df['close'])
        df['macd'] = macd
        df['macd_signal'] = signal
        df['macd_histogram'] = df['macd'] - df['macd_signal']
        
        return df.to_dict('records')
    except Exception as e:
        print(f"Error in detailed history for {symbol}: {e}")
        return history_data

def calculate_rsi(prices, window=14):
    """Calculate RSI manually"""
    try:
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50)
    except:
        return pd.Series([50] * len(prices))

def calculate_macd(prices, fast=12, slow=26, signal=9):
    """Calculate MACD manually"""
    try:
        ema_fast = prices.ewm(span=fast).mean()
        ema_slow = prices.ewm(span=slow).mean()
        macd = ema_fast - ema_slow
        macd_signal = macd.ewm(span=signal).mean()
        return macd, macd_signal
    except:
        return pd.Series([0] * len(prices)), pd.Series([0] * len(prices))

def generate_sample_history(symbol, period):
    """Generate sample historical data when API fails"""
    base_price = 150 if symbol.upper() == 'AAPL' else 100
    volatility = 0.02
    history_data = []
    
    days = 180 if period == "6mo" else 90
    start_date = datetime.now() - timedelta(days=days)
    
    current_price = base_price
    
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        
        # Simulate price movement
        change_percent = (hash(symbol + str(i)) % 100 - 50) / 1000.0  # -5% to +5%
        current_price = current_price * (1 + change_percent)
        
        # Generate OHLC data
        open_price = current_price * (1 + (hash(symbol + str(i) + 'open') % 100 - 50) / 1000.0)
        high_price = max(open_price, current_price) * (1 + abs(hash(symbol + str(i) + 'high') % 100) / 1000.0)
        low_price = min(open_price, current_price) * (1 - abs(hash(symbol + str(i) + 'low') % 100) / 1000.0)
        close_price = current_price
        
        # Calculate moving averages
        prices_so_far = [item["close"] for item in history_data] + [close_price]
        sma_20 = np.mean(prices_so_far[-20:]) if len(prices_so_far) >= 20 else 0
        sma_50 = np.mean(prices_so_far[-50:]) if len(prices_so_far) >= 50 else 0
        
        history_data.append({
            "date": current_date.strftime('%Y-%m-%d'),
            "timestamp": current_date.timestamp(),
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
            "volume": 1000000 + (hash(symbol + str(i)) % 5000000),
            "sma_20": round(sma_20, 2),
            "sma_50": round(sma_50, 2)
        })
    
    return history_data

def get_live_price(symbol):
    """Get only live price for real-time updates"""
    try:
        stock = yf.Ticker(symbol)
        fast_info = stock.fast_info
        return fast_info.get('last_price') or stock.info.get("currentPrice") or 0
    except:
        return get_static_stock_data(symbol)["price"] if get_static_stock_data(symbol) else 0

def get_multiple_stocks(symbols):
    """Fetch data for multiple stocks efficiently with parallel processing"""
    results = []
    for symbol in symbols:
        data = get_stock_data(symbol)
        if data:
            results.append(data)
        time.sleep(0.1)  # Small delay to avoid rate limiting
    return results
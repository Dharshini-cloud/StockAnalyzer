import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import talib

def calculate_technical_indicators(symbol):
    """
    Calculate technical indicators for stock analysis
    Returns: BUY/HOLD/SELL recommendation with score and reasoning
    """
    try:
        # Fetch historical data
        stock = yf.Ticker(symbol)
        hist = stock.history(period="6mo")
        
        if hist.empty:
            return get_fallback_recommendation(symbol)
        
        # Calculate indicators
        prices = hist['Close']
        
        # Moving Averages
        ma20 = talib.SMA(prices, timeperiod=20)
        ma50 = talib.SMA(prices, timeperiod=50)
        
        # RSI
        rsi = talib.RSI(prices, timeperiod=14)
        
        # MACD
        macd, macd_signal, macd_hist = talib.MACD(prices)
        
        # Get current values (most recent)
        current_price = prices.iloc[-1]
        current_ma20 = ma20.iloc[-1] if not pd.isna(ma20.iloc[-1]) else current_price
        current_ma50 = ma50.iloc[-1] if not pd.isna(ma50.iloc[-1]) else current_price
        current_rsi = rsi.iloc[-1] if not pd.isna(rsi.iloc[-1]) else 50
        current_macd = macd.iloc[-1] if not pd.isna(macd.iloc[-1]) else 0
        current_macd_signal = macd_signal.iloc[-1] if not pd.isna(macd_signal.iloc[-1]) else 0
        
        # Calculate scores for each indicator
        score = 0
        reasoning = []
        
        # 1. Moving Average Analysis (40% weight)
        ma_score = 0
        if current_price > current_ma20 and current_ma20 > current_ma50:
            ma_score = 10
            reasoning.append("✅ Strong uptrend: Price above MA20 and MA20 above MA50")
        elif current_price > current_ma20:
            ma_score = 5
            reasoning.append("↗️ Mild uptrend: Price above MA20")
        elif current_price < current_ma20 and current_ma20 < current_ma50:
            ma_score = -10
            reasoning.append("❌ Strong downtrend: Price below MA20 and MA20 below MA50")
        elif current_price < current_ma20:
            ma_score = -5
            reasoning.append("↘️ Mild downtrend: Price below MA20")
        else:
            reasoning.append("➡️ Neutral: Price near moving averages")
        
        score += ma_score * 0.4
        
        # 2. RSI Analysis (30% weight)
        rsi_score = 0
        if current_rsi < 30:
            rsi_score = 10
            reasoning.append("📈 Oversold: RSI below 30 (potential buying opportunity)")
        elif current_rsi < 45:
            rsi_score = 5
            reasoning.append("👍 Bullish: RSI in lower range")
        elif current_rsi > 70:
            rsi_score = -10
            reasoning.append("📉 Overbought: RSI above 70 (potential selling pressure)")
        elif current_rsi > 55:
            rsi_score = -5
            reasoning.append("👎 Bearish: RSI in higher range")
        else:
            reasoning.append("⚖️ Neutral: RSI in normal range (30-70)")
        
        score += rsi_score * 0.3
        
        # 3. MACD Analysis (30% weight)
        macd_score = 0
        if current_macd > current_macd_signal and current_macd > 0:
            macd_score = 10
            reasoning.append("🚀 Strong bullish: MACD above signal line and positive")
        elif current_macd > current_macd_signal:
            macd_score = 5
            reasoning.append("📊 Bullish: MACD above signal line")
        elif current_macd < current_macd_signal and current_macd < 0:
            macd_score = -10
            reasoning.append("🔻 Strong bearish: MACD below signal line and negative")
        elif current_macd < current_macd_signal:
            macd_score = -5
            reasoning.append("📉 Bearish: MACD below signal line")
        else:
            reasoning.append("⚡ Neutral: MACD near signal line")
        
        score += macd_score * 0.3
        
        # Determine recommendation
        if score >= 7:
            recommendation = "STRONG BUY"
            confidence = "high"
        elif score >= 3:
            recommendation = "BUY"
            confidence = "medium"
        elif score >= -2:
            recommendation = "HOLD"
            confidence = "neutral"
        elif score >= -6:
            recommendation = "SELL"
            confidence = "medium"
        else:
            recommendation = "STRONG SELL"
            confidence = "high"
        
        # Calculate additional metrics
        price_change_1d = ((current_price - prices.iloc[-2]) / prices.iloc[-2]) * 100 if len(prices) > 1 else 0
        price_change_1w = ((current_price - prices.iloc[-5]) / prices.iloc[-5]) * 100 if len(prices) > 5 else 0
        
        analysis_data = {
            "symbol": symbol.upper(),
            "recommendation": recommendation,
            "confidence": confidence,
            "score": round(score, 2),
            "current_price": round(current_price, 2),
            "indicators": {
                "ma20": round(current_ma20, 2),
                "ma50": round(current_ma50, 2),
                "rsi": round(current_rsi, 2),
                "macd": round(current_macd, 4),
                "macd_signal": round(current_macd_signal, 4)
            },
            "price_changes": {
                "1d": round(price_change_1d, 2),
                "1w": round(price_change_1w, 2)
            },
            "reasoning": reasoning,
            "last_updated": datetime.now().isoformat()
        }
        
        return analysis_data
        
    except Exception as e:
        print(f"Error in technical analysis for {symbol}: {e}")
        return get_fallback_recommendation(symbol)

def get_fallback_recommendation(symbol):
    """Fallback analysis when real data is unavailable"""
    return {
        "symbol": symbol.upper(),
        "recommendation": "HOLD",
        "confidence": "low",
        "score": 0,
        "current_price": 0,
        "indicators": {
            "ma20": 0,
            "ma50": 0,
            "rsi": 50,
            "macd": 0,
            "macd_signal": 0
        },
        "price_changes": {
            "1d": 0,
            "1w": 0
        },
        "reasoning": [
            "⚠️ Limited data available for analysis",
            "Using fallback recommendation"
        ],
        "last_updated": datetime.now().isoformat()
    }

def analyze_multiple_stocks(symbols):
    """Analyze multiple stocks at once"""
    results = []
    for symbol in symbols:
        analysis = calculate_technical_indicators(symbol)
        results.append(analysis)
    return results
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from services.stock_service import get_stock_data, get_stock_history, get_multiple_stocks, get_live_price, get_detailed_stock_history
from datetime import datetime

stock_bp = Blueprint('stock', __name__)

@stock_bp.route('/stock/<symbol>', methods=['GET'])
@jwt_required()
def get_stock(symbol):
    try:
        data = get_stock_data(symbol)
        if data:
            return jsonify({"success": True, "data": data})
        return jsonify({"success": False, "error": "Stock not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@stock_bp.route('/stocks', methods=['GET'])
@jwt_required()
def get_multiple_stocks_route():
    try:
        symbols = request.args.get('symbols', 'AAPL,TSLA,GOOGL,MSFT,AMZN,META,NFLX,NVDA')
        symbol_list = [s.strip().upper() for s in symbols.split(',')]
        
        results = get_multiple_stocks(symbol_list)
        return jsonify({"success": True, "data": results})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@stock_bp.route('/stock/<symbol>/history', methods=['GET'])
@jwt_required()
def get_stock_history_route(symbol):
    try:
        period = request.args.get('period', '6mo')
        history_data = get_stock_history(symbol, period)
        return jsonify({"success": True, "data": history_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@stock_bp.route('/stock/<symbol>/history/detailed', methods=['GET'])
@jwt_required()
def get_detailed_stock_history_route(symbol):
    """Get detailed historical data with technical indicators"""
    try:
        period = request.args.get('period', '6mo')
        detailed_data = get_detailed_stock_history(symbol, period)
        return jsonify({"success": True, "data": detailed_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@stock_bp.route('/stock/<symbol>/history/ohlc', methods=['GET'])
@jwt_required()
def get_ohlc_history_route(symbol):
    """Get OHLC data specifically for candlestick charts"""
    try:
        period = request.args.get('period', '3mo')
        history_data = get_stock_history(symbol, period)
        
        # Format specifically for candlestick charts
        ohlc_data = []
        for item in history_data:
            ohlc_data.append({
                "date": item["date"],
                "timestamp": item["timestamp"],
                "open": item["open"],
                "high": item["high"],
                "low": item["low"],
                "close": item["close"],
                "volume": item["volume"]
            })
        
        return jsonify({"success": True, "data": ohlc_data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@stock_bp.route('/stock/<symbol>/live', methods=['GET'])
@jwt_required()
def get_live_price_route(symbol):
    """Get only live price for real-time updates"""
    try:
        price = get_live_price(symbol)
        return jsonify({
            "success": True, 
            "data": {
                "symbol": symbol.upper(),
                "price": price,
                "last_updated": datetime.now().isoformat()
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
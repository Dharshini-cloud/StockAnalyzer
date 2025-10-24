from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from services.analysis_service import calculate_technical_indicators, analyze_multiple_stocks

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analyze/<symbol>', methods=['GET'])
@jwt_required()
def analyze_stock(symbol):
    try:
        analysis = calculate_technical_indicators(symbol)
        return jsonify({"success": True, "data": analysis})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@analysis_bp.route('/analyze/bulk', methods=['GET'])
@jwt_required()
def analyze_multiple_stocks_route():
    try:
        symbols = request.args.get('symbols', 'AAPL,TSLA,GOOGL')
        symbol_list = [s.strip().upper() for s in symbols.split(',')]
        
        results = analyze_multiple_stocks(symbol_list)
        return jsonify({"success": True, "data": results})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@analysis_bp.route('/analyze/advanced/<symbol>', methods=['GET'])
@jwt_required()
def analyze_stock_advanced(symbol):
    try:
        # For future expansion with more advanced analysis
        analysis = calculate_technical_indicators(symbol)
        return jsonify({"success": True, "data": analysis})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
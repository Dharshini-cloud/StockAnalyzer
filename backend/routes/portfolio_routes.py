from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import json
from database import get_database

portfolio_bp = Blueprint('portfolio', __name__)

# Custom JSON encoder to handle MongoDB types
class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(JSONEncoder, self).default(obj)

def serialize_document(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    
    if isinstance(doc, list):
        return [serialize_document(item) for item in doc]
    
    if not isinstance(doc, dict):
        return doc
    
    serialized = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, dict):
            serialized[key] = serialize_document(value)
        elif isinstance(value, list):
            serialized[key] = [serialize_document(item) for item in value]
        else:
            serialized[key] = value
    return serialized

# Mock stock prices (replace with real API)
MOCK_PRICES = {
    'AAPL': 185.00,
    'GOOGL': 145.50,
    'MSFT': 380.75,
    'TSLA': 245.30,
    'AMZN': 155.20,
    'META': 350.40,
    'NVDA': 485.25,
    'NFLX': 490.10
}

def get_current_price(symbol):
    """Get current stock price - replace with real API call"""
    try:
        # For demo, use mock prices with some random variation
        base_price = MOCK_PRICES.get(symbol, 100.00)
        # Add small random variation to simulate real market
        import random
        variation = random.uniform(-2.0, 2.0)
        return round(base_price + variation, 2)
    except:
        return 100.00  # Fallback price

@portfolio_bp.route('/portfolio', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_portfolio():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        print(f"📊 Getting portfolio for user ID: {current_user_id}")
        
        db = get_database()
        portfolio_collection = db.portfolio
        
        # Get all holdings for the user
        holdings = list(portfolio_collection.find({'user_id': ObjectId(current_user_id)}))
        
        # Calculate portfolio totals with real-time prices
        total_investment = 0
        current_value = 0
        
        formatted_holdings = []
        for holding in holdings:
            symbol = holding.get('symbol', '')
            quantity = holding.get('quantity', 0)
            avg_price = holding.get('average_price', 0)
            investment = holding.get('total_investment', 0)
            
            # Get real-time current price
            current_price = get_current_price(symbol)
            holding_value = current_price * quantity
            holding_pl = holding_value - investment
            holding_pl_percentage = (holding_pl / investment * 100) if investment > 0 else 0
            
            total_investment += investment
            current_value += holding_value
            
            # Create serialized holding
            serialized_holding = {
                '_id': str(holding['_id']),
                'symbol': symbol,
                'name': holding.get('name', symbol),
                'quantity': quantity,
                'average_price': avg_price,
                'current_price': current_price,
                'total_investment': investment,
                'current_value': round(holding_value, 2),
                'pl': round(holding_pl, 2),
                'pl_percentage': round(holding_pl_percentage, 2)
            }
            
            # Add optional fields if they exist
            if holding.get('purchase_date'):
                if isinstance(holding['purchase_date'], datetime):
                    serialized_holding['purchase_date'] = holding['purchase_date'].isoformat()
                else:
                    serialized_holding['purchase_date'] = holding['purchase_date']
            
            if holding.get('notes'):
                serialized_holding['notes'] = holding['notes']
                
            if holding.get('created_at'):
                if isinstance(holding['created_at'], datetime):
                    serialized_holding['created_at'] = holding['created_at'].isoformat()
                else:
                    serialized_holding['created_at'] = holding['created_at']
            
            formatted_holdings.append(serialized_holding)
        
        total_pl = current_value - total_investment
        total_pl_percentage = (total_pl / total_investment * 100) if total_investment > 0 else 0
        
        portfolio_data = {
            'total_investment': round(total_investment, 2),
            'current_value': round(current_value, 2),
            'total_pl': round(total_pl, 2),
            'total_pl_percentage': round(total_pl_percentage, 2),
            'total_holdings': len(holdings),
            'holdings': formatted_holdings,
            'last_updated': datetime.utcnow().isoformat()
        }
        
        print(f"✅ Portfolio retrieved with real-time prices for user: {current_user_id}")
        
        return jsonify({
            'success': True,
            'data': portfolio_data
        })
        
    except Exception as e:
        print(f"❌ Portfolio retrieval error: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch portfolio'}), 500

@portfolio_bp.route('/portfolio/holdings', methods=['POST', 'OPTIONS'])
@jwt_required()
def add_holding():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        print(f"➕ Adding holding for user ID: {current_user_id}")
        
        data = request.get_json()
        print(f"📝 Holding data: {data}")
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        required_fields = ['symbol', 'quantity', 'average_price']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        symbol = data['symbol'].upper().strip()
        quantity = float(data['quantity'])
        average_price = float(data['average_price'])
        total_investment = quantity * average_price
        
        db = get_database()
        portfolio_collection = db.portfolio
        
        # Check if holding already exists for this user
        existing_holding = portfolio_collection.find_one({
            'user_id': ObjectId(current_user_id),
            'symbol': symbol
        })
        
        if existing_holding:
            return jsonify({
                'success': False, 
                'error': 'Holding already exists for this symbol'
            }), 400
        
        # Create new holding
        holding_data = {
            'user_id': ObjectId(current_user_id),
            'symbol': symbol,
            'name': data.get('name', symbol),
            'quantity': quantity,
            'average_price': average_price,
            'total_investment': total_investment,
            'purchase_date': data.get('purchase_date', datetime.utcnow()),
            'notes': data.get('notes', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = portfolio_collection.insert_one(holding_data)
        
        # Get the inserted document
        inserted_holding = portfolio_collection.find_one({'_id': result.inserted_id})
        
        if not inserted_holding:
            return jsonify({'success': False, 'error': 'Failed to create holding'}), 500
        
        # Serialize the response data
        response_data = {
            '_id': str(inserted_holding['_id']),
            'symbol': inserted_holding.get('symbol', ''),
            'name': inserted_holding.get('name', ''),
            'quantity': inserted_holding.get('quantity', 0),
            'average_price': inserted_holding.get('average_price', 0),
            'total_investment': inserted_holding.get('total_investment', 0),
            'user_id': str(inserted_holding.get('user_id', ''))
        }
        
        # Add optional fields
        if inserted_holding.get('purchase_date'):
            purchase_date = inserted_holding['purchase_date']
            if isinstance(purchase_date, datetime):
                response_data['purchase_date'] = purchase_date.isoformat()
            else:
                response_data['purchase_date'] = purchase_date
        
        if inserted_holding.get('notes'):
            response_data['notes'] = inserted_holding['notes']
        
        print(f"✅ Holding added successfully: {symbol}")
        
        return jsonify({
            'success': True,
            'message': 'Holding added successfully',
            'data': response_data
        })
        
    except Exception as e:
        print(f"❌ Add holding error: {e}")
        return jsonify({'success': False, 'error': 'Failed to add holding'}), 500

@portfolio_bp.route('/portfolio/holdings/<holding_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_holding(holding_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        print(f"✏️ Updating holding {holding_id} for user ID: {current_user_id}")
        
        data = request.get_json()
        print(f"📝 Update data: {data}")
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        db = get_database()
        portfolio_collection = db.portfolio
        
        # Check if holding exists and belongs to user
        holding = portfolio_collection.find_one({
            '_id': ObjectId(holding_id),
            'user_id': ObjectId(current_user_id)
        })
        
        if not holding:
            return jsonify({'success': False, 'error': 'Holding not found'}), 404
        
        # Prepare update fields
        update_fields = {}
        
        if 'quantity' in data:
            update_fields['quantity'] = float(data['quantity'])
        if 'average_price' in data:
            update_fields['average_price'] = float(data['average_price'])
        if 'name' in data:
            update_fields['name'] = data['name'].strip()
        if 'notes' in data:
            update_fields['notes'] = data['notes'].strip()
        if 'purchase_date' in data:
            update_fields['purchase_date'] = data['purchase_date']
        
        # Recalculate total investment if quantity or price changed
        if 'quantity' in update_fields or 'average_price' in update_fields:
            quantity = update_fields.get('quantity', holding['quantity'])
            average_price = update_fields.get('average_price', holding['average_price'])
            update_fields['total_investment'] = quantity * average_price
        
        update_fields['updated_at'] = datetime.utcnow()
        
        # Update holding
        result = portfolio_collection.update_one(
            {'_id': ObjectId(holding_id)},
            {'$set': update_fields}
        )
        
        if result.modified_count == 0:
            return jsonify({'success': False, 'error': 'No changes made'}), 400
        
        print(f"✅ Holding updated successfully: {holding_id}")
        
        return jsonify({
            'success': True,
            'message': 'Holding updated successfully'
        })
        
    except Exception as e:
        print(f"❌ Update holding error: {e}")
        return jsonify({'success': False, 'error': 'Failed to update holding'}), 500

@portfolio_bp.route('/portfolio/holdings/<holding_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def remove_holding(holding_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        print(f"🗑️ Removing holding {holding_id} for user ID: {current_user_id}")
        
        db = get_database()
        portfolio_collection = db.portfolio
        
        # Check if holding exists and belongs to user
        holding = portfolio_collection.find_one({
            '_id': ObjectId(holding_id),
            'user_id': ObjectId(current_user_id)
        })
        
        if not holding:
            return jsonify({'success': False, 'error': 'Holding not found'}), 404
        
        # Delete holding
        result = portfolio_collection.delete_one({'_id': ObjectId(holding_id)})
        
        if result.deleted_count == 0:
            return jsonify({'success': False, 'error': 'Failed to delete holding'}), 500
        
        print(f"✅ Holding removed successfully: {holding_id}")
        
        return jsonify({
            'success': True,
            'message': 'Holding removed successfully'
        })
        
    except Exception as e:
        print(f"❌ Remove holding error: {e}")
        return jsonify({'success': False, 'error': 'Failed to remove holding'}), 500

@portfolio_bp.route('/portfolio/performance', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_portfolio_performance():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        print(f"📈 Getting portfolio performance for user ID: {current_user_id}")
        
        db = get_database()
        portfolio_collection = db.portfolio
        
        # Get all holdings for the user
        holdings = list(portfolio_collection.find({'user_id': ObjectId(current_user_id)}))
        
        # Calculate performance metrics
        total_investment = sum(holding.get('total_investment', 0) for holding in holdings)
        current_value = sum(get_current_price(holding.get('symbol', '')) * holding.get('quantity', 0) for holding in holdings)
        total_pl = current_value - total_investment
        total_pl_percentage = (total_pl / total_investment * 100) if total_investment > 0 else 0
        
        # Calculate daily performance (mock data for demo)
        performance_data = {
            'total_investment': round(total_investment, 2),
            'current_value': round(current_value, 2),
            'total_pl': round(total_pl, 2),
            'total_pl_percentage': round(total_pl_percentage, 2),
            'daily_change': round(total_pl * 0.01, 2),  # Mock data
            'daily_change_percentage': 1.0,  # Mock data
            'best_performer': max(holdings, key=lambda x: x.get('average_price', 0)).get('symbol', '') if holdings else '',
            'worst_performer': min(holdings, key=lambda x: x.get('average_price', 0)).get('symbol', '') if holdings else ''
        }
        
        print(f"✅ Portfolio performance retrieved for user: {current_user_id}")
        
        return jsonify({
            'success': True,
            'data': performance_data
        })
        
    except Exception as e:
        print(f"❌ Portfolio performance error: {e}")
        return jsonify({'success': False, 'error': 'Failed to fetch portfolio performance'}), 500
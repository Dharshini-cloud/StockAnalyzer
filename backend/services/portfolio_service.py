from datetime import datetime
from bson import ObjectId
from database import get_database
import yfinance as yf

class PortfolioService:
    @staticmethod
    def get_user_portfolio(user_id):
        db = get_database()
        
        # Get user's portfolio holdings
        holdings = list(db.portfolio.find({"user_id": ObjectId(user_id)}))
        
        portfolio_data = []
        total_current_value = 0
        total_investment = 0
        
        for holding in holdings:
            # Get current stock price
            try:
                stock = yf.Ticker(holding['symbol'])
                info = stock.info
                current_price = info.get('currentPrice') or info.get('regularMarketPrice') or holding['buy_price']
                if not current_price:
                    current_price = holding['buy_price']
            except:
                current_price = holding['buy_price']
            
            # Calculate metrics
            current_value = holding['quantity'] * current_price
            investment = holding['quantity'] * holding['buy_price']
            profit_loss = current_value - investment
            profit_loss_percent = ((current_value - investment) / investment) * 100 if investment > 0 else 0
            
            portfolio_data.append({
                'id': str(holding['_id']),
                'symbol': holding['symbol'],
                'quantity': holding['quantity'],
                'buy_price': round(holding['buy_price'], 2),
                'current_price': round(current_price, 2),
                'current_value': round(current_value, 2),
                'investment': round(investment, 2),
                'profit_loss': round(profit_loss, 2),
                'profit_loss_percent': round(profit_loss_percent, 2),
                'company_name': holding.get('company_name', holding['symbol'])
            })
            
            total_current_value += current_value
            total_investment += investment
        
        # Calculate overall portfolio metrics
        overall_pl = total_current_value - total_investment
        overall_pl_percent = (overall_pl / total_investment) * 100 if total_investment > 0 else 0
        
        return {
            'holdings': portfolio_data,
            'summary': {
                'total_investment': round(total_investment, 2),
                'total_current_value': round(total_current_value, 2),
                'total_profit_loss': round(overall_pl, 2),
                'total_profit_loss_percent': round(overall_pl_percent, 2),
                'total_holdings': len(holdings)
            }
        }

    @staticmethod
    def add_to_portfolio(user_id, symbol, quantity, buy_price, company_name=None):
        db = get_database()
        
        # Get company name if not provided
        if not company_name:
            try:
                stock = yf.Ticker(symbol)
                company_name = stock.info.get('longName', symbol)
            except:
                company_name = symbol
        
        # Check if holding already exists
        existing = db.portfolio.find_one({
            "user_id": ObjectId(user_id),
            "symbol": symbol.upper()
        })
        
        if existing:
            # Update existing holding with weighted average
            new_quantity = existing['quantity'] + quantity
            new_buy_price = ((existing['quantity'] * existing['buy_price']) + (quantity * buy_price)) / new_quantity
            
            db.portfolio.update_one(
                {"_id": existing['_id']},
                {
                    "$set": {
                        "quantity": new_quantity,
                        "buy_price": round(new_buy_price, 2),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        else:
            # Add new holding
            db.portfolio.insert_one({
                "user_id": ObjectId(user_id),
                "symbol": symbol.upper(),
                "company_name": company_name,
                "quantity": quantity,
                "buy_price": round(buy_price, 2),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
        
        return True

    @staticmethod
    def update_holding(holding_id, user_id, quantity, buy_price):
        db = get_database()
        
        db.portfolio.update_one(
            {
                "_id": ObjectId(holding_id),
                "user_id": ObjectId(user_id)
            },
            {
                "$set": {
                    "quantity": quantity,
                    "buy_price": round(buy_price, 2),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return True

    @staticmethod
    def remove_holding(holding_id, user_id):
        db = get_database()
        
        db.portfolio.delete_one({
            "_id": ObjectId(holding_id),
            "user_id": ObjectId(user_id)
        })
        
        return True
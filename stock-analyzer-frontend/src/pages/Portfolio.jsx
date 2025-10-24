import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './Portfolio.css';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState({ 
    holdings: [], 
    total_investment: 0,
    current_value: 0,
    total_pl: 0,
    total_pl_percentage: 0,
    total_holdings: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    average_price: '',
    name: ''
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        toast.error('Please login to view portfolio');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      const token = user.access_token;

      // ✅ CHANGED: localhost:8000 → localhost:5000
      const response = await fetch('http://localhost:5000/api/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          setPortfolio(result.data);
        } else {
          toast.error(result.error || 'Failed to fetch portfolio');
        }
      } else {
        toast.error('Failed to fetch portfolio data');
      }
    } catch (error) {
      console.error('❌ Portfolio fetch error:', error);
      toast.error('Cannot connect to server. Please make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHolding = async (e) => {
    e.preventDefault();
    try {
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData);
      const token = user.access_token;

      const holdingData = {
        symbol: formData.symbol,
        quantity: parseFloat(formData.quantity),
        average_price: parseFloat(formData.average_price),
        name: formData.name || formData.symbol
      };

      // ✅ CHANGED: localhost:8000 → localhost:5000
      const response = await fetch('http://localhost:5000/api/portfolio/holdings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(holdingData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Stock added to portfolio successfully!');
        setShowAddForm(false);
        setFormData({ symbol: '', quantity: '', average_price: '', name: '' });
        fetchPortfolio();
      } else {
        toast.error(result.error || 'Failed to add stock to portfolio');
      }
    } catch (error) {
      console.error('❌ Add holding error:', error);
      toast.error('Error adding stock to portfolio');
    }
  };

  const handleUpdateHolding = async (e) => {
    e.preventDefault();
    try {
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData);
      const token = user.access_token;

      const updateData = {
        quantity: parseFloat(formData.quantity),
        average_price: parseFloat(formData.average_price),
        name: formData.name || formData.symbol
      };

      // ✅ CHANGED: localhost:8000 → localhost:5000
      const response = await fetch(`http://localhost:5000/api/portfolio/holdings/${editingHolding._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Holding updated successfully!');
        setEditingHolding(null);
        setFormData({ symbol: '', quantity: '', average_price: '', name: '' });
        fetchPortfolio();
      } else {
        toast.error(result.error || 'Failed to update holding');
      }
    } catch (error) {
      console.error('❌ Update holding error:', error);
      toast.error('Error updating holding');
    }
  };

  const handleDeleteHolding = async (holdingId) => {
    if (window.confirm('Are you sure you want to remove this holding?')) {
      try {
        const userData = localStorage.getItem('user');
        const user = JSON.parse(userData);
        const token = user.access_token;

        // ✅ CHANGED: localhost:8000 → localhost:5000
        const response = await fetch(`http://localhost:5000/api/portfolio/holdings/${holdingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (response.ok && result.success) {
          toast.success('Holding removed successfully!');
          fetchPortfolio();
        } else {
          toast.error(result.error || 'Failed to remove holding');
        }
      } catch (error) {
        console.error('❌ Delete holding error:', error);
        toast.error('Error removing holding');
      }
    }
  };

  const startEdit = (holding) => {
    setEditingHolding(holding);
    setFormData({
      symbol: holding.symbol,
      quantity: holding.quantity,
      average_price: holding.average_price,
      name: holding.name
    });
  };

  const cancelEdit = () => {
    setEditingHolding(null);
    setFormData({ symbol: '', quantity: '', average_price: '', name: '' });
  };

  if (loading) {
    return (
      <div className="portfolio-container">
        <div className="loading">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="portfolio-container">
      <div className="portfolio-header">
        <h1>My Portfolio</h1>
        <button 
          className="btn btn-primary add-holding-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Holding
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="portfolio-summary">
        <div className="summary-card">
          <h3>Total Investment</h3>
          <p className="amount">${portfolio.total_investment?.toLocaleString() || '0'}</p>
        </div>
        <div className="summary-card">
          <h3>Current Value</h3>
          <p className="amount">${portfolio.current_value?.toLocaleString() || '0'}</p>
        </div>
        <div className={`summary-card ${portfolio.total_pl >= 0 ? 'profit' : 'loss'}`}>
          <h3>Total P/L</h3>
          <p className="amount">
            ${portfolio.total_pl?.toLocaleString() || '0'} 
            <span className="percent">
              ({portfolio.total_pl_percentage?.toFixed(2) || '0.00'}%)
            </span>
          </p>
        </div>
        <div className="summary-card">
          <h3>Total Holdings</h3>
          <p className="amount">{portfolio.total_holdings || 0}</p>
        </div>
      </div>

      {/* Add Holding Form */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Stock to Portfolio</h3>
            <form onSubmit={handleAddHolding}>
              <input
                type="text"
                placeholder="Symbol (e.g., AAPL)"
                value={formData.symbol}
                onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                required
              />
              <input
                type="text"
                placeholder="Company Name (optional)"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
                min="1"
                step="1"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Average Price per Share"
                value={formData.average_price}
                onChange={(e) => setFormData({...formData, average_price: e.target.value})}
                required
                min="0.01"
              />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Add to Portfolio</button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Holding Form */}
      {editingHolding && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Holding - {editingHolding.symbol}</h3>
            <form onSubmit={handleUpdateHolding}>
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
                min="1"
                step="1"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Average Price per Share"
                value={formData.average_price}
                onChange={(e) => setFormData({...formData, average_price: e.target.value})}
                required
                min="0.01"
              />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Update Holding</button>
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="holdings-section">
        <h2>Your Holdings</h2>
        {(!portfolio.holdings || portfolio.holdings.length === 0) ? (
          <div className="empty-state">
            <p>No holdings in your portfolio yet.</p>
            <p>Add some stocks to track your investments!</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Avg Price</th>
                  <th>Current Price</th>
                  <th>Investment</th>
                  <th>Current Value</th>
                  <th>P/L</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map(holding => (
                  <tr key={holding._id}>
                    <td>
                      <div className="stock-info">
                        <strong>{holding.symbol}</strong>
                      </div>
                    </td>
                    <td>{holding.name}</td>
                    <td>{holding.quantity}</td>
                    <td>${holding.average_price?.toFixed(2)}</td>
                    <td>${holding.current_price?.toFixed(2)}</td>
                    <td>${holding.total_investment?.toLocaleString()}</td>
                    <td>${holding.current_value?.toLocaleString()}</td>
                    <td className={holding.pl >= 0 ? 'profit' : 'loss'}>
                      <div className="pl-display">
                        <span className="amount">${holding.pl?.toLocaleString()}</span>
                        <span className="percent">({holding.pl_percentage?.toFixed(2)}%)</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-sm btn-edit"
                          onClick={() => startEdit(holding)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDeleteHolding(holding._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;
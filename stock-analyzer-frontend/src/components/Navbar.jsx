import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/watchlist", label: "Watchlist", icon: "⭐" },
    { path: "/portfolio", label: "Portfolio", icon: "💼" },
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Brand Logo */}
        <Link to="/" className="nav-brand">
          <div className="brand-logo">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 16L11 12L14 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 9H18V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="brand-text">StockAnalyzer</span>
            <span className="brand-beta">Pro</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-desktop">
          {user ? (
            <>
              {/* Navigation Links */}
              <div className="nav-links">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`nav-link ${isActiveRoute(link.path) ? "active" : ""}`}
                  >
                    <span className="nav-icon">{link.icon}</span>
                    {link.label}
                    {isActiveRoute(link.path) && <div className="active-indicator"></div>}
                  </Link>
                ))}
              </div>

              {/* User Menu & Notifications */}
              <div className="nav-actions">
                {/* Notification Bell */}
                <div className="notification-wrapper">
                  <NotificationBell />
                </div>

                {/* User Menu Dropdown */}
                <div className="user-menu" ref={userMenuRef}>
                  <button
                    className="user-trigger"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <div className="user-avatar">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.username}</span>
                      <span className="user-status">Premium Member</span>
                    </div>
                    <svg className="dropdown-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="user-dropdown">
                      <div className="dropdown-header">
                        <div className="user-info-large">
                          <div className="user-avatar large">
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-details">
                            <div className="user-username">{user.username}</div>
                            <div className="user-email">{user.email}</div>
                            <div className="user-plan">Premium Plan</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="dropdown-divider"></div>
                      
                      <div className="dropdown-section">
                        <div className="section-title">Account</div>
                        <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          Profile Settings
                        </Link>
                      </div>
                      
                      <div className="dropdown-divider"></div>

                      <div className="dropdown-section">
                        <div className="section-title">Preferences</div>
                        <Link to="/preferences" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                          </svg>
                          Preferences
                        </Link>
                      </div>
                      
                      <div className="dropdown-divider"></div>
                      
                      <button 
                        className="dropdown-item logout-btn"
                        onClick={handleLogout}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16,17 21,12 16,7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Guest Navigation */
            <div className="guest-links">
              <Link 
                to="/login" 
                className="nav-link login-link"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="nav-link register-link"
              >
                <span>Get Started</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3.333 8h9.334M8 3.333L12.667 8 8 12.667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="mobile-menu" ref={mobileMenuRef}>
          <button 
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <span className={`menu-bar ${showMobileMenu ? "active" : ""}`}></span>
            <span className={`menu-bar ${showMobileMenu ? "active" : ""}`}></span>
            <span className={`menu-bar ${showMobileMenu ? "active" : ""}`}></span>
          </button>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="mobile-dropdown">
              {user ? (
                <>
                  <div className="mobile-user-info">
                    <div className="user-avatar large">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                      <div className="user-username">{user.username}</div>
                      <div className="user-email">{user.email}</div>
                      <div className="user-plan">Premium Plan</div>
                    </div>
                  </div>

                  <div className="mobile-nav-links">
                    {navLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`mobile-nav-link ${isActiveRoute(link.path) ? "active" : ""}`}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <span className="nav-icon">{link.icon}</span>
                        {link.label}
                        {isActiveRoute(link.path) && <div className="active-indicator"></div>}
                      </Link>
                    ))}
                  </div>

                  <div className="dropdown-divider"></div>

                  <div className="mobile-actions">
                    <Link 
                      to="/profile" 
                      className="mobile-nav-link"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Profile Settings
                    </Link>
                    <Link 
                      to="/preferences" 
                      className="mobile-nav-link"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      Preferences
                    </Link>
                    <button 
                      className="mobile-nav-link logout-btn"
                      onClick={handleLogout}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16,17 21,12 16,7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="mobile-guest-links">
                  <Link 
                    to="/login" 
                    className="mobile-nav-link"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="mobile-nav-link register-link"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
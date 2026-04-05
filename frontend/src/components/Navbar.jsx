// components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header className="header">
      <Link to="/" className="logo">
        <div className="logo-icon"><Activity size={22} color="#fff" /></div>
        <span className="logo-name">ACCIDENT<span>IQ</span></span>
      </Link>
      
      <nav className="nav-links">
        <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
        <Link to="/about" className={`nav-link ${isActive('/about')}`}>About Us</Link>
      </nav>

      <div className="header-right">
        {user ? (
          <>
            <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>{user.name}</Link>
            <button onClick={logout} className="btn-logout">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="btn-primary">Sign Up</Link>
          </>
        )}
        <div className="header-tag">v3.0 · AI-POWERED</div>
        <div className="live-dot"><div className="dot"></div> LIVE</div>
      </div>
    </header>
  );
}
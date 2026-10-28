import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Ticket, Shield, LogOut, User, Menu, X, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                IMOVIES <span className="text-xs bg-red-600/80 text-white px-1.5 py-0.5 rounded font-mono font-medium">LIVE</span>
              </span>
              <span className="text-[10px] text-gray-400 -mt-1 tracking-wider uppercase">Cinema Simplified</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/') ? 'text-white bg-gray-800/90' : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Movies
            </Link>
            {isAuthenticated && (
              <Link
                to="/my-bookings"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  isActive('/my-bookings')
                    ? 'text-white bg-gray-800/90'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Ticket className="w-4 h-4 text-red-500" />
                My Bookings
              </Link>
            )}
            <Link
              to="/architecture"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                isActive('/architecture')
                  ? 'text-indigo-300 bg-indigo-500/20 border border-indigo-500/30'
                  : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
              }`}
            >
              <Database className="w-4 h-4 text-indigo-400" />
              <span>QA & Architecture (Steps 6 & 7)</span>
            </Link>
            <Link
            to="/architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-indigo-400 hover:bg-gray-800"
          >
            QA & Architecture (Steps 6 & 7)
          </Link>
          {isAdmin && (
              <Link
                to="/admin"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
                  isActive('/admin')
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <Shield className="w-4 h-4 text-amber-400" />
                Admin Panel
              </Link>
            )}
          </nav>

          {/* User Controls & Notifications */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <NotificationDropdown />
                <div className="h-6 w-px bg-gray-800" />
                <div className="flex items-center gap-2.5 bg-gray-900/60 border border-gray-800 px-3 py-1.5 rounded-full">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-red-600 to-amber-500 flex items-center justify-center text-xs font-bold text-white shadow">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-200 leading-none">{user?.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && <NotificationDropdown />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-gray-800 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-gray-800"
          >
            Movies
          </Link>
          {isAuthenticated && (
            <Link
              to="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:bg-gray-800"
            >
              My Bookings
            </Link>
          )}
          <Link
            to="/architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-indigo-400 hover:bg-gray-800"
          >
            QA & Architecture (Steps 6 & 7)
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-amber-400 hover:bg-amber-500/10"
            >
              Admin Panel
            </Link>
          )}
          <div className="pt-2 border-t border-gray-800">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4" /> Sign Out ({user?.name})
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 bg-gray-800 text-gray-200 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 bg-red-600 text-white rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

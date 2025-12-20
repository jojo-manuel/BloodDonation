import React, { useState, useEffect } from 'react';
import api from '../lib/api';

const Navbar = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      // Only fetch user if there's a token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return; // No token, user is not logged in
      }
      
      try {
        const response = await api.get('/users/me');
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        // Silently handle 401 errors (user not logged in)
        if (error.response?.status !== 401) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setShowDropdown(false);
  };

  return (
    <div className="navbar bg-base-100 shadow-sm w-full">
      <div className="flex-none">
        <button className="btn btn-square btn-ghost">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-5 w-5 stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">Blood Donation System</a>
      </div>
      <div className="flex-none">
        {user ? (
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="w-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            </div>
            {showDropdown && (
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <a className="justify-between">
                    Profile
                    <span className="badge">New</span>
                  </a>
                </li>
                <li><a>Settings</a></li>
                <li><a onClick={handleLogout}>Logout</a></li>
              </ul>
            )}
          </div>
        ) : (
          <div className="skeleton h-10 w-10 rounded-full"></div>
        )}
      </div>
    </div>
  );
};

export default Navbar;

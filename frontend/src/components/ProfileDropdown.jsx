import React, { useContext, useState, useRef } from 'react';
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ProfileDropdown() {
  const { userData, serverUrl, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
    } catch {
      // ignore
    }
    setUserData(null);
    navigate('/signin');
  };

  if (!userData) return null;

  const initial = userData.name?.charAt(0)?.toUpperCase() || '?';
  const avatarUrl = userData.avatar || userData.assistantImage;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/50 bg-black/80 hover:bg-purple-900/30 transition-all duration-200 group"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userData.name}
            className="w-8 h-8 rounded-full border border-purple-500/50 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full border border-purple-500/50 bg-purple-900/50 flex items-center justify-center text-purple-300 font-mono font-bold text-sm">
            {initial}
          </div>
        )}
        <span className="hidden sm:block text-purple-300 font-mono text-sm max-w-24 truncate">
          {userData.name}
        </span>
        <svg
          className={`w-4 h-4 text-purple-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-black/95 backdrop-blur-lg border border-purple-500/50 rounded-lg shadow-xl shadow-purple-500/10 z-50 overflow-hidden">
            {/* Profile Header */}
            <div className="px-4 py-3 border-b border-purple-500/30">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userData.name}
                    className="w-10 h-10 rounded-full border border-purple-500/50 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-purple-500/50 bg-purple-900/50 flex items-center justify-center text-purple-300 font-mono font-bold">
                    {initial}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-purple-200 font-mono text-sm font-semibold truncate">
                    {userData.name}
                  </p>
                  <p className="text-purple-500 font-mono text-xs truncate">
                    {userData.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Auth Provider Badge */}
            <div className="px-4 py-2 border-b border-purple-500/30">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-purple-900/30 border border-purple-500/30 text-purple-300">
                {userData.authProvider === 'google' ? (
                  <>
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    LINKED_VIA_GOOGLE
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    EMAIL_AUTH
                  </>
                )}
              </span>
            </div>

            {/* Actions */}
            <div className="px-2 py-2">
              <button
                onClick={handleLogOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors font-mono text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                TERMINATE_SESSION
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ProfileDropdown;

import React, { useContext, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { userDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function GoogleSignInButton({ mode = 'signin' }) {
  const { serverUrl, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/google`,
        { credential: credentialResponse.credential },
        { withCredentials: true }
      );
      setUserData(result.data);
      navigate('/home');
    } catch (err) {
      console.error('Google auth error:', err);
      setError(err.response?.data?.message || 'GOOGLE_AUTH_FAILED');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('GOOGLE_SIGN_IN_FAILED. Check popup blocker or try again.');
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-900/30 border border-red-700/50 rounded text-red-300 text-xs font-mono">
          ERROR: {error}
        </div>
      )}

      {loading ? (
        <div className="w-full py-3 rounded font-semibold text-sm bg-gray-800 border border-purple-500/50 font-mono tracking-wider flex items-center justify-center gap-3">
          <svg className="animate-spin h-5 w-5 text-purple-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-purple-300">AUTHENTICATING_VIA_GOOGLE...</span>
        </div>
      ) : (
        <div className="flex justify-center w-full [&>div]:w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_black"
            size="large"
            width="100%"
            text={mode === 'signup' ? 'signup_with' : 'signin_with'}
            shape="rectangular"
          />
        </div>
      )}
    </div>
  );
}

export default GoogleSignInButton;

import React, { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import { userDataContext } from './context/UserContext';
import Home from './pages/Home';

function App() {
  const { userData, loading } = useContext(userDataContext);
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path='/' 
        element={!userData ? <SignUp /> : <Navigate to="/home" replace />} 
      />
      <Route 
        path='/signup' 
        element={!userData ? <SignUp /> : <Navigate to="/home" replace />} 
      />
      <Route 
        path='/signin' 
        element={!userData ? <SignIn /> : <Navigate to="/home" replace />} 
      />
      <Route 
        path='/home' 
        element={userData ? <Home /> : <Navigate to="/signin" replace />} 
      />
    </Routes>
  );
}

export default App;

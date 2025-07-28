import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'

import { userDataContext } from './context/UserContext'
import Home from './pages/Home'


function App() {
  const {userData}=useContext(userDataContext)
  return (
   <Routes>
     <Route path='/' element={<Home/>}/>
    <Route path='/signup' element={!userData?<SignUp/>:<Navigate to={"/"}/>}/>
     <Route path='/signin' element={!userData?<SignIn/>:<Navigate to={"/"}/>}/>
   </Routes>
  )
}

export default App

import React, { useContext } from 'react'
import { userDataContext } from '../context/UserContext'

function Card({image}) {
  const {serverUrl,userData,setUserData,backendImage,setBackendImage,frontendImage,setFrontendImage,selectedImage,setSelectedImage}=useContext(userDataContext)
  
  return (
    <div 
      className={`
        w-16 h-32 
        sm:w-20 sm:h-40 
        md:w-24 md:h-44 
        lg:w-36 lg:h-60 
        xl:w-40 xl:h-64
        2xl:w-44 2xl:h-72
        bg-gray-900 
        border-2 border-blue-800 border-opacity-40 
        rounded-2xl 
        overflow-hidden 
        cursor-pointer 
        transition-all 
        duration-300 
        ease-in-out
        transform 
        hover:scale-105 
        hover:shadow-lg 
        hover:shadow-blue-900/50 
        hover:border-blue-500 
        hover:border-opacity-80
        active:scale-95
        ${selectedImage === image ? 
          'border-4 border-white shadow-xl shadow-blue-900/70 scale-105 z-10' : 
          'hover:z-20'
        }
      `} 
      onClick={() => {
        setSelectedImage(image)
        setBackendImage(null)
        setFrontendImage(null)
      }}
    >
      <img 
        src={image} 
        className='
          w-full h-full 
          object-cover 
          object-center 
          transition-transform 
          duration-500 
          ease-in-out 
          hover:scale-110
          group-hover:scale-110
        '  
        alt="Card content"
      />
    </div>
  )
}

export default Card
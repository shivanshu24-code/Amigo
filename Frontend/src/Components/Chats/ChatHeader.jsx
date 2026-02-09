import React from 'react'
import { MdCall, MdVideoCall } from "react-icons/md";   // material icons
import { FiMoreVertical } from "react-icons/fi";   
const ChatHeader = () => {
  return (
 <div className="flex w-full border-b border-gray-200 h-[70px] bg-white px-6 py-3  z-10 rounded-xl  shadow-md items-center justify-between sticky top-0">


  <h1 className="font-semibold text-xl bg-gradient-to-r from-blue-800 to-purple-800 bg-clip-text text-transparent">
    Chat
  </h1>

  
  <div className="flex items-center gap-5 text-gray-700">
    <MdVideoCall className="w-6 h-6 cursor-pointer hover:text-blue-600" />
    <MdCall className="w-5 h-5 cursor-pointer hover:text-blue-600" />
    <FiMoreVertical className='w-5 h-5 cursor-pointer hover:text-black'/>
  </div>
</div>

  )
}

export default ChatHeader

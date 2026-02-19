import React from 'react'

const Menu = ({ icon, label, onClick }) => {
    return (
        <button
            className="
        flex 
        items-center 
        gap-3 
        px-3 
        py-2.5 
        font-medium 
        rounded-xl 
        hover:bg-indigo-50 
        dark:hover:bg-white/10
        transition-colors
        duration-200
        w-full
        group/menu
      "
            onClick={onClick}
        >
            <img
                src={icon}
                alt={label}
                className="w-5 h-5 flex-shrink-0 dark:invert dark:brightness-200 dark:opacity-90 group-hover/menu:opacity-100"
            />
            <span className="
        text-gray-700
        dark:text-gray-200
        group-hover/menu:text-indigo-600
        dark:group-hover/menu:text-indigo-300
        whitespace-nowrap
        overflow-hidden
        transition-colors
        duration-200
      ">
                {label}
            </span>
        </button>
    )
}

export default Menu

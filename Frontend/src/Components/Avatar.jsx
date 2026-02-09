import React, { useState } from 'react';

const Avatar = ({ src, alt, name, className, size = "md" }) => {
    const [imageError, setImageError] = useState(false);

    // Get initials from name (First Last -> FL)
    const getInitials = (fullName) => {
        if (!fullName) return "?";
        const names = fullName.trim().replaceAll(/\s+/g, ' ').split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    };

    // Determine sizes if not handled by className
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-16 h-16 text-xl",
        xl: "w-24 h-24 text-3xl",
        "2xl": "w-28 h-28 text-4xl"
    };

    if (!src || imageError) {
        return (
            <div
                className={`${className || sizeClasses[size]} flex items-center justify-center bg-gray-100 text-gray-500 font-bold rounded-full select-none uppercase`}
            >
                {getInitials(name || alt)}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt || "avatar"}
            className={`${className || sizeClasses[size]} rounded-full object-cover`}
            onError={() => setImageError(true)}
        />
    );
};

export default Avatar;

import React from 'react';
import PostGridSkeleton from './PostGridSkeleton.jsx';

const ProfileSkeleton = () => {
    return (
        <div className="w-full h-full bg-white overflow-hidden animate-pulse">
            {/* Cover Image Skeleton */}
            <div className="h-32 sm:h-44 md:h-52 bg-gray-100"></div>

            {/* Profile Header Skeleton */}
            <div className="px-4 relative">
                {/* Avatar Skeleton */}
                <div className="flex justify-center -mt-12 md:justify-start md:items-end md:gap-4 md:-mt-14">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-200 border-4 border-white"></div>

                    {/* Stats Skeleton (Desktop) */}
                    <div className="hidden md:flex gap-6 mb-4">
                        <div className="w-16 h-8 bg-gray-100 rounded"></div>
                        <div className="w-16 h-8 bg-gray-100 rounded"></div>
                    </div>
                </div>

                {/* Stats Skeleton (Mobile) */}
                <div className="md:hidden flex justify-center gap-8 mt-4">
                    <div className="w-12 h-8 bg-gray-100 rounded"></div>
                    <div className="w-12 h-8 bg-gray-100 rounded"></div>
                </div>

                {/* Name & Username Skeleton */}
                <div className="mt-4 text-center md:text-left">
                    <div className="h-7 bg-gray-200 rounded w-48 mx-auto md:mx-0 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-32 mx-auto md:mx-0"></div>
                </div>

                {/* Bio Skeleton */}
                <div className="mt-4 space-y-2 max-w-lg mx-auto md:mx-0">
                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                    <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-100 rounded w-4/6"></div>
                </div>

                {/* Tags Skeleton */}
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                    <div className="w-24 h-7 bg-gray-100 rounded-full"></div>
                    <div className="w-20 h-7 bg-gray-100 rounded-full"></div>
                    <div className="w-28 h-7 bg-gray-100 rounded-full"></div>
                </div>

                {/* Buttons Skeleton */}
                <div className="mt-4 flex gap-3 max-w-md mx-auto md:mx-0">
                    <div className="flex-1 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 h-10 bg-gray-100 rounded-full"></div>
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="mt-6 border-t border-gray-100 pt-3 px-4 flex gap-2 overflow-x-auto">
                <div className="flex-shrink-0 w-24 h-10 bg-gray-100 rounded-full"></div>
                <div className="flex-shrink-0 w-24 h-10 bg-gray-100 rounded-full"></div>
                <div className="flex-shrink-0 w-24 h-10 bg-gray-100 rounded-full"></div>
            </div>

            {/* Content Grid Skeleton */}
            <div className="p-4">
                <PostGridSkeleton count={6} />
            </div>
        </div>
    );
};

export default ProfileSkeleton;

import React from 'react';

const PostGridSkeleton = ({ count = 6 }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(count)].map((_, i) => (
                <div
                    key={i}
                    className="aspect-square sm:aspect-[4/5] bg-gray-50 rounded-xl border border-gray-50 animate-pulse"
                ></div>
            ))}
        </div>
    );
};

export default PostGridSkeleton;

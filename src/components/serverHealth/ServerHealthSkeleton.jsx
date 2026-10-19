import React from "react";

const ServerHealthSkeleton = () => {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Top Bar Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
              <div className="h-6 w-28 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full"></div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="h-4 w-36 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="h-8 w-28 bg-gray-200 rounded"></div>
            <div className="h-8 w-28 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-gray-50 rounded w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServerHealthSkeleton;

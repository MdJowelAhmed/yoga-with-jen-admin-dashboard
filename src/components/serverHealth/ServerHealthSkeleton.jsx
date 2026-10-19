import React from "react";

const ServerHealthSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Bar Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-32 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-48 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-8 w-36 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-36 bg-gray-200 rounded-full"></div>
            <div className="h-9 w-28 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="h-5 w-28 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-12 w-24 bg-gray-200 rounded-lg"></div>
            <div className="h-3 w-full bg-gray-100 rounded-full"></div>
            <div className="flex justify-between pt-2">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-48 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-gray-200 rounded-xl"></div>
            <div className="h-9 w-36 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServerHealthSkeleton;

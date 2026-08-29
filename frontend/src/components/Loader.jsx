import React from "react";

export default function Loader({ message = "Processing..." }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="relative w-12 h-12">
        {/* Background track ring */}
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600/10"></div>
        {/* Animated spinner ring */}
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-indigo-600/30 border-b-indigo-600/10 border-l-indigo-600/30 animate-spin"></div>
      </div>
      <p className="text-sm font-semibold text-indigo-600/80 animate-pulse tracking-wide font-sans">
        {message}
      </p>
    </div>
  );
}

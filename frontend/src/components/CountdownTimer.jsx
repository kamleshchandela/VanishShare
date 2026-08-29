import React, { useState, useEffect } from "react";

export default function CountdownTimer({ expiresAt, onExpire }) {
  const calculateTimeLeft = () => {
    const difference = +new Date(expiresAt) - Date.now();
    return Math.max(0, Math.floor(difference / 1000));
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  // Track the initial duration to compute progress percentage correctly
  const [initialTime, setInitialTime] = useState(calculateTimeLeft());

  useEffect(() => {
    const initial = calculateTimeLeft();
    setTimeLeft(initial);
    // Default to 60s if remaining time is somehow zero or invalid initially
    setInitialTime(initial > 0 ? initial : 60);
  }, [expiresAt]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, expiresAt, onExpire]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const radius = 38;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate percentage remaining
  const percentage = timeLeft > 0 ? (timeLeft / initialTime) * 100 : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Track Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-slate-200"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Countdown Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-indigo-600 transition-all duration-1000 ease-linear"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))",
            }}
          />
        </svg>

        {/* Live Timer Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-bold font-mono text-indigo-600 tracking-wider">
            {formatTime(timeLeft)}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
            Secs
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-2 font-semibold">
        Destruction Countdown
      </p>
    </div>
  );
}

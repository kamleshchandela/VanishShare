import React from "react";
import { FileText, Image, ArrowRight, ShieldCheck } from "lucide-react";
import TransparentImage from "../components/TransparentImage";

export default function Home({ navigate }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-2 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] w-full overflow-hidden select-none">
      {/* Hero Section Container */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 w-full relative max-w-4xl">
        {/* Left Mascot (Desktop only) */}
        <div className="hidden md:block w-40 h-40 lg:w-48 lg:h-48 shrink-0 animate-bounce" style={{ animationDuration: '4s' }}>
          <TransparentImage 
            src="/src/assets/purple_mascot.jpg" 
            alt="VanishShare Purple Mascot Character representing secure self-destructing text sharing" 
            className="w-full h-full object-contain" 
          />
        </div>

        {/* Hero Content */}
        <div className="flex-grow text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-black uppercase tracking-wider shadow-sm animate-pulse">
            <ShieldCheck size={14} />
            Self-Destructing Shares
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 font-sans">
            VanishShare
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed font-bold">
            Paste text or upload an image, generate a short 4-character code, and share it. Exactly <span className="text-indigo-600 font-black">120 seconds</span> after creation, it vanishes forever.
          </p>
        </div>

        {/* Right Mascot (Desktop only) */}
        <div className="hidden md:block w-40 h-40 lg:w-48 lg:h-48 shrink-0 animate-bounce" style={{ animationDuration: '5s' }}>
          <TransparentImage 
            src="/src/assets/folder_mascot.jpg" 
            alt="VanishShare Yellow Folder Mascot Character representing temporary anonymous image hosting" 
            className="w-full h-full object-contain" 
          />
        </div>
      </div>

      {/* Action Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Share Text Card */}
        <div 
          onClick={() => navigate("/text")}
          className="glass-panel glass-panel-hover p-6 sm:p-8 rounded-[36px] cursor-pointer text-left group relative overflow-hidden flex justify-between items-center gap-4 min-h-[160px] transition-all hover:scale-[1.03] duration-300 shadow-sm"
        >
          <div className="flex-1 space-y-3">
            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shadow-inner">
              <FileText size={22} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
              Share Text Note
              <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300" />
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-bold max-w-[260px]">
              Paste passwords, OTPs, notes, or code snippets. Limit up to 5000 characters.
            </p>
          </div>
          <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 self-end -mb-4 -mr-2 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
            <TransparentImage 
              src="/src/assets/notebook_mascot.jpg" 
              alt="VanishShare Blue Notebook Character representing temporary text sharing" 
              className="w-full h-full object-contain" 
            />
          </div>
        </div>

        {/* Share Image Card */}
        <div 
          onClick={() => navigate("/image")}
          className="glass-panel glass-panel-hover p-6 sm:p-8 rounded-[36px] cursor-pointer text-left group relative overflow-hidden flex justify-between items-center gap-4 min-h-[160px] transition-all hover:scale-[1.03] duration-300 shadow-sm"
        >
          <div className="flex-1 space-y-3">
            <div className="w-11 h-11 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 shadow-inner">
              <Image size={22} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
              Share Image
              <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all duration-300" />
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-bold max-w-[260px]">
              Upload images securely. JPG, PNG, and WebP supported, up to 5MB file size.
            </p>
          </div>
          <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 self-end -mb-4 -mr-2 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <TransparentImage 
              src="/src/assets/pink_page_mascot.jpg" 
              alt="VanishShare Pink Page Character representing temporary anonymous image sharing" 
              className="w-full h-full object-contain" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Optimized card layout metrics for responsive viewport rendering
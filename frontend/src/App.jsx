import React, { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import CreateText from "./pages/CreateText";
import CreateImage from "./pages/CreateImage";
import Retrieve from "./pages/Retrieve";
import { ShieldCheck, Flame, Home as HomeIcon } from "lucide-react";

export default function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(window.location.pathname);
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  // Advanced Dynamic SEO: Updates title and meta description tags dynamically for crawl engines
  useEffect(() => {
    let title = "VanishShare — Self-Destructing Text & Image Sharing in 60 Seconds";
    let description = "VanishShare is a free, anonymous, and secure service to share text notes or images. Everything self-destructs exactly 60 seconds after creation.";
    
    switch (route) {
      case "/text":
        title = "Share Text Note Securely | VanishShare";
        description = "Create self-destructing text notes, passwords, and API keys. Safe, anonymous, and purged automatically after 60 seconds.";
        break;
      case "/image":
        title = "Share Image Securely | VanishShare";
        description = "Upload and share temporary images. Fully anonymous hosting that auto-deletes completely after 60 seconds.";
        break;
      case "/get":
        title = "Retrieve Shared Secret | VanishShare";
        description = "Enter your 6-digit code to decrypt and view the self-destructing secure note or image shared with you.";
        break;
      default:
        break;
    }
    
    document.title = title;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", description);
    }
  }, [route]);

  const navigate = (path, search = "") => {
    window.history.pushState({}, "", path + search);
    setRoute(path);
    setSearchParams(new URLSearchParams(search));
  };

  const renderPage = () => {
    switch (route) {
      case "/text":
        return <CreateText navigate={navigate} />;
      case "/image":
        return <CreateImage navigate={navigate} />;
      case "/get":
        return <Retrieve searchParams={searchParams} navigate={navigate} />;
      default:
        return <Home navigate={navigate} />;
    }
  };

  return (
    <div className={`relative min-h-screen bg-[#f8fafc] bg-grid-pattern text-slate-700 flex flex-col justify-between overflow-x-hidden font-sans ${route === "/" ? "h-screen overflow-hidden" : ""}`}>
      {/* Background Decorative Neon Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full filter blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-tl from-purple-500/5 to-transparent rounded-full filter blur-[120px]"></div>
      </div>

      {/* Navigation Header */}
      <header className="glass-panel border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <img 
              src="/favicon.svg" 
              alt="VanishShare Logo" 
              className="w-9 h-9 object-contain"
            />
            <span className="font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-xl select-none">
              VanishShare
            </span>
          </div>

          <nav className="flex items-center gap-4 text-xs sm:text-sm">
            <button
              onClick={() => navigate("/")}
              className={`hover:text-indigo-600 font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                route === "/" ? "text-indigo-600" : "text-slate-500"
              }`}
            >
              <HomeIcon size={14} />
              Home
            </button>
            <button
              onClick={() => navigate("/get")}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs sm:text-sm ${
                route === "/get" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                  : "border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white"
              }`}
            >
              Retrieve Code
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center py-6 sm:py-8">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-slate-50/50 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium">© {new Date().getFullYear()} VanishShare. Fully Anonymous. No persistent logs.</p>
          <div className="flex gap-4 font-semibold">
            <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-500" /> SSL Encrypted</span>
            <span className="flex items-center gap-1"><Flame size={14} className="text-orange-500" /> 60s Auto-Expiry</span>
          </div>
        </div>
      </footer>

      {/* Toast Manager */}
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#1e293b",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            borderRadius: "16px",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
          },
          success: {
            iconTheme: {
              primary: "#4f46e5",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
        }}
      />
    </div>
  );
}

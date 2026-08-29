import React, { useState } from "react";
import { supabase } from "../api/supabaseClient";
import CountdownTimer from "../components/CountdownTimer";
import Loader from "../components/Loader";
import TransparentImage from "../components/TransparentImage";
import toast from "react-hot-toast";
import { Copy, ArrowLeft, RefreshCw, Flame, Check, AlertCircle } from "lucide-react";

export default function CreateText({ navigate }) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState(null); // { code, expiresAt }
  const [copied, setCopied] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Generate unique code with collision checks directly on Supabase
  const getUniqueCode = async () => {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let code = "";
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 10) {
      code = "";
      for (let i = 0; i < 4; i++) {
        code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      }

      const { data, error } = await supabase
        .from("entries")
        .select("id")
        .eq("code", code)
        .maybeSingle();

      exists = !!data;
      attempts++;
    }

    if (attempts >= 10 && exists) {
      throw new Error("Could not generate a unique code. Please try again.");
    }

    return code;
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter some text content first.");
      return;
    }
    if (content.length > 5000) {
      toast.error("Content exceeds 5000 characters limit.");
      return;
    }

    setIsLoading(true);
    setIsExpired(false);
    try {
      const code = await getUniqueCode();
      const expiresAt = new Date(Date.now() + 120000); // 120s hardcoded expiry

      const { error } = await supabase.from("entries").insert([
        {
          code,
          type: "text",
          content: content.trim(),
          expires_at: expiresAt.toISOString(),
        },
      ]);

      if (error) throw error;

      setSuccessData({
        code,
        expiresAt: expiresAt.toISOString(),
      });
      toast.success("Destructible code generated!");
    } catch (error) {
      console.error("Error creating text share:", error);
      toast.error(error.message || "Failed to generate code.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setContent("");
    setSuccessData(null);
    setIsExpired(false);
  };

  // Render Loader
  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="glass-panel p-8 rounded-3xl shadow-lg border border-slate-200/60 animate-pulse">
          <Loader message="Securing text entry on Supabase..." />
        </div>
      </div>
    );
  }

  // Render Expired State
  if (successData && isExpired) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="glass-panel p-8 rounded-3xl shadow-lg border border-slate-200/60 space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto animate-bounce">
            <Flame size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Code Expired!</h2>
          <p className="text-slate-500 text-sm font-semibold leading-relaxed">
            The share code <span className="font-mono text-red-500 font-bold">{successData.code}</span> has expired and has been purged from Supabase servers.
          </p>
          <button
            onClick={resetForm}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
          >
            <RefreshCw size={16} />
            Create Another Share
          </button>
        </div>
      </div>
    );
  }

  // Render Success State
  if (successData) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-200/60 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
          
          <h2 className="text-2xl font-black text-slate-800 tracking-wide">Share Code Ready</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
            Share this code with your recipient. They can retrieve the text note at <span className="text-indigo-600 font-bold">/get</span>.
          </p>

          {/* Large Code Block */}
          <div className="relative group p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-all flex flex-col items-center justify-center shadow-inner">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 select-all">
              {successData.code}
            </span>
            <button
              onClick={copyToClipboard}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-indigo-600 rounded-xl text-xs font-bold tracking-wide border border-slate-200 transition-all shadow-sm cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "COPIED!" : "COPY CODE"}
            </button>
          </div>

          {/* Countdown Clock */}
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 py-3 px-4 flex items-center justify-center">
            <CountdownTimer 
              expiresAt={successData.expiresAt} 
              onExpire={() => setIsExpired(true)} 
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-all cursor-pointer"
            >
              Go Home
            </button>
            <button
              onClick={resetForm}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md cursor-pointer"
            >
              New Text Share
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Input Form State
  return (
    <div className="max-w-4xl mx-auto px-4 py-2 sm:py-3">
      {/* Back CTA */}
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-bold mb-3 transition-all cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div className="glass-panel p-5 sm:p-6 rounded-3xl shadow-lg border border-slate-200/60 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
        
        {/* Mascot Column (Desktop only) */}
        <div className="hidden md:flex flex-col items-center justify-center w-40 shrink-0">
          <div className="w-32 h-32 animate-bounce" style={{ animationDuration: '4s' }}>
            <TransparentImage 
              src="/src/assets/purple_mascot.jpg" 
              alt="Purple Mascot" 
              className="w-full h-full object-contain" 
            />
          </div>
          <p className="text-[9px] text-slate-400 font-bold text-center mt-1 uppercase tracking-widest max-w-[120px]">
            Your secrets are safe with me!
          </p>
        </div>

        {/* Form Column */}
        <div className="flex-grow space-y-4 w-full">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
              <Flame size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Create Self-Destructing Text Note</h1>
              <p className="text-xs text-slate-400 font-semibold">Any notes, secrets, credentials, or keys</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="relative">
              <textarea
                placeholder="Paste or write your secret here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
                className="w-full h-36 px-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-[20px] text-slate-800 outline-none transition-all resize-none text-sm font-semibold leading-relaxed placeholder-slate-400 shadow-sm"
              ></textarea>
              
              {/* Character Count */}
              <div className={`absolute bottom-3 right-4 text-xs font-semibold tracking-wider font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-500`}>
                {content.length}/5000
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-xs text-amber-800 font-medium">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Once generated, this data is saved directly on Supabase PostgreSQL. It will be completely removed exactly 120 seconds after creation. Anyone with the code can view it before it expires.
              </p>
            </div>

            <button
              type="submit"
              disabled={!content.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10 cursor-pointer text-sm sm:text-base"
            >
              Generate Destructible Code
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

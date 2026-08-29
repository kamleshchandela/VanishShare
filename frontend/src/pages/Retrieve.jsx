import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../api/supabaseClient";
import CodeInput from "../components/CodeInput";
import CountdownTimer from "../components/CountdownTimer";
import Loader from "../components/Loader";
import TransparentImage from "../components/TransparentImage";
import toast from "react-hot-toast";
import { ArrowLeft, Copy, Check, Download, Flame, EyeOff, FileText, Trash2, RefreshCw } from "lucide-react";

export default function Retrieve({ searchParams, navigate }) {
  const queryCode = searchParams.get("code") || "";
  
  const [code, setCode] = useState(queryCode);
  const [isLoading, setIsLoading] = useState(false);
  const [entry, setEntry] = useState(null); // { id, type, content, imageUrl, imagePath, expiresAt }
  const [isCopied, setIsCopied] = useState(false);
  const [isImageCopied, setIsImageCopied] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fetchedRef = useRef(false);

  const fetchEntry = async (lookupCode) => {
    const targetCode = lookupCode || code;
    if (!targetCode || targetCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setEntry(null);
    setIsExpired(false);

    try {
      // Direct REST query to Supabase table
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("code", targetCode.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setErrorMsg("Code not found or expired.");
        toast.error("Code not found or expired.");
        return;
      }

      // Check client-side expiration (lazy delete helper)
      const expiresAtDate = new Date(data.expires_at);
      if (expiresAtDate <= new Date()) {
        // Run silent lazy deletion
        await supabase.from("entries").delete().eq("id", data.id);
        setIsExpired(true);
        toast.error("This code has expired!");
        return;
      }

      setEntry({
        id: data.id,
        type: data.type,
        content: data.content,
        imageUrl: data.image_url,
        imagePath: data.image_path,
        expiresAt: data.expires_at,
      });
      toast.success("Secret decrypted successfully!");
    } catch (error) {
      console.error("Error retrieving entry:", error);
      setErrorMsg(error.message || "Failed to retrieve entry.");
      toast.error("Retrieval failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Run automatically if code URL search parameter exists (StrictMode safe)
  useEffect(() => {
    if (queryCode && queryCode.length === 6) {
      if (fetchedRef.current) return;
      fetchedRef.current = true;
      fetchEntry(queryCode);
    }
  }, [queryCode]);

  const copyText = () => {
    if (!entry || !entry.content) return;
    navigator.clipboard.writeText(entry.content);
    setIsCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const copyImage = async () => {
    if (!entry || !entry.imageUrl) return;
    setIsCopyingImage(true);
    try {
      const response = await fetch(entry.imageUrl);
      const blob = await response.blob();
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = URL.createObjectURL(blob);
      
      img.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(async (pngBlob) => {
            if (!pngBlob) {
              toast.error("Failed to copy image format.");
              setIsCopyingImage(false);
              return;
            }
            try {
              await navigator.clipboard.write([
                new ClipboardItem({
                  [pngBlob.type]: pngBlob
                })
              ]);
              setIsImageCopied(true);
              toast.success("Image copied to clipboard!");
              setTimeout(() => setIsImageCopied(false), 2000);
            } catch (err) {
              console.error("Clipboard write failed", err);
              toast.error("Failed to copy image. Try downloading instead.");
            } finally {
              setIsCopyingImage(false);
            }
          }, "image/png");
        } catch (err) {
          console.error("Canvas draw failed", err);
          toast.error("Failed to copy image.");
          setIsCopyingImage(false);
        }
      };
      
      img.onerror = () => {
        console.error("Image load failed");
        toast.error("Failed to load image for copying.");
        setIsCopyingImage(false);
      };
    } catch (err) {
      console.error("Failed to fetch image for copy", err);
      toast.error("Failed to fetch image.");
      setIsCopyingImage(false);
    }
  };

  const downloadImage = async () => {
    if (!entry || !entry.imageUrl) return;
    try {
      const response = await fetch(entry.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VanishShare-${queryCode || code}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch (err) {
      console.error("Direct download failed, opening in new tab", err);
      window.open(entry.imageUrl, "_blank");
    }
  };

  const handleBurn = async () => {
    if (!entry) return;

    setIsLoading(true);
    try {
      // 1. If it's an image, delete it from storage bucket first via Storage API
      if (entry.type === "image" && entry.imagePath) {
        const { error: storageError } = await supabase.storage
          .from("shares")
          .remove([entry.imagePath]);
        if (storageError) {
          console.warn("Storage deletion failed or file already deleted:", storageError);
        }
      }

      // 2. Delete the entry row from public.entries table
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", entry.id);

      if (error) throw error;

      toast.success("Content burned and destroyed forever!");
      setEntry(null);
      setErrorMsg("This entry was voluntarily burned and destroyed by the reader.");
    } catch (err) {
      console.error("Error burning entry:", err);
      toast.error("Failed to burn the entry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (errorMsg) setErrorMsg("");
  };

  const handleOnComplete = (completedCode) => {
    fetchEntry(completedCode);
  };

  const handleReset = () => {
    setEntry(null);
    setCode("");
    setErrorMsg("");
    setIsExpired(false);
    fetchedRef.current = false;
    navigate("/get");
  };

  // Render Loader
  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="glass-panel p-8 rounded-3xl shadow-lg border border-slate-200/60 animate-pulse">
          <Loader message="Decrypting secure data pack..." />
        </div>
      </div>
    );
  }

  // Render Expired State / 404 (Automatic or Manual)
  if (isExpired || errorMsg) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="glass-panel p-8 rounded-3xl shadow-lg border border-slate-200/60 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto animate-pulse">
            <EyeOff size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Expired or Burned!</h2>
          <p className="text-slate-500 text-sm font-semibold leading-relaxed">
            {errorMsg || "This secret code has expired and its contents have been completely purged from database servers."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-semibold transition-all cursor-pointer"
            >
              Go Home
            </button>
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md cursor-pointer"
            >
              Try Another Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Content Decrypted Screen
  if (entry) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-200/60 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>

          {/* Header Info */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <FileText size={16} />
              </div>
              <span className="text-sm font-black text-slate-800 tracking-wider">
                DECRYPTED {entry.type.toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-bold font-mono">
              CODE: {queryCode || code}
            </span>
          </div>

          {/* Countdown Clock and Hourglass Mascot */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-slate-50/50 rounded-3xl border border-slate-100 p-4">
            <div className="w-16 h-16 shrink-0 animate-pulse">
              <TransparentImage 
                src="/src/assets/hourglass.jpg" 
                alt="Hourglass" 
                className="w-full h-full object-contain" 
              />
            </div>
            <CountdownTimer 
              expiresAt={entry.expiresAt} 
              onExpire={() => setIsExpired(true)} 
            />
          </div>

          {/* Content Display (Text vs Image) */}
          {entry.type === "text" ? (
            <div className="relative group bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-inner">
              <pre className="text-slate-800 text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap font-sans select-all max-h-96 font-semibold">
                {entry.content}
              </pre>
              <button
                onClick={copyText}
                className="absolute top-3.5 right-3.5 p-2 bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm cursor-pointer"
              >
                {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="max-h-96 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                <img
                  src={entry.imageUrl}
                  alt="Decrypted Share"
                  className="max-h-96 object-contain"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-3 w-full">
                <button
                  onClick={downloadImage}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                >
                  <Download size={16} />
                  Download Image
                </button>
                <button
                  onClick={copyImage}
                  disabled={isCopyingImage}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-indigo-600 hover:text-indigo-500 rounded-xl text-sm font-bold tracking-wide border border-slate-200 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCopyingImage ? (
                    <RefreshCw size={16} className="animate-spin text-indigo-600" />
                  ) : isImageCopied ? (
                    <Check size={16} className="text-emerald-400" />
                  ) : (
                    <Copy size={16} />
                  )}
                  {isCopyingImage ? "Copying..." : isImageCopied ? "Image Copied!" : "Copy Image"}
                </button>
              </div>
            </div>
          )}

          {/* Expiration warning and immediate burn option */}
          <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold flex items-center gap-1">
              <Flame size={12} className="text-red-500" />
              Will auto-delete after remaining countdown reaches zero.
            </p>
            <button
              onClick={handleBurn}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 border border-red-200/60 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100/50 transition-all shadow-sm cursor-pointer"
            >
              <Trash2 size={13} />
              Burn (Delete Now)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Input Form Screen
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-bold mb-6 transition-all cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-200/60 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>

        {/* Mascot Column */}
        <div className="w-28 h-28 sm:w-36 sm:h-36 shrink-0 animate-pulse">
          <TransparentImage 
            src="/src/assets/raccoon_detective.jpg" 
            alt="VanishShare Raccoon Detective Mascot character searching for secure decryption codes" 
            className="w-full h-full object-contain" 
          />
        </div>

        {/* Form Column */}
        <div className="flex-grow space-y-5 text-center md:text-left w-full">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-slate-800">Retrieve Shared Secret</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
              Enter the 6-character code below to view and decrypt the self-destructing text or image note.
            </p>
          </div>

          {/* 6 box code inputs */}
          <div className="flex justify-center md:justify-start">
            <CodeInput onChange={handleCodeChange} onComplete={handleOnComplete} />
          </div>

          <button
            onClick={() => fetchEntry()}
            disabled={code.length !== 6}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10 cursor-pointer text-sm sm:text-base"
          >
            Decrypt & View Content
          </button>
        </div>
      </div>
    </div>
  );
}

// Configured decryption clock layout alignments
import React, { useState, useRef } from "react";
import { supabase } from "../api/supabaseClient";
import CountdownTimer from "../components/CountdownTimer";
import Loader from "../components/Loader";
import TransparentImage from "../components/TransparentImage";
import toast from "react-hot-toast";
import { Upload, X, Copy, ArrowLeft, RefreshCw, Flame, Check, AlertCircle } from "lucide-react";

export default function CreateImage({ navigate }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState(null); // { code, imageUrl, expiresAt }
  const [copied, setCopied] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const fileInputRef = useRef(null);

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

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    // Check size limit: 5MB
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Max limit is 5MB.");
      return;
    }

    // Check mime types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Unsupported file format. Please upload JPG, PNG or WebP.");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleFileChange = (e) => {
    validateAndSetFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    validateAndSetFile(e.dataTransfer.files[0]);
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please choose an image first.");
      return;
    }

    setIsLoading(true);
    setIsExpired(false);
    try {
      const code = await getUniqueCode();
      const fileExt = file.name.split(".").pop();
      const filePath = `${code}.${fileExt}`;

      // 1. Upload to Supabase Storage Bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("shares")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Fetch the Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("shares")
        .getPublicUrl(filePath);

      const expiresAt = new Date(Date.now() + 120000); // 120s Expiry

      // 3. Save entry row on DB
      const { error: dbError } = await supabase.from("entries").insert([
        {
          code,
          type: "image",
          image_url: publicUrl,
          image_path: filePath, // Storing filePath so trigger can automatically remove it from storage bucket
          expires_at: expiresAt.toISOString(),
        },
      ]);

      if (dbError) {
        // Cleanup storage file on database insert failure
        await supabase.storage.from("shares").remove([filePath]);
        throw dbError;
      }

      setSuccessData({
        code,
        imageUrl: publicUrl,
        expiresAt: expiresAt.toISOString(),
      });
      toast.success("Image secured and code generated!");
    } catch (error) {
      console.error("Error creating image share:", error);
      toast.error(error.message || "Failed to upload image.");
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
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSuccessData(null);
    setIsExpired(false);
  };

  // Render Loader
  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="glass-panel p-8 rounded-3xl shadow-lg border border-slate-200/60 animate-pulse">
          <Loader message="Uploading image to Supabase storage..." />
        </div>
      </div>
    );
  }

  // Render Expiry State
  if (successData && isExpired) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="glass-panel p-8 rounded-3xl shadow-lg border border-slate-200/60 space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto animate-bounce">
            <Flame size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Image Expired!</h2>
          <p className="text-slate-500 text-sm font-semibold leading-relaxed">
            The code <span className="font-mono text-red-500 font-bold">{successData.code}</span> is dead. The image has been purged from Supabase Storage and database indexes.
          </p>
          <button
            onClick={resetForm}
            className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-sm"
          >
            <RefreshCw size={16} />
            Upload New Image
          </button>
        </div>
      </div>
    );
  }

  // Render Success Screen
  if (successData) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center">
        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-200/60 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>

          <h2 className="text-2xl font-black text-slate-800 tracking-wide">Image Code Generated</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
            Send this code to your recipient. They can fetch and download the image at <span className="text-indigo-600 font-bold">/get</span>.
          </p>

          {/* Code block */}
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

          {/* Circular Countdown Clock */}
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
              New Image Share
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Selection & Upload Zone Screen
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
          <div className="w-32 h-32 animate-bounce" style={{ animationDuration: '5s' }}>
            <TransparentImage 
              src="/src/assets/folder_mascot.jpg" 
              alt="Folder Mascot" 
              className="w-full h-full object-contain" 
            />
          </div>
          <p className="text-[9px] text-slate-400 font-bold text-center mt-1 uppercase tracking-widest max-w-[120px]">
            Safekeeping your visual files!
          </p>
        </div>

        {/* Form Column */}
        <div className="flex-grow space-y-4 w-full">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
              <Upload size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Create Self-Destructing Image Share</h1>
              <p className="text-xs text-slate-400 font-semibold">JPG, PNG, or WebP up to 5MB size limit</p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {/* Drag & Drop Zone */}
            {!previewUrl ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400/60 rounded-3xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-indigo-50/[0.03] transition-all flex flex-col items-center justify-center space-y-3 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-200/80 group-hover:text-indigo-600 group-hover:border-indigo-500/30 shadow-sm transition-all duration-300">
                  <Upload size={18} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-slate-700">
                    Drag & drop your image, or <span className="text-indigo-600 hover:text-indigo-500">browse</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Supports JPG, JPEG, PNG, WEBP (Max 5MB)</p>
                </div>
              </div>
            ) : (
              /* Upload preview state */
              <div className="relative rounded-3xl border border-slate-200 bg-slate-50/50 p-3 flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 shadow-sm transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
                
                <div className="max-h-52 w-full overflow-hidden rounded-2xl flex items-center justify-center border border-slate-200 bg-black/5">
                  <img
                    src={previewUrl}
                    alt="Upload Preview"
                    className="max-h-52 object-contain"
                  />
                </div>

                <div className="mt-2 text-center">
                  <p className="text-xs font-bold text-slate-700 truncate max-w-xs">{file.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-xs text-amber-800 font-medium">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Once uploaded, the image gets stored directly in your Supabase Storage. Exactly 120 seconds after upload, SQL triggers automatically delete the image from storage when database schedules delete the entry.
              </p>
            </div>

            <button
              type="submit"
              disabled={!file}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10 cursor-pointer text-sm sm:text-base"
            >
              Upload & Secure Image
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

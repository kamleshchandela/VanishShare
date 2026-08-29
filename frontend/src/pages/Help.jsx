import React, { useState } from "react";
import { ArrowLeft, BookOpen, ChevronRight, ChevronLeft, ShieldAlert } from "lucide-react";

import helpHome from "../assets/help_home.png";
import helpCreateText from "../assets/help_create_text.png";
import helpSuccess from "../assets/help_success.png";
import helpCreateImage from "../assets/help_create_image.png";
import helpRetrieve from "../assets/help_retrieve.png";

export default function Help({ navigate }) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "Step 1: Choose Your Share Type",
      description: "Select whether you want to share a secure Text Note (like passwords, keys, and credentials) or an Image (JPG, PNG, WebP) from the clean, zero-scroll dashboard.",
      image: helpHome,
      badge: "Dashboard"
    },
    {
      title: "Step 2: Enter Text note",
      description: "Write or paste your credentials into the input card. Spacing, padding, and layout are designed for speed and comfort.",
      image: helpCreateText,
      badge: "Create Text Note"
    },
    {
      title: "Step 3: Generate Code & Share",
      description: "Generate your unique 4-character code. Copy it using the 'Copy Code' helper. The 120-second countdown timer begins immediately.",
      image: helpSuccess,
      badge: "Share Code Ready"
    },
    {
      title: "Step 4: Upload Image Securely",
      description: "Drag & drop or browse images up to 5MB. Previews are rendered in a clean container with auto-purging alerts.",
      image: helpCreateImage,
      badge: "Upload Image"
    },
    {
      title: "Step 5: Decrypt & Self-Destruct",
      description: "Enter the 4-character code on Retrieve page to decrypt the contents. Download or copy images. Click 'Burn' to delete immediately or let it auto-purge.",
      image: helpRetrieve,
      badge: "Decrypt & Burn"
    }
  ];

  const handleNext = () => {
    setActiveStep((prev) => (prev === steps.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setActiveStep((prev) => (prev === 0 ? steps.length - 1 : prev - 1));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 w-full flex flex-col justify-center select-none">
      {/* Back to Dashboard CTA */}
      <button
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-bold mb-4 transition-all cursor-pointer self-start"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div className="glass-panel p-5 sm:p-7 rounded-[32px] shadow-lg border border-slate-200/60 relative overflow-hidden flex flex-col gap-5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>

        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
              <BookOpen size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">User Help & Guide</h1>
              <p className="text-xs text-slate-400 font-semibold">How to use VanishShare self-destructing transfers</p>
            </div>
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black uppercase tracking-wider text-indigo-600">
            {steps[activeStep].badge}
          </span>
        </div>

        {/* Large Layout View */}
        <div className="space-y-4">
          {/* Step description */}
          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <h2 className="text-lg font-extrabold text-slate-800 tracking-tight leading-snug">
              {steps[activeStep].title}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed">
              {steps[activeStep].description}
            </p>
          </div>

          {/* Stepper Navigation Controls */}
          <div className="flex items-center justify-between gap-3 px-1 py-1">
            <button
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm cursor-pointer transition-all text-xs font-bold flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              PREVIOUS
            </button>
            
            <div className="flex gap-2 justify-center">
              {steps.map((_, i) => (
                <span
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    activeStep === i ? "w-6 bg-indigo-600" : "w-2 bg-slate-200 hover:bg-slate-300"
                  }`}
                ></span>
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm cursor-pointer transition-all text-xs font-bold flex items-center gap-1"
            >
              NEXT
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Interactive Screen Preview Container (Magnified image layout) */}
          <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100/50 shadow-inner flex items-center justify-center p-3 group max-h-[380px] sm:max-h-[440px]">
            {/* The global CSS locks pointer-events on img tags to prevent selection/dragging,
                which fits perfectly with our security rules! */}
            <img
              src={steps[activeStep].image}
              alt={steps[activeStep].title}
              className="max-h-[350px] sm:max-h-[410px] w-full object-contain rounded-lg border border-slate-200/40 shadow-sm transition-all duration-300 group-hover:scale-[1.01]"
            />
          </div>
        </div>

        {/* Security Warning Tip */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/60 text-[11px] sm:text-xs text-indigo-900 font-semibold">
          <ShieldAlert size={16} className="text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Note: All secrets are fully anonymous. Supabase tables delete text records and storage buckets wipe uploaded images exactly 120 seconds after creation, or instantly if voluntarily burned.
          </p>
        </div>
      </div>
    </div>
  );
}

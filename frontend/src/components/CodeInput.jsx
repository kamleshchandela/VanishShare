import React, { useRef, useState, useEffect } from "react";

export default function CodeInput({ onChange, onComplete }) {
  const [code, setCode] = useState(Array(6).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto-focus the first input digit box on component mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (val, index) => {
    const cleanVal = val.toUpperCase().replace(/[^A-Z2-9]/g, ""); // Allow only clean alphabet characters (excluding I, O, L, 0, 1 as per PRD)
    
    if (cleanVal.length === 0 && val.length > 0) return; // Disallowed char entered

    const newCode = [...code];
    newCode[index] = cleanVal;
    setCode(newCode);

    const compiledCode = newCode.join("");
    onChange(compiledCode);

    // Auto-focus next field
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    if (compiledCode.length === 6 && onComplete) {
      onComplete(compiledCode);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().toUpperCase();
    
    // Filter characters to match custom nanoid alphabet
    const filteredData = pastedData.replace(/[^A-Z2-9]/g, "").slice(0, 6);
    
    if (filteredData.length === 0) return;

    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = filteredData[i] || "";
    }
    setCode(newCode);
    
    const compiledCode = newCode.join("");
    onChange(compiledCode);

    // Focus last box filled or the next empty box
    const focusIndex = Math.min(filteredData.length, 5);
    inputRefs.current[focusIndex].focus();

    if (compiledCode.length === 6 && onComplete) {
      onComplete(compiledCode);
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center py-2">
      {code.map((char, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          ref={(el) => (inputRefs.current[index] = el)}
          value={char}
          onChange={(e) => handleChange(e.target.value, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-11 h-14 sm:w-14 sm:h-16 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-center text-2xl font-black uppercase text-indigo-600 outline-none transition-all duration-200 shadow-sm"
        />
      ))}
    </div>
  );
}

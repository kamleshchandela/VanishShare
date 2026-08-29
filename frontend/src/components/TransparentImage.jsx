import React, { useState, useEffect } from "react";

export default function TransparentImage({ src, alt, className, style }) {
  const [transparentSrc, setTransparentSrc] = useState(src);

  useEffect(() => {
    if (!src) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Loop through all pixels and make bright pixels transparent
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          
          // If the pixel is close to white/light grey, make it transparent
          if (r > 240 && g > 240 && b > 240) {
            data[i+3] = 0; // Alpha = 0
          } else if (r > 220 && g > 220 && b > 220) {
            // Smooth blend at edges
            const maxVal = Math.max(r, g, b);
            const alpha = Math.round(((240 - maxVal) / 20) * 255);
            data[i+3] = Math.min(data[i+3], alpha);
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        setTransparentSrc(canvas.toDataURL("image/png"));
      } catch (e) {
        console.error("Failed to make background transparent", e);
        setTransparentSrc(src);
      }
    };
    img.onerror = () => {
      setTransparentSrc(src);
    };
  }, [src]);

  return <img src={transparentSrc} alt={alt} className={className} style={style} />;
}

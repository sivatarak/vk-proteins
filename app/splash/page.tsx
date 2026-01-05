"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SplashScreen() {
  const router = useRouter();
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Pre-fetch products data in background (no waiting for it)
    fetch("/api/products", {
      cache: 'force-cache',
      headers: {
        'Cache-Control': 'max-age=30'
      }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        localStorage.setItem("cachedProducts", JSON.stringify(data));
      })
      .catch(console.error);

    // Fixed minimum splash duration: 4 seconds (feel free to adjust)
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 4000);

    // Redirect after animation completes
    if (animationComplete) {
      router.push("/user");
    }

    return () => clearTimeout(timer);
  }, [animationComplete, router]);

  return (
       <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-400">

      {/* Moving Shine Effect (properly implemented) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] animate-[shine_4s_ease-in-out_infinite]" />
      </div>

      {/* LOGO + TEXT with enhanced animations */}
      <div className="flex flex-col items-center">
        {/* Logo with scale + fade in */}
        <div className="relative w-[300px] sm:w-[340px] aspect-square animate-[fadeIn_1.2s_ease-out]">
          <Image
            src="/VK_proteins.png"
            alt="VK Proteins"
            fill
            priority
            className="object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
          />
        </div>




        {/* Subtitle fade in */}
        <p className="mt-4 text-white/90 text-lg sm:text-xl tracking-wide animate-fadeIn delay-1500">
          Freshness Delivered Daily
        </p>

        {/* Optional subtle loading dots */}
        <div className="mt-12 flex gap-3 animate-fadeIn delay-2000">
          <div className="w-3 h-3 bg-white/60 rounded-full animate-[bounce_1.4s_ease-in-out_infinite]" />
          <div className="w-3 h-3 bg-white/60 rounded-full animate-[bounce_1.4s_ease-in-out_0.2s_infinite]" />
          <div className="w-3 h-3 bg-white/60 rounded-full animate-[bounce_1.4s_ease-in-out_0.4s_infinite]" />
        </div>
      </div>

      {/* Bottom fade overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
}
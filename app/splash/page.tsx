"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/user"); // Auto move to user home
    }, 1800);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-400">

      {/* SHINE EFFECT */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="shine"></div>
      </div>

      {/* LOGO + TEXT */}
      <div className="flex flex-col items-center animate-fadeIn">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48">
          <Image
            src="/Vk_protein_logo.jpg"
            alt="VK Proteins"
            fill
            className="object-cover rounded-3xl shadow-2xl"
            priority
          />
        </div>

        <h1 className="mt-6 text-white text-3xl sm:text-4xl font-extrabold tracking-wide drop-shadow-lg">
          VK Proteins
        </h1>

        <p className="mt-2 text-white/90 text-sm tracking-wide fadeIn2">
          Freshness Delivered Daily
        </p>
      </div>

      {/* Bottom subtle fade overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
    </div>
  );
}

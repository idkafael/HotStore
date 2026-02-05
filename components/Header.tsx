"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Header() {
  const [logoExists, setLogoExists] = useState(false);

  useEffect(() => {
    // Verificar se o logo existe usando HTMLImageElement nativo
    // Silenciosamente verificar sem gerar erro no console
    const img = document.createElement('img');
    img.onload = () => setLogoExists(true);
    img.onerror = () => {
      setLogoExists(false);
      // Não logar erro - logo é opcional
    };
    img.src = "/logo.png";
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 w-full bg-black border-b border-dark-border z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link
            href="/liked"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Liked
          </Link>
        </nav>

        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3"
        >
          {logoExists && (
            <Image
              src="/logo.png"
              alt="HotStore Logo"
              width={60}
              height={60}
              className="h-10 md:h-12 w-auto object-contain"
              priority
            />
          )}
          <h1 className="text-xl md:text-2xl font-bold text-purple-primary">
            HotStore Modelos
          </h1>
        </Link>

        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>
      </div>
    </header>
  );
}

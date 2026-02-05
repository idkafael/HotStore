"use client";

import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 w-full bg-black/95 backdrop-blur-sm border-b border-dark-border z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center relative">
          {/* Logo e Título Centralizado */}
          <Link
            href="/"
            className="flex items-center gap-3 justify-center"
          >
            <Image
              src="/logo.png"
              alt="HotStore Logo"
              width={40}
              height={40}
              className="h-10 w-auto object-contain"
              priority
              onError={(e) => {
                // Esconder logo se não existir
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <h1 className="text-xl md:text-2xl font-bold text-purple-primary whitespace-nowrap">
              HotStore Modelos
            </h1>
          </Link>

          {/* Navegação à Esquerda */}
          <nav className="absolute left-0 flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Home
            </Link>
            <Link
              href="/liked"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Liked
            </Link>
          </nav>

          {/* Ícone à Direita */}
          <div className="absolute right-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}

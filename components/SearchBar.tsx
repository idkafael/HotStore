"use client";

import { useState, useRef, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onNacionalidadeChange: (nacionalidade: string) => void;
  onCaracteristicaChange: (caracteristica: string) => void;
}

export default function SearchBar({
  onSearch,
  onNacionalidadeChange,
  onCaracteristicaChange,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [nacionalidade, setNacionalidade] = useState("all");
  const [caracteristica, setCaracteristica] = useState("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFiltersOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleNacionalidadeChange = (value: string) => {
    setNacionalidade(value);
    onNacionalidadeChange(value);
  };

  const handleCaracteristicaChange = (value: string) => {
    setCaracteristica(value);
    onCaracteristicaChange(value);
  };

  const getFilterText = () => {
    const filters = [];
    if (nacionalidade !== "all") filters.push("Nacionalidade");
    if (caracteristica !== "all") filters.push("Caracteristica");
    return filters.length > 0 ? filters.join(", ") : "Todos os Filtros";
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 bg-dark-card border border-dark-border rounded px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-primary"
        />
        <button
          onClick={handleSearch}
          className="bg-purple-primary hover:bg-purple-secondary px-6 py-2 rounded flex items-center gap-2 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full bg-dark-card border border-dark-border rounded px-4 py-2 text-white focus:outline-none focus:border-purple-primary flex items-center justify-between cursor-pointer hover:border-purple-primary/50 transition-colors"
        >
          <span>{getFilterText()}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-5 h-5 transition-transform ${isFiltersOpen ? "rotate-180" : ""}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

        {isFiltersOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-dark-card border border-dark-border rounded px-4 py-3 space-y-4 z-50">
            <div>
              <p className="text-white font-medium mb-2">Nacionalidade</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={nacionalidade === "latina"}
                    onChange={() => handleNacionalidadeChange(nacionalidade === "latina" ? "all" : "latina")}
                    className="w-4 h-4 rounded border-dark-border bg-dark-card text-purple-primary focus:ring-purple-primary focus:ring-2"
                  />
                  <span>Latina</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={nacionalidade === "asiatica"}
                    onChange={() => handleNacionalidadeChange(nacionalidade === "asiatica" ? "all" : "asiatica")}
                    className="w-4 h-4 rounded border-dark-border bg-dark-card text-purple-primary focus:ring-purple-primary focus:ring-2"
                  />
                  <span>Asiatica</span>
                </label>
              </div>
            </div>

            <div>
              <p className="text-white font-medium mb-2">Caracteristica</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={caracteristica === "loira"}
                    onChange={() => handleCaracteristicaChange(caracteristica === "loira" ? "all" : "loira")}
                    className="w-4 h-4 rounded border-dark-border bg-dark-card text-purple-primary focus:ring-purple-primary focus:ring-2"
                  />
                  <span>Loira</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={caracteristica === "morena"}
                    onChange={() => handleCaracteristicaChange(caracteristica === "morena" ? "all" : "morena")}
                    className="w-4 h-4 rounded border-dark-border bg-dark-card text-purple-primary focus:ring-purple-primary focus:ring-2"
                  />
                  <span>Morena</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={caracteristica === "preta"}
                    onChange={() => handleCaracteristicaChange(caracteristica === "preta" ? "all" : "preta")}
                    className="w-4 h-4 rounded border-dark-border bg-dark-card text-purple-primary focus:ring-purple-primary focus:ring-2"
                  />
                  <span>Preta</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={caracteristica === "ruiva"}
                    onChange={() => handleCaracteristicaChange(caracteristica === "ruiva" ? "all" : "ruiva")}
                    className="w-4 h-4 rounded border-dark-border bg-dark-card text-purple-primary focus:ring-purple-primary focus:ring-2"
                  />
                  <span>Ruiva</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={caracteristica === "egirl"}
                    onChange={() => handleCaracteristicaChange(caracteristica === "egirl" ? "all" : "egirl")}
                    className="w-4 h-4 rounded border-dark-border bg-dark-card text-purple-primary focus:ring-purple-primary focus:ring-2"
                  />
                  <span>Egirl</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={caracteristica === "coroa"}
                    onChange={() => handleCaracteristicaChange(caracteristica === "coroa" ? "all" : "coroa")}
                    className="w-4 h-4 rounded border-dark-border bg-dark-card text-purple-primary focus:ring-purple-primary focus:ring-2"
                  />
                  <span>Coroa</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

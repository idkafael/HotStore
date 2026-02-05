"use client";

import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import ModelCard from "@/components/ModelCard";
import { Model } from "@/types/model";
import modelsData from "@/data/models.json";

export default function Home() {
  const [models, setModels] = useState<Model[]>(modelsData as Model[]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNacionalidade, setSelectedNacionalidade] = useState("all");
  const [selectedCaracteristica, setSelectedCaracteristica] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Carregar modelos da API
  const loadModels = async () => {
    try {
      const response = await fetch("/api/models");
      if (response.ok) {
        const data = await response.json();
        // Só atualizar se os dados mudaram
        setModels((prevModels) => {
          if (JSON.stringify(prevModels) !== JSON.stringify(data)) {
            return data;
          }
          return prevModels;
        });
      }
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
    }
  };

  // Carregar modelos ao montar o componente
  useEffect(() => {
    loadModels();
  }, []);

  // Recarregar modelos a cada 10 segundos (para pegar novos modelos adicionados)
  useEffect(() => {
    const interval = setInterval(() => {
      loadModels();
    }, 10000); // Aumentado para 10 segundos para reduzir re-renderizações

    return () => clearInterval(interval);
  }, []);

  const filteredModels = useMemo(() => {
    const filtered = models.filter((model) => {
      const matchesSearch =
        searchQuery === "" ||
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesNacionalidade =
        selectedNacionalidade === "all" || 
        model.nacionalidade?.toLowerCase() === selectedNacionalidade.toLowerCase() ||
        model.tags.some((tag) => 
          tag.toLowerCase() === selectedNacionalidade.toLowerCase() ||
          (selectedNacionalidade === "latina" && tag.toLowerCase() === "latina") ||
          (selectedNacionalidade === "asiatica" && tag.toLowerCase() === "asiatica")
        );

      const matchesCaracteristica =
        selectedCaracteristica === "all" || 
        model.caracteristica?.toLowerCase() === selectedCaracteristica.toLowerCase() ||
        model.tags.some((tag) => {
          const tagLower = tag.toLowerCase();
          const filterLower = selectedCaracteristica.toLowerCase();
          return tagLower === filterLower ||
            (filterLower === "loira" && tagLower === "loira") ||
            (filterLower === "morena" && tagLower === "morena") ||
            (filterLower === "preta" && tagLower === "preta") ||
            (filterLower === "ruiva" && tagLower === "ruiva") ||
            (filterLower === "egirl" && tagLower === "egirl") ||
            (filterLower === "coroa" && tagLower === "coroa");
        });

      return matchesSearch && matchesNacionalidade && matchesCaracteristica;
    });
    return filtered;
  }, [models, searchQuery, selectedNacionalidade, selectedCaracteristica]);

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="container mx-auto px-4 py-8 pt-28">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Bem Vindos a Hot Store Modelos
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 order-2 lg:order-1">
            {isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Carregando modelos...</p>
              </div>
            )}
            
            {!isLoading && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filteredModels.map((model) => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </div>

                {filteredModels.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">
                      Nenhum modelo encontrado.
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Total de modelos: {models.length}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <aside className="w-full lg:w-80 order-1 lg:order-2">
            <div className="sticky top-20">
              <SearchBar
                onSearch={setSearchQuery}
                onNacionalidadeChange={setSelectedNacionalidade}
                onCaracteristicaChange={setSelectedCaracteristica}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

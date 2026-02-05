"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ModelCard from "@/components/ModelCard";
import { Model } from "@/types/model";

export default function LikedPage() {
  const [likedModels, setLikedModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar modelos curtidos do localStorage
    const likedIds = JSON.parse(localStorage.getItem("likedModels") || "[]");
    
    // Carregar todos os modelos e filtrar os curtidos
    fetch("/api/models")
      .then((res) => res.json())
      .then((allModels: Model[]) => {
        const liked = allModels.filter((model) => likedIds.includes(model.id));
        setLikedModels(liked);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Modelos Curtidos
          </h1>
          <p className="text-gray-400">
            {likedModels.length} {likedModels.length === 1 ? "modelo" : "modelos"} curtido{likedModels.length !== 1 ? "s" : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Carregando...</p>
          </div>
        ) : likedModels.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              Você ainda não curtiu nenhum modelo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {likedModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

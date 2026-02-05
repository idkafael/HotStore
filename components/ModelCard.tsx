"use client";

import { useState } from "react";
import ImageCarousel from "./ImageCarousel";
import TagBadge from "./TagBadge";
import PaymentModal from "./PaymentModal";
import { Model } from "@/types/model";

interface ModelCardProps {
  model: Model;
}

export default function ModelCard({ model }: ModelCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden hover:border-purple-primary/50 transition-colors">
      <div className="relative w-full" style={{ position: 'relative', width: '100%' }}>
        <ImageCarousel images={model.images} modelName={model.name} />

        <div className="absolute top-2 left-2 z-20">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-sm p-2 rounded-full transition-colors"
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={isFavorite ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.312-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
        </div>

        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={() => setIsAdded(!isAdded)}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-sm p-2 rounded-full transition-colors"
            aria-label={isAdded ? "Remover" : "Adicionar"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={isAdded ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">{model.name}</h3>
          
          {/* Quantidade de Fotos e Vídeos */}
          {(model.quantidadeFotos !== undefined || model.quantidadeVideos !== undefined) && (
            <div className="flex gap-4 text-sm text-gray-300 mb-2">
              {model.quantidadeFotos !== undefined && (
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                  {model.quantidadeFotos} {model.quantidadeFotos === 1 ? "Foto" : "Fotos"}
                </span>
              )}
              {model.quantidadeVideos !== undefined && (
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  {model.quantidadeVideos} {model.quantidadeVideos === 1 ? "Vídeo" : "Vídeos"}
                </span>
              )}
            </div>
          )}
          
          {model.tags && model.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {model.tags.map((tag, index) => (
                <TagBadge key={index} tag={tag} />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="w-full bg-purple-primary hover:bg-purple-secondary text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Eu Quero
        </button>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        model={model}
      />
    </div>
  );
}

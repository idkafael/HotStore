"use client";

import { useState, useEffect } from "react";
import { Model } from "@/types/model";
import Image from "next/image";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: Model;
  price?: number;
}

export default function PaymentModal({ isOpen, onClose, model, price = 1.00 }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeLogoRemover, setIncludeLogoRemover] = useState(false);
  const logoRemoverPrice = 9.90;

  // Resetar estado ao abrir/fechar modal
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIncludeLogoRemover(false);
      setPaymentMethod("pix");
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentMethod !== "pix") {
      setError("Por enquanto, apenas PIX está disponível");
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Integrar com SyncPay
      setError("Integração com SyncPay em desenvolvimento");
    } catch (err: any) {
      setError(err.message || "Erro ao processar pagamento");
      console.error("Erro ao criar pagamento:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-lg w-full max-w-md p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Pagamento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">
              Método de Pagamento
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-black border border-dark-border rounded px-4 py-2 text-white"
              disabled={isProcessing}
            >
              <option value="pix">PIX</option>
            </select>
          </div>

          <div className="bg-purple-primary/10 border border-purple-primary/30 rounded p-3 text-xs text-gray-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeLogoRemover}
                onChange={(e) => setIncludeLogoRemover(e.target.checked)}
                className="w-4 h-4"
              />
              <span>
                Cortar Logo do Onlyfans (+ R$ {logoRemoverPrice.toFixed(2).replace(".", ",")})
              </span>
            </label>
          </div>

          <div className="text-center">
            <p className="text-white font-medium mb-2">Total</p>
            <p className="text-2xl text-purple-primary font-bold">
              R$ {(price + (includeLogoRemover ? logoRemoverPrice : 0)).toFixed(2).replace(".", ",")}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-purple-primary hover:bg-purple-primary/80 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processando..." : "Gerar Pagamento"}
          </button>
        </form>
      </div>
    </div>
  );
}

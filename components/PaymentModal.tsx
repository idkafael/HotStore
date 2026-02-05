"use client";

import { useState, useEffect } from "react";
import { Model } from "@/types/model";
import { CreatePixResponse } from "@/types/pix";
import Image from "next/image";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: Model;
  price?: number; // Preço em reais (opcional, pode vir do modelo ou ser fixo)
}

export default function PaymentModal({ isOpen, onClose, model, price = 1.00 }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<CreatePixResponse | null>(null);
  const [pixStatus, setPixStatus] = useState<"created" | "paid" | "expired" | "canceled">("created");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [includeLogoRemover, setIncludeLogoRemover] = useState(false);
  const logoRemoverPrice = 9.90;

  // Resetar estado ao abrir/fechar modal
  useEffect(() => {
    if (!isOpen) {
      setPixData(null);
      setPixStatus("created");
      setError(null);
      setCopied(false);
      setIncludeLogoRemover(false);
      setPaymentMethod("pix");
    }
  }, [isOpen]);

  // Polling para verificar status do PIX
  useEffect(() => {
    if (!pixData || pixStatus === "paid" || pixStatus === "expired" || pixStatus === "canceled") {
      return;
    }

    // Polling menos frequente (10 segundos) já que o webhook é mais confiável
    // O webhook será o método principal de detecção de pagamento
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/pix/status?id=${pixData.id}`);
        const data = await response.json();
        
        if (response.ok && data.status) {
          setPixStatus(data.status);

          if (data.status === "paid") {
            // Pagamento confirmado - liberar acesso automaticamente
            if (model.entregavel) {
              // Abrir link automaticamente após 2 segundos
              setTimeout(() => {
                window.open(model.entregavel, "_blank");
                // Fechar modal após 3 segundos
                setTimeout(() => {
                  onClose();
                }, 3000);
              }, 2000);
            } else {
              // Se não houver entregável, apenas fechar após mostrar sucesso
              setTimeout(() => {
                onClose();
              }, 3000);
            }
          }
        }
        // Se houver erro, não fazer nada - o webhook vai detectar o pagamento
        // Não logar erros para não poluir o console
      } catch (error) {
        // Silenciosamente ignorar erros de polling - webhook é mais confiável
      }
    }, 10000); // Verificar a cada 10 segundos (menos frequente)

    return () => clearInterval(interval);
  }, [pixData, pixStatus, model.entregavel, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentMethod !== "pix") {
      setError("Por enquanto, apenas PIX está disponível");
      return;
    }

    setIsProcessing(true);

    try {
      // Calcular valor total (produto + orderbump se selecionado)
      const totalPrice = price + (includeLogoRemover ? logoRemoverPrice : 0);
      const valueInCents = Math.round(totalPrice * 100);

      const response = await fetch("/api/pix/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: valueInCents,
          webhook_url: `${window.location.origin}/api/pix/webhook`,
          // Split será aplicado automaticamente no backend se configurado
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar PIX");
      }

      setPixData(data);
      setPixStatus(data.status);
    } catch (err: any) {
      setError(err.message || "Erro ao processar pagamento");
      console.error("Erro ao criar PIX:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && pixStatus !== "paid") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-dark-card border border-dark-border rounded-lg w-full max-w-md p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Pagamento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fechar"
            disabled={pixStatus === "paid"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="border-b border-dark-border pb-4">
          <p className="text-gray-400 text-sm">Modelo</p>
          <p className="text-white font-medium">{model.name}</p>
          <div className="mt-2 space-y-1">
            <p className="text-gray-400 text-sm">Produto Principal:</p>
            <p className="text-purple-primary font-bold text-xl">
              R$ {price.toFixed(2).replace(".", ",")}
            </p>
            {includeLogoRemover && (
              <div className="mt-2 pt-2 border-t border-dark-border">
                <p className="text-gray-400 text-sm">Cortar Logo do Onlyfans:</p>
                <p className="text-purple-primary font-semibold">
                  + R$ {logoRemoverPrice.toFixed(2).replace(".", ",")}
                </p>
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-purple-primary">
              <p className="text-gray-400 text-sm">Total:</p>
              <p className="text-purple-primary font-bold text-2xl">
                R$ {(price + (includeLogoRemover ? logoRemoverPrice : 0)).toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
        </div>

        {!pixData ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Orderbump - Cortar Logo do Onlyfans */}
            <div className="bg-gradient-to-r from-purple-primary/20 to-purple-secondary/20 border-2 border-purple-primary rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLogoRemover}
                  onChange={(e) => setIncludeLogoRemover(e.target.checked)}
                  className="mt-1 w-5 h-5 text-purple-primary border-purple-primary rounded focus:ring-purple-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-semibold">Cortar Logo do Onlyfans</span>
                    <span className="text-purple-primary font-bold">+ R$ {logoRemoverPrice.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Ferramenta exclusiva para remover logos e marcas d'água de imagens do Onlyfans automaticamente.
                  </p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-white mb-2">Método de Pagamento</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-purple-primary rounded cursor-pointer bg-purple-primary/10">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pix"
                    checked={paymentMethod === "pix"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-purple-primary focus:ring-purple-primary"
                  />
                  <span className="text-white font-medium">PIX</span>
                  <span className="text-gray-400 text-sm ml-auto">Pagamento instantâneo</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-dark-border hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!paymentMethod || isProcessing}
                className="flex-1 bg-purple-primary hover:bg-purple-secondary disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors"
              >
                {isProcessing ? "Gerando PIX..." : "Gerar QR Code PIX"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {pixStatus === "paid" ? (
              <div className="text-center space-y-4">
                <div className="bg-green-500/20 border border-green-500 rounded p-4">
                  <svg
                    className="w-16 h-16 text-green-500 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-green-400 font-bold text-lg mb-2">Pagamento Confirmado!</p>
                  {model.entregavel ? (
                    <>
                      <p className="text-gray-300 text-sm mb-4">
                        O conteúdo será aberto automaticamente em alguns segundos...
                      </p>
                      <button
                        onClick={() => {
                          window.open(model.entregavel, "_blank");
                          setTimeout(() => onClose(), 1000);
                        }}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                      >
                        Abrir Conteúdo Agora
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-300 text-sm">Pagamento processado com sucesso!</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-white font-medium mb-2">Escaneie o QR Code ou copie o código PIX</p>
                  <p className="text-gray-400 text-sm mb-4">
                    Valor: <span className="text-purple-primary font-bold">R$ {(price + (includeLogoRemover ? logoRemoverPrice : 0)).toFixed(2).replace(".", ",")}</span>
                  </p>
                  {includeLogoRemover && (
                    <p className="text-xs text-gray-400 mb-2">
                      Inclui: Produto Principal + Cortar Logo do Onlyfans
                    </p>
                  )}
                </div>

                {pixData.qr_code_base64 && (
                  <div className="flex justify-center bg-white p-4 rounded-lg">
                    <Image
                      src={pixData.qr_code_base64}
                      alt="QR Code PIX"
                      width={256}
                      height={256}
                      className="w-64 h-64"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-white text-sm font-medium">Código PIX (Copiar e Colar)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pixData.qr_code}
                      readOnly
                      className="flex-1 bg-black border border-dark-border rounded px-4 py-2 text-white text-xs font-mono break-all"
                    />
                    <button
                      onClick={copyPixCode}
                      className="bg-purple-primary hover:bg-purple-secondary text-white px-4 py-2 rounded transition-colors whitespace-nowrap"
                    >
                      {copied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500 rounded p-3 text-blue-300 text-sm text-center">
                  <p className="font-semibold">Aguardando pagamento...</p>
                  <p className="text-xs mt-1">O pagamento será detectado automaticamente via webhook quando confirmado</p>
                  <p className="text-xs mt-1 text-blue-400">Você pode fechar esta janela - será notificado quando o pagamento for confirmado</p>
                </div>

                {pixStatus === "expired" && (
                  <div className="bg-red-500/20 border border-red-500 rounded p-3 text-red-400 text-sm text-center">
                    <p>Este PIX expirou. Por favor, gere um novo código.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

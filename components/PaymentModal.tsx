"use client";

import { useState, useEffect } from "react";
import { Model } from "@/types/model";
import { SyncPayPixResponse, SyncPayStatusResponse } from "@/types/syncpay";
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
  const [pixData, setPixData] = useState<SyncPayPixResponse | null>(null);
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
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Polling para verificar status do PIX
  useEffect(() => {
    if (!pixData || pixStatus === "paid" || pixStatus === "expired" || pixStatus === "canceled") {
      return;
    }

    // Polling SyncPay - verificar status a cada 3 segundos
    let pollCount = 0;
    const maxPolls = 120; // 120 polls = 6 minutos (120 * 3 segundos)
    
    const interval = setInterval(async () => {
      try {
        pollCount++;
        console.log(`🔄 Verificando status da transação ${pixData.identifier}... (tentativa ${pollCount}/${maxPolls})`);
        
        const response = await fetch("/api/syncpay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "check-payment",
            transactionId: pixData.identifier
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Erro ao verificar pagamento:', {
            status: response.status,
            error: errorData.error || errorData.message || 'Erro desconhecido',
            details: errorData
          });
          return;
        }

        const data: SyncPayStatusResponse = await response.json();
        console.log('📥 Resposta completa da API SyncPay:', JSON.stringify(data, null, 2));

        const status = data.status?.toLowerCase() || 'pending';
        const paidAt = data.paid_at;

        console.log('📊 Status do pagamento SyncPay:', status);
        console.log('📊 PaidAt:', paidAt);

        // SyncPay: pagamento confirmado APENAS quando status for 'completed' ou 'paid'
        // NÃO considerar paid_at sozinho, pois pode estar preenchido mesmo com status pending
        const isPagamentoConfirmado = 
          status === 'paid' || 
          status === 'completed';

        if (isPagamentoConfirmado) {
          console.log('✅✅✅ PAGAMENTO CONFIRMADO! Liberando conteúdo...');
          setPixStatus("paid");
          
          // Pagamento confirmado - liberar acesso automaticamente
          if (model.entregavel) {
            setTimeout(() => {
              console.log(`🔗 Abrindo entregável: ${model.entregavel}`);
              window.open(model.entregavel, "_blank");
              setTimeout(() => {
                onClose();
              }, 3000);
            }, 2000);
          } else {
            setTimeout(() => {
              onClose();
            }, 3000);
          }
        } else if (status === 'pending' || status === 'processing' || status === 'created') {
          console.log('⏳ Aguardando pagamento... Status:', status);
          setPixStatus("created");
        } else if (status === 'canceled' || status === 'cancelled') {
          console.log('❌ Pagamento cancelado. Status:', status);
          setPixStatus("canceled");
        } else {
          console.log('⚠️ Status:', status, '- Continuando verificação...');
        }
        
        // Parar polling após máximo de tentativas
        if (pollCount >= maxPolls) {
          console.log('⏰ Polling atingiu o limite máximo. Parando verificação automática.');
          clearInterval(interval);
          setError('Tempo limite de verificação atingido. Por favor, verifique o pagamento manualmente.');
        }
      } catch (error: any) {
        console.error('Erro ao verificar pagamento:', error);
      }
    }, 3000);

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
      const totalPrice = price + (includeLogoRemover ? logoRemoverPrice : 0);
      const valorEmReais = totalPrice;

      // SyncPay - criar transação
      const response = await fetch("/api/syncpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create-pix",
          valor: valorEmReais,
          plano: model.name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar PIX");
      }

      setPixData(data);
      setPixStatus("created");
    } catch (err: any) {
      setError(err.message || "Erro ao processar pagamento");
      console.error("Erro ao criar PIX:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPixCode = () => {
    const pixCode = pixData?.pix_code;
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

        {!pixData ? (
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
        ) : pixStatus === "paid" ? (
          <div className="text-center space-y-4">
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <h3 className="text-2xl font-bold text-white">Pagamento Confirmado!</h3>
            <p className="text-gray-300">Obrigado pela compra!</p>
            {model.entregavel && (
              <button
                onClick={() => {
                  window.open(model.entregavel, "_blank");
                  setTimeout(() => onClose(), 1000);
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Abrir Conteúdo Agora
              </button>
            )}
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
              <p className="text-xs text-gray-500 mt-2">
                💡 Após pagar, aguarde alguns segundos para confirmação automática
              </p>
            </div>

            {/* Gerar QR code a partir do código PIX copiável */}
            {(() => {
              const pixCode = pixData.pix_code;
              
              if (!pixCode) return null;
              
              // Gerar QR code a partir do código PIX usando api.qrserver.com
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(pixCode)}`;
              
              return (
                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code PIX"
                    className="w-64 h-64 object-contain"
                    onError={(e) => {
                      console.error('Erro ao carregar QR code:', qrCodeUrl);
                    }}
                  />
                </div>
              );
            })()}

            <div className="space-y-2">
              <label className="block text-white font-medium text-sm">
                Código PIX (copiar e colar)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pixData.pix_code || ''}
                  readOnly
                  className="flex-1 bg-black border border-dark-border rounded px-4 py-2 text-white text-xs font-mono break-all"
                />
                <button
                  onClick={copyPixCode}
                  className="bg-purple-primary hover:bg-purple-primary/80 text-white px-4 py-2 rounded transition-colors whitespace-nowrap"
                >
                  {copied ? "✓ Copiado" : "Copiar"}
                </button>
              </div>
            </div>

            {pixStatus === "created" && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-orange-400">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  <span className="text-sm">Aguardando pagamento...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-red-400 text-sm">
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

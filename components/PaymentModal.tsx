"use client";

import { useState, useEffect } from "react";
import { Model } from "@/types/model";
import { CreateTransactionResponse } from "@/types/payevo";
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
  const [pixData, setPixData] = useState<CreateTransactionResponse | null>(null);
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

    // Verificar se o QR code expirou
    const expirationDate = pixData.pix?.expirationDate;
    if (expirationDate) {
      const expiration = new Date(expirationDate);
      const now = new Date();
      if (now > expiration) {
        console.log('⏰ QR Code expirado!');
        setPixStatus("expired");
        setError("O QR Code expirou. Por favor, gere um novo pagamento.");
        return;
      }
    }

    // Polling Payevo - verificar status a cada 3 segundos
    const interval = setInterval(async () => {
      try {
        console.log(`🔄 Verificando status da transação ${pixData.id}...`);
        const response = await fetch(`/api/payevo/status?id=${pixData.id}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 404) {
            console.error('❌ Transação não encontrada (404):', {
              transactionId: pixData.id,
              error: errorData.error || errorData.message,
              message: errorData.message,
              endpoint: errorData.endpoint,
              response: errorData.response
            });
            console.error('🔍 Possíveis causas:');
            console.error('  1. SECRET_KEY Payevo incorreta nas variáveis de ambiente');
            console.error('  2. Transação não foi criada corretamente');
            console.error('  3. ID da transação está incorreto');
          } else {
            console.error('❌ Erro ao verificar pagamento:', {
              status: response.status,
              error: errorData.error || errorData.message || 'Erro desconhecido',
              details: errorData
            });
          }
          return;
        }

        const data = await response.json();
        console.log('📥 Resposta completa da API Payevo:', JSON.stringify(data, null, 2));
        
        // Extrair status do Payevo
        let status = data.status?.toLowerCase();
        
        console.log('🔍 Debug - Extraindo status:', {
          'data.status': data.status,
          'status.toLowerCase()': status,
          'tipo': typeof data.status
        });
        
        if (!status || status === 'unknown') {
          status = 'pending';
          console.warn('⚠️ Status não encontrado ou desconhecido, usando "pending"');
        }
        
        console.log('📊 Status do pagamento Payevo:', status);

        // Payevo: pagamento confirmado quando paidAt não for null ou status for pago
        const paidAt = data.paidAt;
        const statusLower = status?.toLowerCase() || '';
        
        // Verificar também outros campos que podem indicar pagamento
        const hasEnd2EndId = data.pix?.end2EndId || data.pix?.end_to_end_id;
        const hasReceiptUrl = data.pix?.receiptUrl || data.pix?.receipt_url;
        
        // Log detalhado para debug
        console.log('🔍 Verificando pagamento:', {
          status: status,
          statusLower: statusLower,
          paidAt: paidAt,
          hasEnd2EndId: !!hasEnd2EndId,
          hasReceiptUrl: !!hasReceiptUrl,
          pix: data.pix
        });
        
        // Payevo: quando pago, o status pode mudar para "paid" ou "approved"
        // E o paidAt será preenchido, ou pode ter end2EndId/receiptUrl
        // IMPORTANTE: Verificar também se updatedAt mudou recentemente (pode indicar atualização)
        const updatedAt = data.updatedAt;
        const hasRecentUpdate = updatedAt && new Date(updatedAt) > new Date(Date.now() - 5 * 60 * 1000); // Últimos 5 minutos
        
        const isPagamentoConfirmado = (paidAt !== null && paidAt !== undefined && paidAt !== '') ||
                                     statusLower === 'paid' || 
                                     statusLower === 'approved' || 
                                     statusLower === 'completed' || 
                                     statusLower === 'confirmed' ||
                                     statusLower === 'paid_out' ||
                                     statusLower === 'success' ||
                                     statusLower === 'pago' || // Status em português
                                     (hasEnd2EndId && statusLower !== 'waiting_payment') || // Se tem end2EndId e não está waiting, provavelmente foi pago
                                     (hasReceiptUrl && statusLower !== 'waiting_payment'); // Se tem receiptUrl, foi pago
        
        console.log('🔍 Análise completa de pagamento:', {
          isPagamentoConfirmado,
          paidAt,
          statusLower,
          hasEnd2EndId,
          hasReceiptUrl,
          updatedAt,
          hasRecentUpdate,
          allStatusChecks: {
            paidAtCheck: paidAt !== null && paidAt !== undefined && paidAt !== '',
            statusPaid: statusLower === 'paid',
            statusApproved: statusLower === 'approved',
            statusCompleted: statusLower === 'completed',
            statusConfirmed: statusLower === 'confirmed',
            statusPaidOut: statusLower === 'paid_out',
            statusSuccess: statusLower === 'success',
            statusPago: statusLower === 'pago',
            end2EndIdCheck: hasEnd2EndId && statusLower !== 'waiting_payment',
            receiptUrlCheck: hasReceiptUrl && statusLower !== 'waiting_payment'
          }
        });

        if (isPagamentoConfirmado) {
          console.log('✅✅✅ PAGAMENTO CONFIRMADO! Liberando conteúdo...');
          setPixStatus("paid");
          
          // Pagamento confirmado - liberar acesso automaticamente
          if (model.entregavel) {
            // Abrir link automaticamente após 2 segundos
            setTimeout(() => {
              console.log(`🔗 Abrindo entregável: ${model.entregavel}`);
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
        } else if (status === 'pending' || status === 'created') {
          console.log('⏳ Aguardando pagamento... Status:', status);
          setPixStatus(status as any);
        } else if (status === 'canceled' || status === 'cancelled') {
          console.log('❌ Pagamento cancelado. Status:', status);
          setPixStatus("canceled");
        } else {
          console.log('⚠️ Status:', status, '- Continuando verificação...');
        }
      } catch (error: any) {
        console.error('Erro ao verificar pagamento:', error);
        // Continuar tentando mesmo com erro
      }
    }, 3000); // Verificar a cada 3 segundos conforme projeto de referência

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

      // Payevo - criar transação
      const response = await fetch("/api/payevo/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: valueInCents,
          description: `Pagamento - ${model.name}`,
          paymentMethod: "PIX",
          postbackUrl: `${window.location.origin}/api/payevo/postback`,
          metadata: JSON.stringify({
            modelId: model.id,
            modelName: model.name,
            orderId: `order-${Date.now()}`
          }),
          customer: {
            name: "Cliente",
            email: "cliente@email.com"
          },
          items: [{
            title: model.name,
            unitPrice: valueInCents,
            quantity: 1,
            externalRef: `model-${model.id}`
          }]
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
    // Payevo: pixCode é o código PIX copiável (EMV), pix.qrcode é link da imagem
    const pixCode = pixData?.pixCode || pixData?.qr_code || pixData?.pix?.qrcode;
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
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

                {/* Payevo: pix.qrcode pode ser link da imagem OU código PIX copiável */}
                {/* Gerar QR code a partir do código PIX copiável */}
                {(() => {
                  // Priorizar pixCode, senão usar qr_code ou pix.qrcode
                  const pixCode = pixData.pixCode || pixData.qr_code || pixData.pix?.qrcode || '';
                  
                  // Verificar se é um link de imagem (começa com http) ou código PIX (começa com 000201)
                  const isImageUrl = pixCode.startsWith('http://') || pixCode.startsWith('https://');
                  
                  // Se for link de imagem, usar diretamente. Senão, gerar QR code a partir do código PIX
                  const qrCodeUrl = isImageUrl 
                    ? pixCode 
                    : (pixCode ? `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(pixCode)}` : '');
                  
                  return qrCodeUrl ? (
                    <div className="flex justify-center bg-white p-4 rounded-lg">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code PIX"
                        className="w-64 h-64 object-contain"
                        onError={(e) => {
                          console.error('Erro ao carregar QR code:', qrCodeUrl);
                          // Se falhar e for link de imagem, tentar gerar a partir do código PIX
                          if (isImageUrl && pixCode && !pixCode.startsWith('http')) {
                            const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(pixCode)}`;
                            (e.target as HTMLImageElement).src = fallbackUrl;
                          }
                        }}
                      />
                    </div>
                  ) : null;
                })()}

                <div className="space-y-2">
                  <label className="block text-white text-sm font-medium">Código PIX (Copiar e Colar)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pixData.pixCode || pixData.qr_code || pixData.pix?.qrcode || ''}
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

// Armazenamento em memória para status de pagamentos PIX
// O webhook atualiza este armazenamento quando recebe notificações

interface PixStatus {
  id: string;
  status: "created" | "paid" | "expired" | "canceled";
  updatedAt: Date;
  entregavel?: string; // Link do entregável para liberar quando pago
  lastApiCheck?: Date; // Última vez que consultamos a API (para rate limiting)
}

const pixStatusStore = new Map<string, PixStatus>();

export function updatePixStatus(
  pixId: string,
  status: PixStatus["status"],
  entregavel?: string
) {
  pixStatusStore.set(pixId, {
    id: pixId,
    status,
    updatedAt: new Date(),
    entregavel,
  });
  
  console.log(`✅ Status do PIX ${pixId} atualizado para: ${status}`);
}

export function getPixStatus(pixId: string): PixStatus | null {
  return pixStatusStore.get(pixId) || null;
}

export function getAllPixStatuses(): PixStatus[] {
  return Array.from(pixStatusStore.values());
}

// Limpar status antigos (mais de 24 horas) para evitar vazamento de memória
export function cleanupOldStatuses() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  let cleaned = 0;
  for (const [id, status] of pixStatusStore.entries()) {
    if (status.updatedAt < oneDayAgo) {
      pixStatusStore.delete(id);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Removidos ${cleaned} status antigos`);
  }
}

// Limpar status antigos ao consultar (lazy cleanup)
export function getPixStatusWithCleanup(pixId: string): PixStatus | null {
  // Limpar status antigos ocasionalmente (10% das vezes)
  if (Math.random() < 0.1) {
    cleanupOldStatuses();
  }
  return getPixStatus(pixId);
}

// Verificar se pode consultar API (rate limiting: 1 minuto entre consultas)
export function canCheckApi(pixId: string): boolean {
  const status = getPixStatus(pixId);
  if (!status || !status.lastApiCheck) {
    return true; // Nunca consultou, pode consultar
  }
  
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  return status.lastApiCheck < oneMinuteAgo;
}

// Marcar que consultamos a API (para rate limiting)
export function markApiCheck(pixId: string) {
  const status = getPixStatus(pixId);
  if (status) {
    status.lastApiCheck = new Date();
    pixStatusStore.set(pixId, status);
  }
}

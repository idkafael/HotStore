// Configuração SyncPay
// Cache para o token de autenticação
let tokenCache = {
  token: null as string | null,
  expiresAt: null as Date | null
};

// Função para obter token de autenticação
export async function getAuthToken(): Promise<string> {
  // Verificar se temos um token válido em cache
  if (tokenCache.token && tokenCache.expiresAt && new Date() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const clientId = process.env.SYNCPAY_CLIENT_ID;
  const clientSecret = process.env.SYNCPAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SYNCPAY_CLIENT_ID e SYNCPAY_CLIENT_SECRET devem estar configurados');
  }

  try {
    const baseUrl = process.env.SYNCPAY_BASE_URL || 'https://api.syncpayments.com.br';
    const apiUrl = baseUrl.endsWith('/') 
      ? `${baseUrl}api/partner/v1/auth-token`
      : `${baseUrl}/api/partner/v1/auth-token`;
    
    console.log('🔑 Tentando obter token SyncPay de:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorData: { message?: string } = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || `Erro ${response.status}` };
      }
      throw new Error(errorData.message || `Erro ao obter token: ${response.status}`);
    }

    const data = await response.json();
    
    // Cachear o token
    tokenCache.token = data.access_token;
    // Expirar 5 minutos antes do tempo real para garantir validade
    const expiresIn = (data.expires_in || 3600) - 300; // 300 segundos = 5 minutos
    tokenCache.expiresAt = new Date(Date.now() + expiresIn * 1000);

    console.log('✅ Token SyncPay obtido com sucesso');
    return data.access_token;
  } catch (error: any) {
    console.error('❌ Erro ao obter token SyncPay:', error);
    throw error;
  }
}

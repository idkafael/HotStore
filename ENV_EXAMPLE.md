# Variáveis de Ambiente - Payevo

Configure estas variáveis no seu `.env.local` (local) e no Vercel (produção):

```env
# Payevo API Configuration
PAYEVO_API_URL=https://apiv2.payevo.com.br
PAYEVO_SECRET_KEY=sk_like_dgLHTBahwB5SWvEw9SXRKsxWX4OaR0TEq4tEXVaHd0Sa2knD

# IDs Payevo (se necessário para split ou outras funcionalidades)
PAYEVO_COMPANY_ID=bffd597e-523f-4efc-9fc7-1e48b773ab97
PAYEVO_RECEIVER_ID=4de0133c-834f-4028-ac0b-c73c159190c8

# URL da aplicação (para postback/webhook)
NEXT_PUBLIC_APP_URL=https://storehotmodelos.shop

# Cloudinary (se ainda estiver usando)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
```

## Configuração no Vercel:

1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Adicione todas as variáveis acima
3. Certifique-se de que `NEXT_PUBLIC_APP_URL` está configurado para produção

## Importante:

- O `NEXT_PUBLIC_APP_URL` é usado para configurar o postback URL automaticamente
- O PaymentModal também envia o postback_url usando `window.location.origin` como fallback
- Certifique-se de que o domínio está configurado corretamente no Vercel

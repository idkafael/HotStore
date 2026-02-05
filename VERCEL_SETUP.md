# Configuração no Vercel

Este documento explica como configurar as variáveis de ambiente no Vercel para que o sistema de pagamento funcione corretamente.

## ⚠️ IMPORTANTE: Variáveis de Ambiente no Vercel

O erro 500 ao consultar o status do PIX geralmente ocorre porque as variáveis de ambiente não estão configuradas no Vercel.

## Como Configurar

1. Acesse o painel do Vercel: https://vercel.com/dashboard
2. Selecione seu projeto `HotStore`
3. Vá em **Settings** > **Environment Variables**
4. Adicione as seguintes variáveis:

### Variáveis Obrigatórias

```env
PUSHINPAY_API_URL=https://api.pushinpay.com.br
PUSHINPAY_TOKEN=61633|lWpOEnAVt4NNfR4vWal4TXmsAnMkHSYYTuSyReE98a540c5e
NEXT_PUBLIC_APP_URL=https://hot-store.vercel.app
```

### Variáveis do Cloudinary

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu_cloud_name_aqui
CLOUDINARY_API_KEY=689997847962912
CLOUDINARY_API_SECRET=9a-aJ3-pWV74k1aRtiZUhwBmQgk
```

### Variáveis Opcionais (Split)

```env
PUSHINPAY_SPLIT_ACCOUNT_ID=
PUSHINPAY_SPLIT_PERCENTAGE=10
```

## ⚠️ Após Adicionar as Variáveis

1. **Redeploy obrigatório**: Após adicionar/modificar variáveis de ambiente, você DEVE fazer um novo deploy
2. Vá em **Deployments** > Clique nos três pontos do último deployment > **Redeploy**
3. Ou faça um novo commit e push para triggerar um novo deploy automaticamente

## Verificar se Está Funcionando

Após o redeploy, verifique os logs do Vercel:
1. Vá em **Deployments** > Selecione o último deployment
2. Clique em **Functions** > Selecione `/api/pix/status`
3. Verifique os logs para ver se o token está sendo encontrado

## Troubleshooting

### Erro 500 ao consultar status do PIX
- ✅ Verifique se `PUSHINPAY_TOKEN` está configurado
- ✅ Verifique se `PUSHINPAY_API_URL` está configurado
- ✅ Faça um redeploy após adicionar as variáveis

### Erro 404 no logo.png
- O arquivo `logo.png` não existe no repositório
- Adicione o arquivo em `public/logo.png` ou remova a referência no código

### Webhook não funciona
- Verifique se `NEXT_PUBLIC_APP_URL` está configurado com a URL correta do Vercel
- Configure o webhook no painel da PushinPay apontando para: `${NEXT_PUBLIC_APP_URL}/api/pix/webhook`

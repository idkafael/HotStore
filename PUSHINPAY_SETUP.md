# Configuração PushinPay PIX

Este documento explica como configurar a integração PushinPay PIX no projeto.

## Pré-requisitos

1. Conta criada e aprovada na PushinPay: https://app.pushinpay.com.br/register
2. Token de API obtido no painel da PushinPay
3. Para ambiente SANDBOX: solicitar liberação via suporte após cadastro em produção

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# PushinPay API Configuration
PUSHINPAY_API_URL=https://api.pushinpay.com.br
# Para ambiente SANDBOX, use: https://api-sandbox.pushinpay.com.br
PUSHINPAY_TOKEN=seu_token_aqui

# URL base da aplicação (para webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3001
# Em produção, use: https://seudominio.com.br

# Split Configuration (Opcional)
# Se você quiser usar split nativo, configure o account_id da conta que receberá parte do pagamento
# O valor do split será calculado automaticamente (máximo 50% do valor total)
PUSHINPAY_SPLIT_ACCOUNT_ID=
# Exemplo: PUSHINPAY_SPLIT_ACCOUNT_ID=9C3XXXXX3A043

# Percentual do split (opcional, padrão: 10%)
# PUSHINPAY_SPLIT_PERCENTAGE=10
```

### 2. Obter Token de API

1. Acesse o painel da PushinPay: https://app.pushinpay.com.br
2. Vá em Configurações > API
3. Copie seu token de API
4. Cole no arquivo `.env.local` na variável `PUSHINPAY_TOKEN`

### 3. Configurar Split (Opcional)

O split nativo permite dividir o pagamento entre múltiplas contas. Para configurar:

1. Obtenha o `account_id` da conta que receberá parte do pagamento
2. Adicione no `.env.local`:
   ```env
   PUSHINPAY_SPLIT_ACCOUNT_ID=9C3XXXXX3A043
   PUSHINPAY_SPLIT_PERCENTAGE=10
   ```

**Regras do Split:**
- Valor mínimo: 50 centavos
- Percentual máximo: 50% do valor total da transação
- O valor do split é calculado automaticamente no backend (padrão: 10% do valor total)
- Você pode ajustar a porcentagem através da variável `PUSHINPAY_SPLIT_PERCENTAGE` (sem o símbolo %)
- O split é aplicado automaticamente em todos os PIX criados quando configurado

### 4. Configurar Webhook (Recomendado)

O webhook permite receber notificações automáticas quando um pagamento é confirmado.

1. Configure `NEXT_PUBLIC_APP_URL` com a URL pública da sua aplicação
2. O webhook será automaticamente configurado em: `${NEXT_PUBLIC_APP_URL}/api/pix/webhook`
3. Em desenvolvimento local, você pode usar serviços como ngrok para expor sua aplicação

**Exemplo com ngrok:**
```bash
ngrok http 3001
# Use a URL fornecida pelo ngrok em NEXT_PUBLIC_APP_URL
```

## Funcionalidades Implementadas

### ✅ Criar PIX
- Endpoint: `/api/pix/create`
- Cria QR Code PIX com valor especificado
- Suporta split nativo (se configurado)
- Retorna QR Code em base64 para exibição

### ✅ Consultar Status do PIX
- Endpoint: `/api/pix/status?id={pix_id}`
- Verifica status atual do pagamento
- Polling automático no frontend a cada 3 segundos

### ✅ Webhook de Notificações
- Endpoint: `/api/pix/webhook`
- Recebe notificações automáticas da PushinPay
- Processa pagamentos confirmados
- Retentativas automáticas em caso de falha (3 tentativas)

## Como Usar

1. O usuário clica em "Eu Quero" no card do modelo
2. Preenche o email e seleciona PIX como método de pagamento
3. Clica em "Gerar QR Code PIX"
4. O sistema cria um PIX via API PushinPay
5. Exibe QR Code e código PIX para copiar
6. Verifica automaticamente o status a cada 3 segundos
7. Quando pago, libera acesso ao conteúdo entregável

## Aviso Legal

Conforme documentação PushinPay (Item 4.10 dos Termos de Uso), é obrigatório informar:

> "A PUSHIN PAY atua exclusivamente como processadora de pagamentos e não possui qualquer responsabilidade pela entrega, suporte, conteúdo, qualidade ou cumprimento das obrigações relacionadas aos produtos ou serviços oferecidos pelo vendedor."

Este aviso já está implementado no modal de pagamento.

## Limites e Validações

- Valor mínimo: R$ 0,50 (50 centavos)
- Valor máximo: Conforme limite configurado na sua conta PushinPay
- Split máximo: 50% do valor total da transação
- Validações automáticas implementadas no backend

## Troubleshooting

### Erro: "Token PushinPay não configurado"
- Verifique se o arquivo `.env.local` existe
- Verifique se `PUSHINPAY_TOKEN` está preenchido
- Reinicie o servidor após adicionar variáveis de ambiente

### Erro: "Valor acima do limite permitido"
- Verifique o limite máximo configurado na sua conta PushinPay
- Ajuste o valor do produto se necessário

### Webhook não está recebendo notificações
- Verifique se `NEXT_PUBLIC_APP_URL` está configurado corretamente
- Em desenvolvimento, use ngrok ou similar para expor a aplicação
- Verifique os logs do servidor para erros

## Documentação Oficial

- PushinPay: https://app.theneo.io/pushinpay/pix/pix/criar-pix
- Termos de Uso: https://pushinpay.com.br/termos-de-uso

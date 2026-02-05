# HotStore Modelos

Site de galeria de modelos com carrossel de imagens, sistema de tags e filtros. Desenvolvido com Next.js 14, TypeScript e Tailwind CSS.

## Características

- 🎨 Design roxo moderno e responsivo
- 🖼️ Carrossel de 1-3 imagens por modelo
- 🏷️ Sistema de tags para categorização
- 🔍 Busca e filtros funcionais
- 📱 Layout responsivo (mobile-first)
- ⚡ Performance otimizada

## Estrutura do Projeto

```
├── app/              # Páginas e layouts Next.js
├── components/       # Componentes React reutilizáveis
├── data/            # Dados JSON dos modelos
├── types/           # Tipos TypeScript
└── public/          # Arquivos estáticos (imagens)
```

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse [http://localhost:3000](http://localhost:3000)

## Adicionando Imagens

Coloque as imagens dos modelos nas seguintes pastas:

- `public/models/modelo-1/foto-1.jpg`
- `public/models/modelo-1/foto-2.jpg`
- `public/models/modelo-1/foto-3.jpg`
- `public/models/modelo-2/foto-1.jpg`
- etc.

Cada modelo pode ter de 1 a 3 imagens.

## Configuração dos Modelos

Edite o arquivo `data/models.json` para adicionar ou modificar modelos:

```json
{
  "id": "1",
  "name": "Modelo 1",
  "images": [
    "/models/modelo-1/foto-1.jpg",
    "/models/modelo-1/foto-2.jpg"
  ],
  "date": "2026-02-02",
  "tags": ["tag1", "tag2"],
  "category": "categoria1"
}
```

## Responsividade

- **Mobile**: 1 coluna (4 modelos na vertical)
- **Tablet**: 2-3 colunas
- **Desktop**: 4 colunas

## Tecnologias

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React 18

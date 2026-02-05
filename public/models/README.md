# Pasta de Imagens dos Modelos

Coloque as imagens dos modelos aqui seguindo a estrutura:

## Estrutura de Pastas

```
models/
├── modelo-1/
│   ├── foto-1.jpg
│   ├── foto-2.jpg (opcional)
│   └── foto-3.jpg (opcional)
├── modelo-2/
│   ├── foto-1.jpg
│   └── foto-2.jpg (opcional)
├── modelo-3/
│   └── foto-1.jpg
└── modelo-4/
    ├── foto-1.jpg
    ├── foto-2.jpg (opcional)
    └── foto-3.jpg (opcional)
```

## Formato das Imagens

- Formato recomendado: JPG ou PNG
- Proporção recomendada: 3:4 (vertical)
- Cada modelo pode ter de 1 a 3 imagens
- Nomeie as imagens como: `foto-1.jpg`, `foto-2.jpg`, `foto-3.jpg`

## Configuração no JSON

Certifique-se de que o caminho no arquivo `data/models.json` corresponda à localização das imagens:

```json
{
  "images": [
    "/models/modelo-1/foto-1.jpg",
    "/models/modelo-1/foto-2.jpg",
    "/models/modelo-1/foto-3.jpg"
  ]
}
```

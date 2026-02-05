export interface Model {
  id: string;
  name: string;
  images: string[]; // 1-3 imagens
  tags: string[];
  nacionalidade?: string;
  caracteristica?: string;
  entregavel?: string; // URL ou link do entregável após pagamento
  quantidadeFotos?: number;
  quantidadeVideos?: number;
}

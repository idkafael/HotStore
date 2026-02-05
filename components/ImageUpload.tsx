"use client";

import { useState } from "react";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  folder?: string;
}

export default function ImageUpload({ onUploadComplete, folder = "modelos" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validar todos os arquivos
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        setError(`O arquivo "${file.name}" não é uma imagem válida`);
        continue;
      }

      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError(`A imagem "${file.name}" excede 10MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress({ current: 0, total: validFiles.length });

    // Fazer upload de todos os arquivos sequencialmente para melhor feedback
    const urls: string[] = [];
    
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        try {
          setUploadProgress({ current: i, total: validFiles.length });
          
          const formData = new FormData();
          formData.append("file", file);
          if (folder) {
            formData.append("folder", folder);
          }

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Falha no upload de ${file.name}`);
          }

          const data = await response.json();
          if (data.url) {
            urls.push(data.url);
            // Chamar callback imediatamente para cada URL
            onUploadComplete(data.url);
            setUploadProgress({ current: i + 1, total: validFiles.length });
            
            // Pequeno delay para garantir que o estado seja atualizado antes do próximo upload
            if (i < validFiles.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } else {
            throw new Error(`Resposta inválida para ${file.name}`);
          }
        } catch (err: any) {
          console.error(`Erro ao fazer upload de ${file.name}:`, err);
          setError(`Erro ao fazer upload de "${file.name}": ${err.message || "Erro desconhecido"}`);
          // Continua com os próximos arquivos mesmo se um falhar
        }
      }
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      // Limpar o input para permitir selecionar os mesmos arquivos novamente
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="sr-only">Escolher arquivos</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-primary file:text-white hover:file:bg-purple-secondary file:cursor-pointer disabled:opacity-50"
        />
        <p className="text-xs text-gray-500 mt-1">
          Você pode selecionar múltiplas imagens de uma vez (Ctrl+Click ou Cmd+Click)
        </p>
      </label>
      {uploading && (
        <p className="text-sm text-gray-400">
          Fazendo upload... ({uploadProgress.current}/{uploadProgress.total})
        </p>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

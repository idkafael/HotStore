"use client";

import { useState, useEffect } from "react";
import ImageUpload from "@/components/ImageUpload";
import { Model } from "@/types/model";

export default function AdminPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [modelName, setModelName] = useState("");
  const [modelImages, setModelImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [nacionalidade, setNacionalidade] = useState("all");
  const [caracteristica, setCaracteristica] = useState("all");
  const [entregavel, setEntregavel] = useState("");
  const [quantidadeFotos, setQuantidadeFotos] = useState<number | "">("");
  const [quantidadeVideos, setQuantidadeVideos] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [showEditSection, setShowEditSection] = useState(false);

  const handleImageUpload = (url: string) => {
    // Sempre adiciona ao histórico
    setUploadedImages((prev) => [...prev, url]);
    
    // Adiciona ao modelo apenas se ainda não tiver 3 imagens
    setModelImages((prev) => {
      if (prev.length < 3) {
        return [...prev, url];
      }
      return prev; // Mantém as 3 primeiras
    });
  };

  const removeImage = (index: number) => {
    setModelImages(modelImages.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("URL copiada para a área de transferência!");
  };

  const generateModelJson = () => {
    return {
      id: modelName.toLowerCase().replace(/\s+/g, "-"),
      name: modelName,
      images: modelImages,
      tags: tags,
      nacionalidade: nacionalidade !== "all" ? nacionalidade : undefined,
      caracteristica: caracteristica !== "all" ? caracteristica : undefined,
      entregavel: entregavel.trim() || undefined,
      quantidadeFotos: quantidadeFotos !== "" ? Number(quantidadeFotos) : undefined,
      quantidadeVideos: quantidadeVideos !== "" ? Number(quantidadeVideos) : undefined,
    };
  };

  // Carregar todos os modelos
  const loadModels = async () => {
    try {
      const response = await fetch("/api/models");
      if (response.ok) {
        const data = await response.json();
        setAllModels(data);
      }
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  // Carregar modelo para edição
  const loadModelForEdit = (model: Model) => {
    setEditingModelId(model.id);
    setModelName(model.name);
    setModelImages(model.images || []);
    setTags(model.tags || []);
    setNacionalidade(model.nacionalidade || "all");
    setCaracteristica(model.caracteristica || "all");
    setEntregavel(model.entregavel || "");
    setQuantidadeFotos(model.quantidadeFotos || "");
    setQuantidadeVideos(model.quantidadeVideos || "");
    setShowEditSection(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Limpar formulário
  const clearForm = () => {
    setModelName("");
    setModelImages([]);
    setTags([]);
    setNacionalidade("all");
    setCaracteristica("all");
    setEntregavel("");
    setQuantidadeFotos("");
    setQuantidadeVideos("");
    setEditingModelId(null);
  };

  const handleSaveModel = async () => {
    if (!modelName.trim()) {
      setSaveMessage({ type: "error", text: "Nome do modelo é obrigatório" });
      return;
    }

    if (modelImages.length === 0) {
      setSaveMessage({ type: "error", text: "Adicione pelo menos uma imagem" });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const modelData = generateModelJson();
      const method = editingModelId ? "PUT" : "POST";
      const response = await fetch("/api/models", {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(modelData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao salvar modelo");
      }

      setSaveMessage({ 
        type: "success", 
        text: editingModelId 
          ? "Modelo atualizado com sucesso! A página principal será atualizada automaticamente." 
          : "Modelo adicionado com sucesso ao JSON! A página principal será atualizada automaticamente." 
      });
      
      // Recarregar lista de modelos
      await loadModels();
      
      // Limpar formulário após sucesso
      setTimeout(() => {
        clearForm();
        setSaveMessage(null);
      }, 3000);
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message || "Erro ao salvar modelo" });
    } finally {
      setIsSaving(false);
    }
  };

  // Deletar modelo
  const handleDeleteModel = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este modelo?")) {
      return;
    }

    try {
      const response = await fetch(`/api/models?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao deletar modelo");
      }

      await loadModels();
      if (editingModelId === id) {
        clearForm();
      }
      alert("Modelo deletado com sucesso!");
    } catch (error: any) {
      alert(`Erro ao deletar modelo: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-purple-primary mb-8">
          Painel de Administração - Upload de Imagens
        </h1>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => {
              setShowEditSection(!showEditSection);
              if (!showEditSection) {
                loadModels();
              }
            }}
            className="bg-purple-primary hover:bg-purple-secondary px-6 py-2 rounded transition-colors"
          >
            {showEditSection ? "Ocultar" : "Gerenciar"} Modelos Existentes
          </button>
          {editingModelId && (
            <button
              onClick={clearForm}
              className="bg-dark-border hover:bg-gray-700 px-6 py-2 rounded transition-colors"
            >
              Novo Modelo
            </button>
          )}
        </div>

        {/* Seção de Gerenciar Modelos */}
        {showEditSection && (
          <div className="bg-dark-card border border-dark-border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Modelos Existentes</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allModels.length === 0 ? (
                <p className="text-gray-400">Nenhum modelo encontrado.</p>
              ) : (
                allModels.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-3 bg-black rounded border border-dark-border hover:border-purple-primary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{model.name}</p>
                      <p className="text-xs text-gray-400">ID: {model.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadModelForEdit(model)}
                        className="bg-purple-primary hover:bg-purple-secondary px-4 py-2 rounded text-sm transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteModel(model.id)}
                        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm transition-colors"
                      >
                        Deletar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Upload de Imagens */}
          <div className="bg-dark-card border border-dark-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingModelId ? `Editando: ${modelName}` : "Adicionar Novo Modelo"}
            </h2>
            
            <div className="mb-4">
              <label className="block text-white mb-2">Nome do Modelo</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Ex: Modelo 1"
                className="w-full bg-black border border-dark-border rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-primary"
              />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white mb-2">Nacionalidade</label>
                <select
                  value={nacionalidade}
                  onChange={(e) => setNacionalidade(e.target.value)}
                  className="w-full bg-black border border-dark-border rounded px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                >
                  <option value="all">Selecione</option>
                  <option value="latina">Latina</option>
                  <option value="asiatica">Asiatica</option>
                </select>
              </div>

              <div>
                <label className="block text-white mb-2">Caracteristica</label>
                <select
                  value={caracteristica}
                  onChange={(e) => setCaracteristica(e.target.value)}
                  className="w-full bg-black border border-dark-border rounded px-4 py-2 text-white focus:outline-none focus:border-purple-primary"
                >
                  <option value="all">Selecione</option>
                  <option value="loira">Loira</option>
                  <option value="morena">Morena</option>
                  <option value="preta">Preta</option>
                  <option value="ruiva">Ruiva</option>
                  <option value="egirl">Egirl</option>
                  <option value="coroa">Coroa</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-white mb-2">Tags</label>
              
              {/* Tags Rápidas (Filtros) */}
              <div className="mb-3">
                <p className="text-sm text-gray-400 mb-2">Tags Pesquisáveis (Filtros):</p>
                <div className="flex flex-wrap gap-2">
                  {nacionalidade !== "all" && (
                    <button
                      onClick={() => {
                        const tag = nacionalidade === "latina" ? "Latina" : "Asiatica";
                        if (!tags.includes(tag)) {
                          setTags([...tags, tag]);
                        }
                      }}
                      className="bg-purple-primary/30 hover:bg-purple-primary/50 text-purple-light px-3 py-1 rounded text-sm transition-colors"
                    >
                      + {nacionalidade === "latina" ? "Latina" : "Asiatica"}
                    </button>
                  )}
                  {caracteristica !== "all" && (
                    <button
                      onClick={() => {
                        const tagMap: { [key: string]: string } = {
                          loira: "Loira",
                          morena: "Morena",
                          preta: "Preta",
                          ruiva: "Ruiva",
                          egirl: "Egirl",
                          coroa: "Coroa",
                        };
                        const tag = tagMap[caracteristica];
                        if (tag && !tags.includes(tag)) {
                          setTags([...tags, tag]);
                        }
                      }}
                      className="bg-purple-primary/30 hover:bg-purple-primary/50 text-purple-light px-3 py-1 rounded text-sm transition-colors"
                    >
                      + {caracteristica.charAt(0).toUpperCase() + caracteristica.slice(1)}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!tags.includes("Tem Chamada de Vídeo")) {
                        setTags([...tags, "Tem Chamada de Vídeo"]);
                      }
                    }}
                    className="bg-purple-primary/30 hover:bg-purple-primary/50 text-purple-light px-3 py-1 rounded text-sm transition-colors"
                  >
                    + Tem Chamada de Vídeo
                  </button>
                  <button
                    onClick={() => {
                      if (!tags.includes("Cavala")) {
                        setTags([...tags, "Cavala"]);
                      }
                    }}
                    className="bg-purple-primary/30 hover:bg-purple-primary/50 text-purple-light px-3 py-1 rounded text-sm transition-colors"
                  >
                    + Cavala
                  </button>
                  <button
                    onClick={() => {
                      if (!tags.includes("Tatto")) {
                        setTags([...tags, "Tatto"]);
                      }
                    }}
                    className="bg-purple-primary/30 hover:bg-purple-primary/50 text-purple-light px-3 py-1 rounded text-sm transition-colors"
                  >
                    + Tatto
                  </button>
                </div>
              </div>

              {/* Input de Tags Customizadas */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite uma tag customizada e pressione Enter"
                  className="flex-1 bg-black border border-dark-border rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-primary"
                />
                <button
                  onClick={addTag}
                  className="bg-purple-primary hover:bg-purple-secondary px-4 py-2 rounded transition-colors"
                >
                  Adicionar
                </button>
              </div>
              
              {/* Tags Adicionadas */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 bg-purple-primary/20 text-purple-light px-3 py-1 rounded text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-purple-primary hover:text-purple-secondary"
                        aria-label="Remover tag"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Entregável */}
            <div className="mb-4">
              <label className="block text-white mb-2">Entregável (URL/Link)</label>
              <input
                type="text"
                value={entregavel}
                onChange={(e) => setEntregavel(e.target.value)}
                placeholder="Ex: https://drive.google.com/... ou link do conteúdo"
                className="w-full bg-black border border-dark-border rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-primary"
              />
              <p className="text-xs text-gray-400 mt-1">
                Link que será entregue após o pagamento (Google Drive, Dropbox, etc.)
              </p>
            </div>

            {/* Quantidade de Fotos e Vídeos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white mb-2">Quantidade de Fotos</label>
                <input
                  type="number"
                  min="0"
                  value={quantidadeFotos}
                  onChange={(e) => setQuantidadeFotos(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                  placeholder="Ex: 50"
                  className="w-full bg-black border border-dark-border rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-primary"
                />
              </div>

              <div>
                <label className="block text-white mb-2">Quantidade de Vídeos</label>
                <input
                  type="number"
                  min="0"
                  value={quantidadeVideos}
                  onChange={(e) => setQuantidadeVideos(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                  placeholder="Ex: 10"
                  className="w-full bg-black border border-dark-border rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-primary"
                />
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 mb-2">
                Faça upload de até 3 imagens por modelo ({modelImages.length}/3)
              </p>
              <ImageUpload
                onUploadComplete={handleImageUpload}
                folder="modelos"
              />
            </div>

            {/* Preview das Imagens Enviadas */}
            {modelImages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Imagens do Modelo:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {modelImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Imagem ${index + 1}`}
                        className="w-full h-48 object-cover rounded border border-dark-border"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remover imagem"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      <div className="mt-2">
                        <button
                          onClick={() => copyToClipboard(url)}
                          className="text-xs text-purple-primary hover:text-purple-secondary"
                        >
                          Copiar URL
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botão de Salvar */}
            {modelName && modelImages.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveModel}
                    disabled={isSaving}
                    className="flex-1 bg-purple-primary hover:bg-purple-secondary disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded transition-colors"
                  >
                    {isSaving 
                      ? "Salvando..." 
                      : editingModelId 
                        ? "Atualizar Modelo" 
                        : "Salvar no JSON Automaticamente"}
                  </button>
                  <button
                    onClick={() =>
                      copyToClipboard(JSON.stringify(generateModelJson(), null, 2))
                    }
                    className="bg-dark-border hover:bg-gray-700 text-white font-medium py-3 px-6 rounded transition-colors"
                  >
                    Copiar JSON
                  </button>
                </div>

                {saveMessage && (
                  <div
                    className={`p-3 rounded ${
                      saveMessage.type === "success"
                        ? "bg-green-500/20 border border-green-500 text-green-400"
                        : "bg-red-500/20 border border-red-500 text-red-400"
                    }`}
                  >
                    {saveMessage.text}
                  </div>
                )}

                {/* Preview do JSON */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Preview do JSON:</h3>
                  <div className="bg-black border border-dark-border rounded p-4">
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      {JSON.stringify(generateModelJson(), null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Histórico de Uploads */}
          {uploadedImages.length > 0 && (
            <div className="bg-dark-card border border-dark-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Todas as Imagens Enviadas</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded border border-dark-border"
                    />
                    <button
                      onClick={() => copyToClipboard(url)}
                      className="mt-2 text-xs text-purple-primary hover:text-purple-secondary block w-full text-center"
                    >
                      Copiar URL
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

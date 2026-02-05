import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { Model } from "@/types/model";

const modelsFilePath = join(process.cwd(), "data", "models.json");

// GET - Listar todos os modelos
export async function GET() {
  try {
    const fileContents = await readFile(modelsFilePath, "utf8");
    const models = JSON.parse(fileContents);
    return NextResponse.json(models);
  } catch (error) {
    console.error("Error reading models:", error);
    return NextResponse.json(
      { error: "Erro ao ler modelos" },
      { status: 500 }
    );
  }
}

// POST - Adicionar novo modelo
export async function POST(request: NextRequest) {
  try {
    const newModel: Model = await request.json();

    // Validar campos obrigatórios
    if (!newModel.name || !newModel.images || newModel.images.length === 0) {
      return NextResponse.json(
        { error: "Nome e imagens são obrigatórios" },
        { status: 400 }
      );
    }

    // Ler modelos existentes
    const fileContents = await readFile(modelsFilePath, "utf8");
    const models: Model[] = JSON.parse(fileContents);

    // Verificar se o ID já existe
    const existingModel = models.find((m) => m.id === newModel.id);
    if (existingModel) {
      return NextResponse.json(
        { error: "Um modelo com este ID já existe" },
        { status: 400 }
      );
    }

    // Adicionar novo modelo no início do array (para aparecer no topo)
    models.unshift(newModel);

    // Salvar no arquivo
    await writeFile(modelsFilePath, JSON.stringify(models, null, 2), "utf8");

    return NextResponse.json({
      success: true,
      message: "Modelo adicionado com sucesso!",
      model: newModel,
    });
  } catch (error: any) {
    console.error("Error adding model:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao adicionar modelo" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar modelo existente
export async function PUT(request: NextRequest) {
  try {
    const updatedModel: Model = await request.json();

    // Validar campos obrigatórios
    if (!updatedModel.id || !updatedModel.name || !updatedModel.images || updatedModel.images.length === 0) {
      return NextResponse.json(
        { error: "ID, nome e imagens são obrigatórios" },
        { status: 400 }
      );
    }

    // Ler modelos existentes
    const fileContents = await readFile(modelsFilePath, "utf8");
    const models: Model[] = JSON.parse(fileContents);

    // Encontrar o índice do modelo
    const modelIndex = models.findIndex((m) => m.id === updatedModel.id);

    if (modelIndex === -1) {
      return NextResponse.json(
        { error: "Modelo não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar o modelo
    models[modelIndex] = updatedModel;

    // Salvar no arquivo
    await writeFile(modelsFilePath, JSON.stringify(models, null, 2), "utf8");

    return NextResponse.json({
      success: true,
      message: "Modelo atualizado com sucesso!",
      model: updatedModel,
    });
  } catch (error: any) {
    console.error("Error updating model:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar modelo" },
      { status: 500 }
    );
  }
}

// DELETE - Remover modelo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do modelo é obrigatório" },
        { status: 400 }
      );
    }

    // Ler modelos existentes
    const fileContents = await readFile(modelsFilePath, "utf8");
    const models: Model[] = JSON.parse(fileContents);

    // Remover modelo
    const filteredModels = models.filter((m) => m.id !== id);

    if (models.length === filteredModels.length) {
      return NextResponse.json(
        { error: "Modelo não encontrado" },
        { status: 404 }
      );
    }

    // Salvar no arquivo
    await writeFile(
      modelsFilePath,
      JSON.stringify(filteredModels, null, 2),
      "utf8"
    );

    return NextResponse.json({
      success: true,
      message: "Modelo removido com sucesso!",
    });
  } catch (error: any) {
    console.error("Error deleting model:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao remover modelo" },
      { status: 500 }
    );
  }
}

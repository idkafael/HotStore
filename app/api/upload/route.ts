import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    // Verificar se as credenciais estão configuradas
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary não configurado. Verifique as variáveis de ambiente." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "modelos";

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo fornecido" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Converter buffer para base64
    const base64 = buffer.toString("base64");
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload para Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      resource_type: "image",
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao fazer upload da imagem" },
      { status: 500 }
    );
  }
}

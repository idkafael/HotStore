import { v2 as cloudinary } from "cloudinary";

// Configurar Cloudinary apenas se as variáveis de ambiente estiverem disponíveis
if (
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export default cloudinary;

// Função para fazer upload de imagem
export async function uploadImage(file: File | Blob, folder: string = "modelos"): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default"); // Você precisará criar um upload preset no Cloudinary
    formData.append("folder", folder);

    fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error("Upload failed"));
        }
      })
      .catch(reject);
  });
}

// Função para gerar URL otimizada do Cloudinary
export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    return publicId; // Retorna a URL original se não houver configuração
  }

  const { width, height, quality = "auto", format = "auto" } = options;
  const transformations = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);

  const transformString = transformations.join(",");
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
}

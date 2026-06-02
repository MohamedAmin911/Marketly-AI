type ImageKitUploadResult = {
  fileId: string;
  filePath: string;
  height?: number;
  mime?: string;
  name: string;
  size?: number;
  thumbnailUrl?: string;
  url: string;
  width?: number;
};

export type UploadedImageKitAsset = {
  alt: string;
  fileId?: string;
  height?: number;
  metadata?: Record<string, unknown>;
  mimeType?: string;
  provider?: string;
  size?: number;
  storageKey: string;
  thumbnailUrl?: string;
  url: string;
  width?: number;
};

export async function uploadRemoteImageToImageKit({
  alt,
  fileName,
  folder = "/marketly-ai/generated-ads",
  sourceUrl,
}: {
  alt: string;
  fileName: string;
  folder?: string;
  sourceUrl: string;
}): Promise<UploadedImageKitAsset> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("IMAGEKIT_PRIVATE_KEY is not configured.");
  }

  const imageResponse = await fetch(sourceUrl);
  if (!imageResponse.ok) {
    throw new Error("Could not download generated image before ImageKit upload.");
  }

  const imageBlob = await imageResponse.blob();
  const uploadForm = new FormData();
  uploadForm.append("file", imageBlob, fileName);
  uploadForm.append("fileName", fileName);
  uploadForm.append("folder", folder);
  uploadForm.append("useUniqueFileName", "true");

  const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    body: uploadForm,
    headers: {
      Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`,
    },
    method: "POST",
  });

  const payload = (await uploadResponse.json().catch(() => null)) as ImageKitUploadResult | { message?: string } | null;
  if (!uploadResponse.ok || !payload || !("url" in payload)) {
    throw new Error("ImageKit upload failed.");
  }

  return {
    alt,
    fileId: payload.fileId,
    height: payload.height,
    mimeType: payload.mime,
    size: payload.size,
    storageKey: payload.filePath || payload.fileId,
    thumbnailUrl: payload.thumbnailUrl,
    url: payload.url,
    width: payload.width,
  };
}

export async function uploadFileToImageKit({
  alt,
  file,
  fileName,
  folder = "/marketly-ai/uploads",
}: {
  alt: string;
  file: File;
  fileName: string;
  folder?: string;
}): Promise<UploadedImageKitAsset> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("IMAGEKIT_PRIVATE_KEY is not configured.");
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file, fileName);
  uploadForm.append("fileName", fileName);
  uploadForm.append("folder", folder);
  uploadForm.append("useUniqueFileName", "true");

  const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    body: uploadForm,
    headers: {
      Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`,
    },
    method: "POST",
  });

  const payload = (await uploadResponse.json().catch(() => null)) as ImageKitUploadResult | { message?: string } | null;
  if (!uploadResponse.ok || !payload || !("url" in payload)) {
    throw new Error("ImageKit upload failed.");
  }

  return {
    alt,
    fileId: payload.fileId,
    height: payload.height,
    mimeType: payload.mime,
    size: payload.size,
    storageKey: payload.filePath || payload.fileId,
    thumbnailUrl: payload.thumbnailUrl,
    url: payload.url,
    width: payload.width,
  };
}

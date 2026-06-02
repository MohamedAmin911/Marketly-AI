import { apiErrors } from "@/server/errors/api-error";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4"]);
const allowedExtensions = new Map([
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["image/webp", [".webp"]],
  ["video/mp4", [".mp4"]],
]);
const maxUploadSizeBytes = 20 * 1024 * 1024;

export async function validateUploadFile(file: File): Promise<void> {
  if (!allowedMimeTypes.has(file.type)) {
    throw apiErrors.unsupportedMediaType("Upload type is not allowed.");
  }

  const normalizedName = file.name.toLowerCase().trim();
  const extensions = allowedExtensions.get(file.type) ?? [];

  if (!normalizedName || normalizedName.includes("..") || /[\\/]/.test(normalizedName)) {
    throw apiErrors.badRequest("Upload filename is invalid.");
  }

  if (!extensions.some((extension) => normalizedName.endsWith(extension))) {
    throw apiErrors.badRequest("Upload extension does not match the file type.");
  }

  if (file.size <= 0) {
    throw apiErrors.badRequest("Uploaded file is empty.");
  }

  if (file.size > maxUploadSizeBytes) {
    throw apiErrors.payloadTooLarge("Uploads must be 20MB or smaller.");
  }

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (file.type.startsWith("image/") && !isSupportedImageSignature(header)) {
    throw apiErrors.badRequest("Image signature validation failed.");
  }

  if (file.type === "video/mp4" && !String.fromCharCode(...header).includes("ftyp")) {
    throw apiErrors.badRequest("MP4 signature validation failed.");
  }
}

function matches(header: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => header[index] === byte);
}

function isSupportedImageSignature(header: Uint8Array): boolean {
  const ascii = String.fromCharCode(...header);
  return matches(header, [0x89, 0x50, 0x4e, 0x47]) || matches(header, [0xff, 0xd8, 0xff]) || ascii.includes("WEBP");
}

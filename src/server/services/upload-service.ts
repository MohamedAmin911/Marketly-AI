import type { AuthContext } from "@/server/security/auth-guard";
import type { UploadRequest } from "@/server/schemas/upload";
import { validateUploadFile } from "@/server/security/uploads";

export async function storeUpload(input: UploadRequest, auth: AuthContext) {
  await validateUploadFile(input.file);

  return {
    file: {
      bytes: input.file.size,
      id: crypto.randomUUID(),
      mimeType: input.file.type,
      name: input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120),
      purpose: input.purpose,
    },
    tenantId: auth.user.tenantId,
  };
}

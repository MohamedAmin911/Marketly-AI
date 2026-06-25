import { UploadDropzone } from "@/components/shared/upload-dropzone";

export function UploadArea({
  label = "Drag & drop product image",
  onFileSelect,
}: {
  label?: string;
  onFileSelect?: (file: File) => void;
}) {
  return <UploadDropzone label={label} onFileSelect={onFileSelect} />;
}

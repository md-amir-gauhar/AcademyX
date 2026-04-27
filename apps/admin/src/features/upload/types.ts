export interface UploadResult {
  key: string;
  location?: string;
  cdnUrl?: string;
  publicUrl?: string;
  uploadUrl?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
}

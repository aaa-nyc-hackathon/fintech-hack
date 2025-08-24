export interface UploadResponse {
  message: string;
  filename: string;
  publicUrl: string;
  gcsUri: string;
  size: number;
  type: string;
  bucket: string;
  project: string;
}

export interface UploadError {
  error: string;
  details: string;
}

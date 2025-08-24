import { UploadResponse, UploadError } from '@/types/upload';

export async function uploadFileToGCS(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload-video', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData: UploadError = await response.json();
    throw new Error(`${errorData.error}: ${errorData.details}`);
  }
  
  return await response.json();
}

// Alternative function with progress tracking
export async function uploadFileWithProgress(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response: UploadResponse = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid response format'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    const formData = new FormData();
    formData.append('file', file);
    
    xhr.open('POST', '/api/upload-video');
    xhr.send(formData);
  });
} 
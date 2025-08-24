# Google Cloud Storage Upload Integration for Next.js

This guide shows how to integrate GCS file upload functionality into a Next.js application, returning both the GCS URI and public HTTP URL.

## Prerequisites

- Google Cloud Project with Cloud Storage enabled
- Service Account with Storage Object Admin permissions
- GCS bucket with Uniform Bucket-Level Access enabled
- Next.js 13+ with App Router

## 1. Install Dependencies

```bash
npm install @google-cloud/storage
```

## 2. Environment Variables

Create `.env.local` in your project root:

```bash
# Google Cloud Storage Configuration
NEXT_PUBLIC_PROJECT_ID=your-gcp-project-id
NEXT_PUBLIC_GCS_BUCKET_NAME=your-bucket-name
NEXT_PUBLIC_GCS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
NEXT_PUBLIC_GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key here\n-----END PRIVATE KEY-----"
```

## 3. API Route Implementation

Create `app/api/upload/route.ts`:

```typescript
import { Storage } from '@google-cloud/storage';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
    const bucketName = process.env.NEXT_PUBLIC_GCS_BUCKET_NAME;
    const clientEmail = process.env.NEXT_PUBLIC_GCS_CLIENT_EMAIL;
    const privateKey = process.env.NEXT_PUBLIC_GCS_PRIVATE_KEY;
    
    if (!projectId || !bucketName || !clientEmail || !privateKey) {
      return NextResponse.json({ 
        error: 'Missing required environment variables',
        details: 'Please check your .env.local file'
      }, { status: 500 });
    }
    
    // Initialize GCS client
    const storage = new Storage({
      projectId: projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
    });
    
    const bucket = storage.bucket(bucketName);
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const filename = `uploads/${timestamp}-${originalName}`;

    // Upload to GCS
    const gcsFile = bucket.file(filename);
    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.type,
      },
      // Note: public access is managed at bucket level via IAM permissions
      // not via object ACLs when Uniform Bucket-Level Access is enabled
    });

    // Generate URLs
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
    const gcsUri = `gs://${bucketName}/${filename}`;

    return NextResponse.json({
      message: 'File uploaded successfully',
      filename,
      publicUrl,
      gcsUri,
      size: file.size,
      type: file.type,
      bucket: bucketName,
      project: projectId
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

## 4. TypeScript Types

Create `types/upload.ts`:

```typescript
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
```

## 5. Upload Function

Create `utils/upload.ts`:

```typescript
import { UploadResponse, UploadError } from '@/types/upload';

export async function uploadFileToGCS(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
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
    
    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}
```

## 6. Usage Examples

### Basic Upload

```typescript
import { uploadFileToGCS } from '@/utils/upload';

async function handleFileUpload(file: File) {
  try {
    const result = await uploadFileToGCS(file);
    console.log('Upload successful:', result.gcsUri);
    console.log('Public URL:', result.publicUrl);
    
    // Store the GCS URI for later use
    const gcsUri = result.gcsUri;
    
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### Upload with Progress

```typescript
import { uploadFileWithProgress } from '@/utils/upload';

async function handleFileUploadWithProgress(file: File) {
  try {
    const result = await uploadFileWithProgress(file, (progress) => {
      console.log(`Upload progress: ${progress.toFixed(1)}%`);
      // Update UI progress bar here
    });
    
    console.log('Upload completed:', result.gcsUri);
    
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### Multiple File Upload

```typescript
import { uploadFileToGCS } from '@/utils/upload';

async function handleMultipleFiles(files: File[]) {
  const uploadPromises = files.map(file => uploadFileToGCS(file));
  
  try {
    const results = await Promise.all(uploadPromises);
    const gcsUris = results.map(result => result.gcsUri);
    
    console.log('All files uploaded:', gcsUris);
    
  } catch (error) {
    console.error('Some uploads failed:', error);
  }
}
```

## 7. Bucket Configuration

### Make Bucket Publicly Readable

Since the code doesn't use object-level ACLs, you need to grant public read access at the bucket level:

```bash
# Command line
gsutil iam ch allUsers:objectViewer gs://your-bucket-name

# Or via Google Cloud Console:
# 1. Go to Cloud Storage > Buckets
# 2. Select your bucket
# 3. Permissions tab → Grant Access
# 4. Add 'allUsers' with role 'Storage Object Viewer'
```

### Service Account Permissions

Ensure your service account has:
- `Storage Object Admin` - for uploading files
- `Storage Object Viewer` - for reading files

## 8. Error Handling

The API returns structured errors:

```typescript
// 400 - Bad Request
{ error: 'No file provided' }

// 500 - Server Error
{ 
  error: 'Missing required environment variables',
  details: 'Please check your .env.local file'
}

// 500 - Upload Failed
{ 
  error: 'Upload failed', 
  details: 'Specific error message'
}
```

## 9. Security Considerations

- **Environment Variables**: Never commit `.env.local` to version control
- **Service Account**: Use least-privilege principle for service account permissions
- **File Validation**: Consider adding file type and size validation
- **Rate Limiting**: Implement rate limiting for production use
- **CORS**: Configure CORS if calling from different domains

## 10. Production Deployment

- Ensure environment variables are set in your deployment platform
- Consider using Google Cloud's default credentials instead of service account keys
- Monitor upload sizes and implement appropriate limits
- Use Cloud CDN for better performance if needed

## Summary

This integration provides:
- ✅ Simple file upload to GCS
- ✅ Returns both GCS URI (`gs://bucket/path`) and public HTTP URL
- ✅ Progress tracking capability
- ✅ Proper error handling
- ✅ TypeScript support
- ✅ No frontend dependencies

The returned `gcsUri` can be used for backend processing, while `publicUrl` provides direct access to the uploaded file. 